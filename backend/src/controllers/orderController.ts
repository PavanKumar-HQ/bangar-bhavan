import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const generateInvoiceNumber = async (tenantId: string): Promise<string> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const countToday = await prisma.order.count({
    where: {
      tenantId,
      createdAt: {
        gte: todayStart
      }
    }
  });

  const sequence = (countToday + 1).toString().padStart(3, '0');
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `BBC-${dateStr}-${sequence}`;
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { items, subtotal, parcelCharge, grandTotal, paymentMode, isParcel, syncedFromApp } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const invoiceNo = await generateInvoiceNumber(tenantId);

    const order = await prisma.order.create({
      data: {
        tenantId,
        invoiceNo,
        subtotal: parseFloat(subtotal),
        parcelCharge: parseFloat(parcelCharge || 0),
        grandTotal: parseFloat(grandTotal),
        paymentMode: paymentMode || 'CASH',
        isParcel: Boolean(isParcel),
        status: 'PENDING',
        syncedFromApp: Boolean(syncedFromApp),
        items: {
          create: items.map((item: any) => ({
            dishId: item.dishId || item.id,
            name: item.name,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity)
          }))
        }
      },
      include: {
        items: true
      }
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getPendingOrders = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        createdAt: {
          gte: todayStart
        }
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return res.json(orders);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { id } = req.params;
    const { status } = req.body; // SERVED or CANCELLED

    if (!['PENDING', 'SERVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const order = await prisma.order.findFirst({
      where: { id, tenantId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        servedAt: status === 'SERVED' ? new Date() : order.servedAt
      },
      include: {
        items: true
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
};
