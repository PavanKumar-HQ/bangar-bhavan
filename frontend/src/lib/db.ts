import { MenuItem, Order, ShopSettings } from '../types';

const DB_NAME = 'BangarBhavanPOS_DB';
const DB_VERSION = 1;

export const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('menu_cache')) {
        db.createObjectStore('menu_cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_sync_orders')) {
        db.createObjectStore('pending_sync_orders', { keyPath: 'localId' });
      }
      if (!db.objectStoreNames.contains('local_history')) {
        db.createObjectStore('local_history', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const cacheMenuInDB = async (items: MenuItem[]) => {
  const db = await initIndexedDB();
  const tx = db.transaction('menu_cache', 'readwrite');
  const store = tx.objectStore('menu_cache');
  store.clear();
  items.forEach((item) => store.put(item));
};

export const getMenuFromDB = async (): Promise<MenuItem[]> => {
  const db = await initIndexedDB();
  return new Promise((resolve) => {
    const tx = db.transaction('menu_cache', 'readonly');
    const store = tx.objectStore('menu_cache');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

export const saveOrderOfflineQueue = async (orderPayload: any) => {
  const db = await initIndexedDB();
  const tx = db.transaction('pending_sync_orders', 'readwrite');
  const store = tx.objectStore('pending_sync_orders');
  const localId = `OFFLINE_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const record = { ...orderPayload, localId, createdAt: new Date().toISOString() };
  store.put(record);
  return record;
};

export const getOfflineOrdersQueue = async (): Promise<any[]> => {
  const db = await initIndexedDB();
  return new Promise((resolve) => {
    const tx = db.transaction('pending_sync_orders', 'readonly');
    const store = tx.objectStore('pending_sync_orders');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

export const removeOrderFromOfflineQueue = async (localId: string) => {
  const db = await initIndexedDB();
  const tx = db.transaction('pending_sync_orders', 'readwrite');
  const store = tx.objectStore('pending_sync_orders');
  store.delete(localId);
};

export const saveOrderToLocalHistory = async (order: Order) => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('local_history', 'readwrite');
    const store = tx.objectStore('local_history');
    store.put(order);
  } catch (e) {
    console.warn('Failed to save to IndexedDB local history:', e);
  }
};

export const getLocalHistoryFromDB = async (): Promise<Order[]> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction('local_history', 'readonly');
      const store = tx.objectStore('local_history');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

export const saveShopSettingsLocal = (settings: ShopSettings) => {
  localStorage.setItem('bbc_shop_settings', JSON.stringify(settings));
};

export const getShopSettingsLocal = (): ShopSettings => {
  const saved = localStorage.getItem('bbc_shop_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  return {
    id: 'default_shop',
    tenantId: 'bangar_bhavan_default',
    shopName: 'Bangar Bhavan Chats',
    address: 'Near Central Bus Stand, Bengaluru',
    phone: '+91 98765 43210',
    footerText: 'Authentic Taste • Quality Guaranteed! Visit Again!',
    parcelCharge: 5.0,
    currency: '₹'
  };
};
