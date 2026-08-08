import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePrinter } from '../../context/PrinterContext';
import { useSync } from '../../context/SyncContext';
import { Printer, Wifi, WifiOff, LogOut, Clock, Calendar, RefreshCw } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, deviceName } = usePrinter();
  const { isOnline, pendingSyncCount, syncOfflineOrders } = useSync();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-deepred-800 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 border-b-2 border-deepred-900 sticky top-0 z-40">
      {/* Brand & Shop Title */}
      <div className="flex items-center gap-3">
        <div className="bg-softyellow-200 text-darkbrown-900 font-display font-extrabold text-xl px-2.5 py-0.5 rounded-md shadow-sm border border-softyellow-300">
          BBC
        </div>
        <div>
          <h1 className="font-display font-extrabold text-lg sm:text-xl tracking-tight leading-none text-cream-50">
            {user?.shopName || 'Bangar Bhavan Chats'}
          </h1>
          <p className="text-xs text-cream-200 opacity-90 font-medium">Single Counter Billing POS</p>
        </div>
      </div>

      {/* Date & Live Clock */}
      <div className="hidden md:flex items-center gap-4 bg-deepred-900/60 px-3 py-1.5 rounded-lg border border-deepred-700/50 text-xs font-semibold text-cream-100">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-softyellow-300" />
          <span>{currentDate}</span>
        </div>
        <div className="w-px h-3.5 bg-deepred-600" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-softyellow-300" />
          <span className="tabular-nums font-mono text-sm">{currentTime}</span>
        </div>
      </div>

      {/* Indicators & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network Online/Offline Pill */}
        <div
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
            isOnline
              ? 'bg-successgreen-800/80 text-cream-50 border-successgreen-600'
              : 'bg-warmorange-700 text-white border-warmorange-600 animate-pulse'
          }`}
          title={isOnline ? 'Online mode active' : 'Offline mode - Orders queued locally'}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5 text-cream-100" /> : <WifiOff className="w-3.5 h-3.5 text-softyellow-200" />}
          <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          {pendingSyncCount > 0 && (
            <button
              onClick={syncOfflineOrders}
              className="ml-1 bg-white text-darkbrown-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-0.5"
            >
              <span>{pendingSyncCount}</span>
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            </button>
          )}
        </div>

        {/* Printer Status Pill */}
        <div
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
            isConnected
              ? 'bg-softyellow-200 text-darkbrown-900 border-softyellow-400'
              : 'bg-deepred-900/80 text-cream-200 border-deepred-700'
          }`}
          title={isConnected ? `Printer Connected: ${deviceName}` : 'No printer connected'}
        >
          <Printer className={`w-3.5 h-3.5 ${isConnected ? 'text-darkbrown-900' : 'text-cream-300'}`} />
          <span className="hidden md:inline">{isConnected ? 'PRINTER READY' : 'NO PRINTER'}</span>
        </div>
      </div>
    </header>
  );
};
