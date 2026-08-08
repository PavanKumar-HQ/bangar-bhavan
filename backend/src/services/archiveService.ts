import { prisma } from '../lib/prisma';

export const runAutoArchive = async (tenantId: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Find all orders older than 30 days
  const expiredOrders = await prisma.order.findMany({
    where: {
      tenantId,
      createdAt: {
        lt: thirtyDaysAgo
      }
    },
    include: {
      items: true
    }
  });

  if (expiredOrders.length === 0) {
    return { archivedCount: 0, periodLabel: 'N/A' };
  }

  const orderCount = expiredOrders.length;
  const totalAmount = expiredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const periodLabel = `Archive-${new Date().toISOString().slice(0, 7)}`;

  // Store serialized payload into Archive table
  const archiveRecord = await prisma.archive.create({
    data: {
      tenantId,
      periodLabel,
      orderCount,
      totalAmount,
      jsonData: JSON.stringify(expiredOrders)
    }
  });

  // Delete archived orders from live table
  const orderIds = expiredOrders.map((o) => o.id);
  await prisma.order.deleteMany({
    where: {
      id: { in: orderIds }
    }
  });

  return {
    archiveId: archiveRecord.id,
    archivedCount: orderCount,
    totalAmount,
    periodLabel
  };
};
