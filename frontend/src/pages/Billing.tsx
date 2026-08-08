import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, PaymentMode, CartItem, ShopSettings } from '../types';
import { api } from '../lib/api';
import { cacheMenuInDB, getMenuFromDB, saveOrderOfflineQueue, getShopSettingsLocal, saveShopSettingsLocal, saveOrderToLocalHistory } from '../lib/db';
import { MenuGrid } from '../components/billing/MenuGrid';
import { RunningBill } from '../components/billing/RunningBill';
import { PendingOrdersBar } from '../components/billing/PendingOrdersBar';
import { ReceiptPreviewModal } from '../components/common/ReceiptPreviewModal';
import { usePrinter } from '../context/PrinterContext';
import { useSync } from '../context/SyncContext';
import { sound } from '../lib/sound';

const DEFAULT_FALLBACK_DISHES: MenuItem[] = [
  { id: 'bb_m01', tenantId: 'default', name: 'Pani Puri (6 pcs)', category: 'PURI', price: 40, isActive: true, isFavorite: true, displayOrder: 1 },
  { id: 'bb_m02', tenantId: 'default', name: 'Masala Puri', category: 'PURI', price: 50, isActive: true, isFavorite: true, displayOrder: 2 },
  { id: 'bb_m03', tenantId: 'default', name: 'Sev Puri', category: 'PURI', price: 50, isActive: true, isFavorite: true, displayOrder: 3 },
  { id: 'bb_m04', tenantId: 'default', name: 'Dahi Puri', category: 'PURI', price: 60, isActive: true, isFavorite: false, displayOrder: 4 },
  { id: 'bb_m05', tenantId: 'default', name: 'Bhel Puri', category: 'CHAT', price: 50, isActive: true, isFavorite: false, displayOrder: 5 },
  { id: 'bb_m06', tenantId: 'default', name: 'Samosa Masala', category: 'CHAT', price: 45, isActive: true, isFavorite: false, displayOrder: 6 },
  { id: 'bb_m07', tenantId: 'default', name: 'Aloo Tikki Chat', category: 'CHAT', price: 55, isActive: true, isFavorite: false, displayOrder: 7 },
  { id: 'bb_m08', tenantId: 'default', name: 'Vada Pav (2 pcs)', category: 'SNACKS', price: 40, isActive: true, isFavorite: false, displayOrder: 8 },
  { id: 'bb_m09', tenantId: 'default', name: 'Pav Bhaji', category: 'SNACKS', price: 90, isActive: true, isFavorite: false, displayOrder: 9 },
  { id: 'bb_m10', tenantId: 'default', name: 'Rose Milk (Chilled)', category: 'BEVERAGES', price: 35, isActive: true, isFavorite: false, displayOrder: 10 }
];

