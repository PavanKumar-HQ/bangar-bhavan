import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, PaymentMode, CartItem, ShopSettings } from '../types';
import { api } from '../lib/api';
import { cacheMenuInDB, getMenuFromDB, saveOrderOfflineQueue } from '../lib/db';
import { MenuGrid } from '../components/billing/MenuGrid';
import { RunningBill } from '../components/billing/RunningBill';
import { PendingOrdersBar } from '../components/billing/PendingOrdersBar';
import { ReceiptPreviewModal } from '../components/common/ReceiptPreviewModal';
import { usePrinter } from '../context/PrinterContext';
import { useSync } from '../context/SyncContext';
import { sound } from '../lib/sound';

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
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [servedOrders, setServedOrders] = useState<Order[]>([]);
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
        setDishes(menuRes.data);
        setSettings(settingsRes.data);
        setPendingOrders(pendingRes.data);
        cacheMenuInDB(menuRes.data);
      } else {
        const offlineMenu = await getMenuFromDB();
        setDishes(offlineMenu);
      }
    } catch (err) {
      console.warn('Network request failed, retrieving cached menu from IndexedDB:', err);
      const offlineMenu = await getMenuFromDB();
      setDishes(offlineMenu);
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

  // GENERATE BILL FLOW
  const handleGenerateBill = async () => {
    if (cartItems.length === 0 || isSubmittingOrder) return;

    setIsSubmittingOrder(true);
    sound.playSuccess();

    const itemTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const parcelCharge = isParcel ? parcelChargeAmount : 0;
    const grandTotal = itemTotal + parcelCharge;

    const payload = {
      items: cartItems,
      subtotal: itemTotal,
      parcelCharge,
      grandTotal,
      paymentMode,
      isParcel
    };

    let createdOrder: Order;

    try {
      if (navigator.onLine) {
        const res = await api.post('/orders', payload);
        createdOrder = res.data;
        setPendingOrders((prev) => [...prev, createdOrder]);
      } else {
        // Offline Mode: Queue in IndexedDB
        const offlineRecord = await saveOrderOfflineQueue(payload);
        createdOrder = {
          id: offlineRecord.localId,
          tenantId: 'offline',
          invoiceNo: `OFFLINE-${Date.now().toString().slice(-4)}`,
          subtotal: itemTotal,
          parcelCharge,
          grandTotal,
          paymentMode,
          status: 'PENDING',
          isParcel,
          createdAt: new Date().toISOString(),
          items: cartItems
        };
        setPendingOrders((prev) => [...prev, createdOrder]);
      }

      // Open print receipt preview modal
      setPreviewOrder(createdOrder);

      // Bluetooth Print trigger (Non-blocking if printer connected)
      if (isConnected) {
        printReceipt(createdOrder, settings);
      }

      // Clear bill immediately for instant operator feedback
      setCartMap({});
      setIsParcel(false);
    } catch (err) {
      console.error('Order creation error:', err);
      // Fallback offline queue
      const offlineRecord = await saveOrderOfflineQueue(payload);
      createdOrder = {
        id: offlineRecord.localId,
        tenantId: 'offline',
        invoiceNo: `OFFLINE-${Date.now().toString().slice(-4)}`,
        subtotal: itemTotal,
        parcelCharge,
        grandTotal,
        paymentMode,
        status: 'PENDING',
        isParcel,
        createdAt: new Date().toISOString(),
        items: cartItems
      };
      setPendingOrders((prev) => [...prev, createdOrder]);
      setPreviewOrder(createdOrder);
      setCartMap({});
      setIsParcel(false);
    } finally {
      setIsSubmittingOrder(false);
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
      if (navigator.onLine && !orderId.startsWith('OFFLINE')) {
        await api.patch(`/orders/${orderId}`, { status: 'SERVED' });
      }
    } catch (err) {
      console.error('Failed to update pending order status:', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] gap-3 p-2.5 sm:p-4 overflow-hidden max-w-[1600px] mx-auto w-full">
      {/* Pending Orders Strip */}
      <PendingOrdersBar pendingOrders={pendingOrders} servedOrders={servedOrders} onMarkReady={handleMarkReady} />

      {/* Main Billing Split: Menu Grid (Left 65%) vs Running Bill (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 overflow-hidden">
        {/* Menu Grid */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
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
