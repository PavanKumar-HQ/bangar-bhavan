export interface User {
  id: string;
  username: string;
  name: string;
  tenantId: string;
  shopName: string;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  name: string;
  price: number;
  category: string;
  displayOrder: number;
  isActive: boolean;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: string;
  dishId?: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMode = 'CASH' | 'UPI' | 'CARD';
export type OrderStatus = 'PENDING' | 'SERVED' | 'CANCELLED';

export interface Order {
  id: string;
  tenantId: string;
  invoiceNo: string;
  subtotal: number;
  parcelCharge: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  status: OrderStatus;
  isParcel: boolean;
  createdAt: string;
  servedAt?: string | null;
  syncedFromApp?: boolean;
  items: OrderItem[];
}

export interface ShopSettings {
  id: string;
  tenantId: string;
  shopName: string;
  address: string;
  phone: string;
  footerText: string;
  parcelCharge: number;
  currency: string;
  updatedAt?: string;
}

export interface DashboardMetrics {
  today: {
    revenue: number;
    orders: number;
    pending: number;
    served: number;
    avgBill: number;
    parcelCount: number;
    topSellingDish: string;
  };
  month: {
    revenue: number;
    orders: number;
    avgBill: number;
    prevRevenue: number;
    growthPercentage: number;
  };
  charts: {
    revenueByHour: { hour: string; revenue: number; orders: number }[];
    weeklyRevenue: { day: string; revenue: number; orders: number }[];
    topSellingDishes: { name: string; qty: number; revenue: number }[];
    paymentDistribution: { mode: string; value: number }[];
  };
}

export interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
}
