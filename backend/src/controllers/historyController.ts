import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { startDate, endDate, search, paymentMode, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const sDate = new Date(startDate as string);
        sDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = sDate;
      }
      if (endDate) {
        const eDate = new Date(endDate as string);
        eDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = eDate;
      }
    }

    if (paymentMode && paymentMode !== 'ALL') {
      where.paymentMode = paymentMode;
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search as string } },
        { items: { some: { name: { contains: search as string } } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.order.count({ where })
    ]);

    return res.json({
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch order history' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, tenantId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await prisma.order.delete({
      where: { id }
    });

    return res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ error: 'Failed to delete order' });
  }
};

export const exportHistoryCSV = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { startDate, endDate } = req.query;

    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const sDate = new Date(startDate as string);
        sDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = sDate;
      }
      if (endDate) {
        const eDate = new Date(endDate as string);
        eDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = eDate;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    let csvContent = 'Invoice No,Date,Time,Payment Mode,Is Parcel,Subtotal,Parcel Charge,Grand Total,Status,Items\n';

    orders.forEach((o) => {
      const dateStr = new Date(o.createdAt).toLocaleDateString();
      const timeStr = new Date(o.createdAt).toLocaleTimeString();
      const itemsSummary = o.items.map((i) => `${i.name} (${i.quantity}x₹${i.price})`).join(' | ');
      const escapedItems = `"${itemsSummary.replace(/"/g, '""')}"`;

      csvContent += `${o.invoiceNo},${dateStr},${timeStr},${o.paymentMode},${o.isParcel ? 'YES' : 'NO'},${o.subtotal},${o.parcelCharge},${o.grandTotal},${o.status},${escapedItems}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=billing_history_${Date.now()}.csv`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({ error: 'Failed to export history CSV' });
  }
};
