import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;

    // 1. Today Boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Month Boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // Prev Month Boundaries
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Fetch Today's Orders
    const todayOrders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      include: { items: true }
    });

    // Today's Key Metrics
    const activeTodayOrders = todayOrders.filter((o) => o.status !== 'CANCELLED');
    const todayRevenue = activeTodayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const todayOrderCount = activeTodayOrders.length;
    const pendingOrderCount = todayOrders.filter((o) => o.status === 'PENDING').length;
    const servedOrderCount = todayOrders.filter((o) => o.status === 'SERVED').length;
    const parcelOrderCount = activeTodayOrders.filter((o) => o.isParcel).length;
    const avgBillValue = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;

    // Item sales breakdown today
    const dishSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    activeTodayOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!dishSalesMap[item.name]) {
          dishSalesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
        }
        dishSalesMap[item.name].qty += item.quantity;
        dishSalesMap[item.name].revenue += item.quantity * item.price;
      });
    });

    const topSellingDishesToday = Object.values(dishSalesMap).sort((a, b) => b.qty - a.qty);
    const topSellingDishToday = topSellingDishesToday[0] ? topSellingDishesToday[0].name : 'N/A';

    // 2. Revenue by Hour (0 to 23)
    const hourlyDataMap: Record<number, { hour: string; revenue: number; orders: number }> = {};
    for (let h = 0; h < 24; h++) {
      const hourLabel = `${h.toString().padStart(2, '0')}:00`;
      hourlyDataMap[h] = { hour: hourLabel, revenue: 0, orders: 0 };
    }

    activeTodayOrders.forEach((order) => {
      const h = new Date(order.createdAt).getHours();
      hourlyDataMap[h].revenue += order.grandTotal;
      hourlyDataMap[h].orders += 1;
    });

    const revenueByHour = Object.values(hourlyDataMap);

    // 3. Weekly Revenue (Last 7 Days)
    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(now.getDate() - 6);
    last7DaysStart.setHours(0, 0, 0, 0);

    const weekOrders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: last7DaysStart },
        status: { not: 'CANCELLED' }
      }
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyDataMap: Record<string, { day: string; revenue: number; orders: number }> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(last7DaysStart);
      d.setDate(last7DaysStart.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = `${dayNames[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`;
      weeklyDataMap[dateKey] = { day: dayLabel, revenue: 0, orders: 0 };
    }

    weekOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toISOString().split('T')[0];
      if (weeklyDataMap[dateKey]) {
        weeklyDataMap[dateKey].revenue += o.grandTotal;
        weeklyDataMap[dateKey].orders += 1;
      }
    });

    const weeklyRevenue = Object.values(weeklyDataMap);

    // 4. Payment Mode Distribution
    const paymentModeMap = { CASH: 0, UPI: 0, CARD: 0 };
    activeTodayOrders.forEach((o) => {
      if (o.paymentMode in paymentModeMap) {
        paymentModeMap[o.paymentMode as keyof typeof paymentModeMap] += o.grandTotal;
      }
    });

    const paymentDistribution = [
      { mode: 'Cash', value: paymentModeMap.CASH },
      { mode: 'UPI', value: paymentModeMap.UPI },
      { mode: 'Card', value: paymentModeMap.CARD }
    ];

    // 5. Month View Metrics & Comparison
    const [monthOrders, prevMonthOrders] = await Promise.all([
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
        include: { items: true }
      }),
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd }, status: { not: 'CANCELLED' } }
      })
    ]);

    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const monthOrderCount = monthOrders.length;
    const monthAvgBill = monthOrderCount > 0 ? monthRevenue / monthOrderCount : 0;

    const prevMonthRevenue = prevMonthOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const prevMonthOrderCount = prevMonthOrders.length;

    const monthGrowth = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 100;

    return res.json({
      today: {
        revenue: todayRevenue,
        orders: todayOrderCount,
        pending: pendingOrderCount,
        served: servedOrderCount,
        avgBill: Math.round(avgBillValue),
        parcelCount: parcelOrderCount,
        topSellingDish: topSellingDishToday
      },
      month: {
        revenue: monthRevenue,
        orders: monthOrderCount,
        avgBill: Math.round(monthAvgBill),
        prevRevenue: prevMonthRevenue,
        growthPercentage: parseFloat(monthGrowth.toFixed(1))
      },
      charts: {
        revenueByHour,
        weeklyRevenue,
        topSellingDishes: topSellingDishesToday.slice(0, 8),
        paymentDistribution
      }
    });
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    return res.status(500).json({ error: 'Failed to generate dashboard metrics' });
  }
};
