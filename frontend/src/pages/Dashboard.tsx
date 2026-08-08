import React, { useState, useEffect } from 'react';
import { DashboardMetrics, Order } from '../types';
import { api } from '../lib/api';
import { getLocalHistoryFromDB } from '../lib/db';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  Award,
  Calendar,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'TODAY' | 'MONTH'>('TODAY');

  const DEFAULT_FALLBACK_DASHBOARD: DashboardMetrics = {
    today: {
      revenue: 0,
      orders: 0,
      pending: 0,
      served: 0,
      avgBill: 0,
      parcelCount: 0,
      topSellingDish: 'None'
    },
    month: {
      revenue: 0,
      orders: 0,
      avgBill: 0,
      prevRevenue: 0,
      growthPercentage: 0
    },
    charts: {
      revenueByHour: [
        { hour: '09:00', revenue: 0, orders: 0 },
        { hour: '12:00', revenue: 0, orders: 0 },
        { hour: '15:00', revenue: 0, orders: 0 },
        { hour: '18:00', revenue: 0, orders: 0 },
        { hour: '21:00', revenue: 0, orders: 0 }
      ],
      weeklyRevenue: [
        { day: 'Mon', revenue: 0, orders: 0 },
        { day: 'Tue', revenue: 0, orders: 0 },
        { day: 'Wed', revenue: 0, orders: 0 },
        { day: 'Thu', revenue: 0, orders: 0 },
        { day: 'Fri', revenue: 0, orders: 0 },
        { day: 'Sat', revenue: 0, orders: 0 },
        { day: 'Sun', revenue: 0, orders: 0 }
      ],
      topSellingDishes: [],
      paymentDistribution: [
        { mode: 'CASH', value: 0 },
        { mode: 'UPI', value: 0 },
        { mode: 'CARD', value: 0 }
      ]
    }
  };

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        const res = await api.get('/dashboard');
        if (res.data && res.data.today && res.data.charts) {
          setData(res.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dashboard metrics from server, loading offline metrics:', err);
    }

    // Compute metrics from local history & localStorage orders
    try {
      const localHistory = await getLocalHistoryFromDB();
      const savedPendingStr = localStorage.getItem('bbc_pending_orders');
      const savedPending: Order[] = savedPendingStr ? JSON.parse(savedPendingStr) : [];
      const savedServedStr = localStorage.getItem('bbc_served_orders');
      const savedServed: Order[] = savedServedStr ? JSON.parse(savedServedStr) : [];

      const allOrdersMap = new Map<string, Order>();
      localHistory.forEach((o) => allOrdersMap.set(o.id, o));
      savedPending.forEach((o) => allOrdersMap.set(o.id, o));
      savedServed.forEach((o) => allOrdersMap.set(o.id, o));

      const allOrders = Array.from(allOrdersMap.values());
      const todayStr = new Date().toISOString().split('T')[0];
      const todayOrders = allOrders.filter(
        (o) => o.createdAt && o.createdAt.startsWith(todayStr)
      );

      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const totalOrdersCount = todayOrders.length;
      const pendingCount = todayOrders.filter((o) => o.status === 'PENDING').length;
      const servedCount = todayOrders.filter((o) => o.status === 'SERVED').length;
      const avgBill = totalOrdersCount > 0 ? Math.round(todayRevenue / totalOrdersCount) : 0;
      const parcelCount = todayOrders.filter((o) => o.isParcel).length;

      // Calculate dish counts
      const dishCountMap: Record<string, { qty: number; revenue: number }> = {};
      todayOrders.forEach((o) => {
        (o.items || []).forEach((item) => {
          if (!dishCountMap[item.name]) {
            dishCountMap[item.name] = { qty: 0, revenue: 0 };
          }
          dishCountMap[item.name].qty += item.quantity;
          dishCountMap[item.name].revenue += item.price * item.quantity;
        });
      });

      const topDishesArray = Object.entries(dishCountMap)
        .map(([name, stat]) => ({ name, qty: stat.qty, revenue: stat.revenue }))
        .sort((a, b) => b.qty - a.qty);

      const topSellingDish = topDishesArray.length > 0 ? topDishesArray[0].name : 'None';

      // Payment distribution
      let cashTotal = 0;
      let upiTotal = 0;
      let cardTotal = 0;
      todayOrders.forEach((o) => {
        if (o.paymentMode === 'CASH') cashTotal += o.grandTotal || 0;
        else if (o.paymentMode === 'UPI') upiTotal += o.grandTotal || 0;
        else if (o.paymentMode === 'CARD') cardTotal += o.grandTotal || 0;
      });

      // Hourly breakdown
      const hourlyMap: Record<string, { revenue: number; orders: number }> = {
        '09:00': { revenue: 0, orders: 0 },
        '12:00': { revenue: 0, orders: 0 },
        '15:00': { revenue: 0, orders: 0 },
        '18:00': { revenue: 0, orders: 0 },
        '21:00': { revenue: 0, orders: 0 }
      };

      todayOrders.forEach((o) => {
        if (!o.createdAt) return;
        const hourNum = new Date(o.createdAt).getHours();
        let slot = '09:00';
        if (hourNum >= 21) slot = '21:00';
        else if (hourNum >= 18) slot = '18:00';
        else if (hourNum >= 15) slot = '15:00';
        else if (hourNum >= 12) slot = '12:00';

        hourlyMap[slot].revenue += o.grandTotal || 0;
        hourlyMap[slot].orders += 1;
      });

      const revenueByHour = Object.entries(hourlyMap).map(([hour, val]) => ({
        hour,
        revenue: val.revenue,
        orders: val.orders
      }));

      // Weekly breakdown
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyMap: Record<string, { revenue: number; orders: number }> = {
        Mon: { revenue: 0, orders: 0 },
        Tue: { revenue: 0, orders: 0 },
        Wed: { revenue: 0, orders: 0 },
        Thu: { revenue: 0, orders: 0 },
        Fri: { revenue: 0, orders: 0 },
        Sat: { revenue: 0, orders: 0 },
        Sun: { revenue: 0, orders: 0 }
      };

      allOrders.forEach((o) => {
        if (!o.createdAt) return;
        const dayName = days[new Date(o.createdAt).getDay()];
        if (weeklyMap[dayName]) {
          weeklyMap[dayName].revenue += o.grandTotal || 0;
          weeklyMap[dayName].orders += 1;
        }
      });

      const weeklyRevenue = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
        day,
        revenue: weeklyMap[day].revenue,
        orders: weeklyMap[day].orders
      }));

      setData({
        today: {
          revenue: todayRevenue,
          orders: totalOrdersCount,
          pending: pendingCount,
          served: servedCount,
          avgBill,
          parcelCount,
          topSellingDish
        },
        month: {
          revenue: todayRevenue,
          orders: totalOrdersCount,
          avgBill,
          prevRevenue: 0,
          growthPercentage: 0
        },
        charts: {
          revenueByHour,
          weeklyRevenue,
          topSellingDishes: topDishesArray.slice(0, 5),
          paymentDistribution: [
            { mode: 'CASH', value: cashTotal },
            { mode: 'UPI', value: upiTotal },
            { mode: 'CARD', value: cardTotal }
          ]
        }
      });
    } catch {
      setData(DEFAULT_FALLBACK_DASHBOARD);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <div className="h-8 bg-cream-200 w-48 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-cream-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const COLORS = ['#166534', '#991B1B', '#C2410C'];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-cream-300 shadow-sm">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-darkbrown-900">
            Business Analytics & Performance
          </h1>
          <p className="text-xs text-darkbrown-600 font-medium">Real-time revenue, top dishes, and sales velocity</p>
        </div>

        <div className="flex items-center bg-cream-100 p-1 rounded-xl border border-cream-300">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'TODAY'
                ? 'bg-deepred-800 text-cream-50 shadow-sm'
                : 'text-darkbrown-800 hover:text-deepred-800'
            }`}
          >
            Today's View
          </button>
          <button
            onClick={() => setActiveTab('MONTH')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'MONTH'
                ? 'bg-deepred-800 text-cream-50 shadow-sm'
                : 'text-darkbrown-800 hover:text-deepred-800'
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {activeTab === 'TODAY' ? (
        <>
          {/* Today KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Revenue */}
            <div className="bg-white p-4 rounded-xl border-2 border-cream-300 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-darkbrown-500 uppercase tracking-wider">Today's Revenue</span>
                <div className="p-2 bg-successgreen-800 text-white rounded-lg">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <p className="font-mono font-black text-2xl sm:text-3xl text-darkbrown-900">
                ₹{data.today.revenue}
              </p>
              <p className="text-[11px] font-bold text-successgreen-700">Live active counter sales</p>
            </div>

            {/* Orders Count */}
            <div className="bg-white p-4 rounded-xl border-2 border-cream-300 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-darkbrown-500 uppercase tracking-wider">Total Orders</span>
                <div className="p-2 bg-deepred-800 text-white rounded-lg">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="font-mono font-black text-2xl sm:text-3xl text-darkbrown-900">
                {data.today.orders}
              </p>
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="text-warmorange-700">{data.today.pending} Pending</span>
                <span>•</span>
                <span className="text-successgreen-700">{data.today.served} Served</span>
              </div>
            </div>

            {/* Avg Bill */}
            <div className="bg-white p-4 rounded-xl border-2 border-cream-300 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-darkbrown-500 uppercase tracking-wider">Average Bill</span>
                <div className="p-2 bg-darkbrown-900 text-softyellow-200 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="font-mono font-black text-2xl sm:text-3xl text-darkbrown-900">
                ₹{data.today.avgBill}
              </p>
              <p className="text-[11px] font-bold text-darkbrown-600">Per order average spending</p>
            </div>

            {/* Top Dish */}
            <div className="bg-white p-4 rounded-xl border-2 border-cream-300 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-darkbrown-500 uppercase tracking-wider">Top Selling Dish</span>
                <div className="p-2 bg-softyellow-300 text-darkbrown-900 rounded-lg">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <p className="font-display font-black text-lg sm:text-xl text-darkbrown-900 truncate" title={data.today.topSellingDish}>
                {data.today.topSellingDish}
              </p>
              <p className="text-[11px] font-bold text-warmorange-700">Parcels: {data.today.parcelCount} orders</p>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue & Orders by Hour Line Chart */}
            <div className="bg-white p-4 rounded-xl border-2 border-cream-300 shadow-sm space-y-3">
              <h3 className="font-display font-black text-base text-darkbrown-900">Revenue & Orders by Hour</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.revenueByHour}>
                    <XAxis dataKey="hour" stroke="#78350F" fontSize={11} />
                    <YAxis stroke="#78350F" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#991B1B" strokeWidth={3} dot={{ r: 3 }} name="Revenue (₹)" />
                    <Line type="monotone" dataKey="orders" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} name="Orders Count" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Revenue Bar Chart */}
            <div className="bg-white p-4 rounded-xl border-2 border-cream-300 shadow-sm space-y-3">
              <h3 className="font-display font-black text-base text-darkbrown-900">Weekly Sales Velocity (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.weeklyRevenue}>
                    <XAxis dataKey="day" stroke="#78350F" fontSize={11} />
                    <YAxis stroke="#78350F" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#991B1B" radius={[6, 6, 0, 0]} name="Daily Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Selling Dishes Ranking */}
            <div className="bg-white p-4 rounded-xl border-2 border-cream-300 shadow-sm space-y-3">
              <h3 className="font-display font-black text-base text-darkbrown-900">Top Selling Dishes Ranking</h3>
              <div className="space-y-2">
                {data.charts.topSellingDishes.map((dish, idx) => (
                  <div key={dish.name} className="flex items-center justify-between p-2 rounded-lg bg-cream-50 border border-cream-200">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-deepred-800 text-cream-50 font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-sm text-darkbrown-900">{dish.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono font-bold">
                      <span className="text-darkbrown-600">{dish.qty} pcs</span>
                      <span className="text-deepred-800">₹{dish.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Mode Distribution Pie Chart */}
            <div className="bg-white p-4 rounded-xl border-2 border-cream-300 shadow-sm space-y-3 flex flex-col justify-between">
              <h3 className="font-display font-black text-base text-darkbrown-900">Payment Mode Breakdown</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.paymentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.charts.paymentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-cream-200">
                {data.charts.paymentDistribution.map((item, idx) => (
                  <div key={item.mode} className="p-2 rounded bg-cream-50">
                    <span className="block text-[10px] font-black text-darkbrown-500">{item.mode}</span>
                    <span className="font-mono font-bold text-sm text-darkbrown-900">₹{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Month View & Growth Analysis */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border-2 border-cream-300 shadow-sm space-y-2">
              <span className="text-xs font-black text-darkbrown-500 uppercase tracking-wider">Monthly Revenue</span>
              <p className="font-mono font-black text-3xl text-deepred-800">₹{data.month.revenue}</p>
              <p className="text-xs font-bold text-darkbrown-600">Total revenue generated this month</p>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-cream-300 shadow-sm space-y-2">
              <span className="text-xs font-black text-darkbrown-500 uppercase tracking-wider">Monthly Orders</span>
              <p className="font-mono font-black text-3xl text-darkbrown-900">{data.month.orders}</p>
              <p className="text-xs font-bold text-darkbrown-600">Average ticket size: ₹{data.month.avgBill}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-cream-300 shadow-sm space-y-2">
              <span className="text-xs font-black text-darkbrown-500 uppercase tracking-wider">MoM Growth vs Last Month</span>
              <p className={`font-mono font-black text-3xl ${data.month.growthPercentage >= 0 ? 'text-successgreen-700' : 'text-deepred-800'}`}>
                {data.month.growthPercentage >= 0 ? `+${data.month.growthPercentage}%` : `${data.month.growthPercentage}%`}
              </p>
              <p className="text-xs font-bold text-darkbrown-600">Previous month total: ₹{data.month.prevRevenue}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
