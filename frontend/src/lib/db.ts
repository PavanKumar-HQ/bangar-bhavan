import { MenuItem, Order } from '../types';

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
