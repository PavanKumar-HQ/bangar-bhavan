import React, { createContext, useContext, useState, useEffect } from 'react';
import { getOfflineOrdersQueue, removeOrderFromOfflineQueue } from '../lib/db';
import { api } from '../lib/api';

interface SyncContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  syncOfflineOrders: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const checkPendingQueue = async () => {
    try {
      const queue = await getOfflineOrdersQueue();
      setPendingSyncCount(queue.length);
    } catch (e) {
      setPendingSyncCount(0);
    }
  };

  const syncOfflineOrders = async () => {
    if (!navigator.onLine) return;

    try {
      const queue = await getOfflineOrdersQueue();
      if (queue.length === 0) {
        setPendingSyncCount(0);
        return;
      }

      for (const order of queue) {
        try {
          const { localId, ...payload } = order;
          await api.post('/orders', { ...payload, syncedFromApp: true });
          await removeOrderFromOfflineQueue(localId);
        } catch (err) {
          console.error('Failed to sync individual offline order:', err);
        }
      }
      await checkPendingQueue();
    } catch (e) {
      console.error('Error syncing offline queue:', e);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineOrders();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPendingQueue();
    const interval = setInterval(() => {
      checkPendingQueue();
      if (navigator.onLine) {
        syncOfflineOrders();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ isOnline, pendingSyncCount, syncOfflineOrders }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
