import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { runAutoArchive } from '../services/archiveService';

export const triggerArchive = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const result = await runAutoArchive(tenantId);
    return res.json(result);
  } catch (error) {
    console.error('Archive error:', error);
    return res.status(500).json({ error: 'Failed to execute auto-archiving' });
  }
};

export const getArchives = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const archives = await prisma.archive.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        periodLabel: true,
        orderCount: true,
        totalAmount: true,
        createdAt: true
      }
    });

    return res.json(archives);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch archives' });
  }
};

export const exportArchiveFile = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const archive = await prisma.archive.findFirst({
      where: { id, tenantId }
    });

    if (!archive) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    const orders = JSON.parse(archive.jsonData);

    if (format === 'csv') {
      let csvContent = 'Invoice No,Date,Time,Payment Mode,Is Parcel,Subtotal,Parcel Charge,Grand Total,Status,Items\n';
      orders.forEach((o: any) => {
        const dateStr = new Date(o.createdAt).toLocaleDateString();
        const timeStr = new Date(o.createdAt).toLocaleTimeString();
        const itemsSummary = o.items ? o.items.map((i: any) => `${i.name} (${i.quantity}x₹${i.price})`).join(' | ') : '';
        const escapedItems = `"${itemsSummary.replace(/"/g, '""')}"`;

        csvContent += `${o.invoiceNo},${dateStr},${timeStr},${o.paymentMode},${o.isParcel ? 'YES' : 'NO'},${o.subtotal},${o.parcelCharge},${o.grandTotal},${o.status},${escapedItems}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=archive_${archive.periodLabel}.csv`);
      return res.send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=archive_${archive.periodLabel}.json`);
    return res.send(archive.jsonData);
  } catch (error) {
    console.error('Error exporting archive:', error);
    return res.status(500).json({ error: 'Failed to export archive' });
  }
};

export const restoreArchive = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { id } = req.params;

    const archive = await prisma.archive.findFirst({
      where: { id, tenantId }
    });

    if (!archive) {
      return res.status(404).json({ error: 'Archive record not found' });
    }

    const orders = JSON.parse(archive.jsonData);

    // Re-insert orders back into live table
    for (const orderData of orders) {
      const { items, ...orderFields } = orderData;
      
      const existing = await prisma.order.findUnique({
        where: { invoiceNo: orderFields.invoiceNo }
      });

      if (!existing) {
        await prisma.order.create({
          data: {
            ...orderFields,
            tenantId,
            createdAt: new Date(orderFields.createdAt),
            servedAt: orderFields.servedAt ? new Date(orderFields.servedAt) : null,
            items: {
              create: items.map((i: any) => ({
                dishId: i.dishId,
                name: i.name,
                price: parseFloat(i.price),
                quantity: parseInt(i.quantity)
              }))
            }
          }
        });
      }
    }

    // Delete archive record after successful restoration
    await prisma.archive.delete({
      where: { id }
    });

    return res.json({ message: `Successfully restored ${orders.length} orders from archive ${archive.periodLabel}` });
  } catch (error) {
    console.error('Error restoring archive:', error);
    return res.status(500).json({ error: 'Failed to restore archive' });
  }
};