export const Billing: React.FC = () => {
  const { printReceipt, isConnected } = usePrinter();
  const { isOnline } = useSync();

  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<ShopSettings | undefined>(undefined);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [cartMap, setCartMap] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('bbc_draft_cart');
    return saved ? JSON.parse(saved) : {};
  });

  const [isParcel, setIsParcel] = useState<boolean>(() => {
    return localStorage.getItem('bbc_draft_parcel') === 'true';
  });

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [pendingOrders, setPendingOrders] = useState<Order[]>(() => {
    // Restore pending orders across page refresh so orders never disappear
    try {
      const saved = localStorage.getItem('bbc_pending_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [servedOrders, setServedOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('bbc_served_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // 1. Fetch Menu & Settings & Live Pending Orders
  const loadInitialData = async () => {
    setIsLoadingMenu(true);
    try {
      if (navigator.onLine) {
        const [menuRes, settingsRes, pendingRes] = await Promise.all([
          api.get('/menu'),
          api.get('/settings'),
          api.get('/orders/pending')
        ]);
        if (Array.isArray(menuRes.data) && menuRes.data.length > 0) {
          setDishes(menuRes.data);
          cacheMenuInDB(menuRes.data);
        } else {
          const offlineMenu = await getMenuFromDB();
          setDishes(offlineMenu.length > 0 ? offlineMenu : DEFAULT_FALLBACK_DISHES);
        }
        if (settingsRes?.data) {
          setSettings(settingsRes.data);
          saveShopSettingsLocal(settingsRes.data);
        } else {
          setSettings(getShopSettingsLocal());
        }
        if (Array.isArray(pendingRes?.data)) setPendingOrders(pendingRes.data);
      } else {
        const offlineMenu = await getMenuFromDB();
        setDishes(offlineMenu.length > 0 ? offlineMenu : DEFAULT_FALLBACK_DISHES);
        setSettings(getShopSettingsLocal());
      }
    } catch (err) {
      console.warn('Network request failed, retrieving cached menu from IndexedDB:', err);
      setSettings(getShopSettingsLocal());
      try {
        const offlineMenu = await getMenuFromDB();
        setDishes(offlineMenu.length > 0 ? offlineMenu : DEFAULT_FALLBACK_DISHES);
      } catch {
        setDishes(DEFAULT_FALLBACK_DISHES);
      }
    } finally {
      setIsLoadingMenu(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Save Draft Cart to localStorage
  useEffect(() => {
    localStorage.setItem('bbc_draft_cart', JSON.stringify(cartMap));
    localStorage.setItem('bbc_draft_parcel', String(isParcel));
  }, [cartMap, isParcel]);

  // Persist pending & served orders to localStorage so they survive refresh
  useEffect(() => {
    localStorage.setItem('bbc_pending_orders', JSON.stringify(pendingOrders));
  }, [pendingOrders]);

  useEffect(() => {
    localStorage.setItem('bbc_served_orders', JSON.stringify(servedOrders.slice(0, 20)));
  }, [servedOrders]);

  // Keyboard Shortcuts for Speed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter' && e.ctrlKey) {
        handleGenerateBill();
      } else if (e.key === 'Escape') {
        handleClearBill();
      } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        setIsParcel((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartMap, isParcel, paymentMode, dishes, settings]);

  // Item Adjustments
  const handleIncrease = (dish: MenuItem) => {
    setCartMap((prev) => ({
      ...prev,
      [dish.id]: (prev[dish.id] || 0) + 1
    }));
  };

  const handleDecrease = (dish: MenuItem) => {
    setCartMap((prev) => {
      const current = prev[dish.id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[dish.id];
        return next;
      }
      return { ...prev, [dish.id]: current - 1 };
    });
  };

  const handleReset = (dish: MenuItem) => {
    setCartMap((prev) => {
      const next = { ...prev };
      delete next[dish.id];
      return next;
    });
  };

  const handleClearBill = () => {
    sound.playTap();
    setCartMap({});
    setIsParcel(false);
    setPaymentMode('CASH');
  };

  // Convert cartMap into CartItems array
  const cartItems: CartItem[] = useMemo(() => {
    return Object.entries(cartMap)
      .map(([dishId, quantity]) => {
        const dish = dishes.find((d) => d.id === dishId);
        if (!dish || quantity <= 0) return null;
        return {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity
        };
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartMap, dishes]);

  const parcelChargeAmount = settings?.parcelCharge || 5;

  // GENERATE BILL FLOW — always adds to pendingOrders first, never crashes
  const handleGenerateBill = async () => {
    if (cartItems.length === 0 || isSubmittingOrder) return;

    setIsSubmittingOrder(true);
    sound.playSuccess();

    const itemTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const parcelCharge = isParcel ? parcelChargeAmount : 0;
    const grandTotal = itemTotal + parcelCharge;
    const localId = `LOCAL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Create local order immediately — this ALWAYS gets shown in pending queue
    const localOrder: Order = {
      id: localId,
      tenantId: 'local',
      invoiceNo: `BBC-${Date.now().toString().slice(-5)}`,
      subtotal: itemTotal,
      parcelCharge,
      grandTotal,
      paymentMode,
      status: 'PENDING',
      isParcel,
      createdAt: new Date().toISOString(),
      items: cartItems
    };

    // Step 1: Immediately add to pending queue & clear cart
    setPendingOrders((prev) => [...prev, localOrder]);
    saveOrderToLocalHistory(localOrder);
    setPreviewOrder(localOrder);
    setCartMap({});
    setIsParcel(false);
    setIsSubmittingOrder(false);

    // Bluetooth Print (non-blocking)
    if (isConnected) {
      printReceipt(localOrder, settings);
    }

    // Step 2: Try to sync to server in background (non-blocking, no crash)
    const payload = {
      items: cartItems,
      subtotal: itemTotal,
      parcelCharge,
      grandTotal,
      paymentMode,
      isParcel
    };

    try {
      if (navigator.onLine) {
        const res = await api.post('/orders', payload);
        if (res?.data?.id) {
          // Update local order with server-assigned ID and invoiceNo
          setPendingOrders((prev) =>
            prev.map((o) => (o.id === localId ? { ...res.data, status: 'PENDING' } : o))
          );
        }
      } else {
        // Queue in IndexedDB for later sync
        try {
          await saveOrderOfflineQueue({ ...payload, localId });
        } catch (dbErr) {
          console.warn('IndexedDB queue failed, order stays local:', dbErr);
        }
      }
    } catch (apiErr) {
      console.warn('Server sync failed, order stays in local pending queue:', apiErr);
      // Try background IndexedDB queue silently
      try {
        await saveOrderOfflineQueue({ ...payload, localId });
      } catch {
        // Both failed — order is still visible in pendingOrders state, no crash
      }
    }
  };

  // Mark Pending Order Ready / Served
  const handleMarkReady = async (orderId: string) => {
    const targetOrder = pendingOrders.find((o) => o.id === orderId);
    if (targetOrder) {
      const servedRecord = { ...targetOrder, status: 'SERVED' as const, servedAt: new Date().toISOString() };
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
      setServedOrders((prev) => [servedRecord, ...prev]);
    }
    try {
      if (navigator.onLine && !orderId.startsWith('OFFLINE') && !orderId.startsWith('LOCAL')) {
        await api.patch(`/orders/${orderId}`, { status: 'SERVED' });
      }
    } catch (err) {
      console.error('Failed to update pending order status:', err);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-2.5 sm:p-4 max-w-[1600px] mx-auto w-full pb-24">
      {/* Pending Orders Strip */}
      <PendingOrdersBar pendingOrders={pendingOrders} servedOrders={servedOrders} onMarkReady={handleMarkReady} />

      {/* Main Billing Split: Menu Grid vs Running Bill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Menu Grid */}
        <div className="lg:col-span-8 flex flex-col min-h-[450px] lg:h-full overflow-hidden">
          <MenuGrid
            dishes={dishes}
            cartMap={cartMap}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onReset={handleReset}
            isLoading={isLoadingMenu}
          />
        </div>

        {/* Running Bill Workspace */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          <RunningBill
            items={cartItems}
            isParcel={isParcel}
            parcelChargeAmount={parcelChargeAmount}
            paymentMode={paymentMode}
            onToggleParcel={setIsParcel}
            onSelectPaymentMode={setPaymentMode}
            onGenerateBill={handleGenerateBill}
            onClearBill={handleClearBill}
            isSubmitting={isSubmittingOrder}
          />
        </div>
      </div>

      {/* Thermal Receipt Print Preview Modal */}
      <ReceiptPreviewModal
        order={previewOrder}
        settings={settings}
        isOpen={Boolean(previewOrder)}
        onClose={() => setPreviewOrder(null)}
      />
    </div>
  );
};
