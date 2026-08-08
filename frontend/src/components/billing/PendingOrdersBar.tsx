import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '../../types';
import { Clock, CheckCircle, Timer, Utensils, CheckCheck } from 'lucide-react';
import { sound } from '../../lib/sound';

interface PendingOrdersBarProps {
  pendingOrders: Order[];
  servedOrders?: Order[];
  onMarkReady: (orderId: string) => void;
}

export const PendingOrdersBar: React.FC<PendingOrdersBarProps> = ({
  pendingOrders,
  servedOrders = [],
  onMarkReady
}) => {
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTimeStr = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - created) / 60000);
    if (diffMins < 1) return 'Just now';
    return `${diffMins} min ago`;
  };

  // Aggregated Item Prep Summary across all pending orders
  const itemPrepSummary = useMemo(() => {
    const summaryMap: Record<string, number> = {};
    pendingOrders.forEach((o) => {
      o.items.forEach((item) => {
        summaryMap[item.name] = (summaryMap[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(summaryMap).map(([name, qty]) => ({ name, qty }));
  }, [pendingOrders]);

  if (pendingOrders.length === 0 && servedOrders.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {/* SECTION 1: KITCHEN PREP QUEUE (Aggregated Items) */}
      {itemPrepSummary.length > 0 && (
        <div className="bg-white border-2 border-warmorange-500/60 rounded-xl p-2.5 sm:p-3 shadow-md space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-warmorange-700" />
              <h3 className="font-display font-extrabold text-xs sm:text-sm text-darkbrown-900 uppercase tracking-wider">
                KITCHEN PREP QUEUE
              </h3>
            </div>
            <span className="text-[10px] font-extrabold text-warmorange-800 bg-warmorange-100 px-2 py-0.5 rounded-full">
              Live Aggregate Summary
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs font-bold">
            {itemPrepSummary.map((item) => (
              <span
                key={item.name}
                className="bg-softyellow-200 text-darkbrown-900 px-3 py-1 rounded-lg border border-softyellow-400 font-mono text-xs shrink-0 shadow-sm flex items-center gap-1.5"
              >
                <span>{item.name}:</span>
                <strong className="text-deepred-800 font-black text-sm">{item.qty} pcs</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: PENDING TO SERVE ORDERS */}
      <div className="bg-softyellow-100 border-2 border-warmorange-500/50 rounded-xl p-2.5 sm:p-3 shadow-md space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-warmorange-700 animate-spin" />
            <h3 className="font-display font-extrabold text-sm text-darkbrown-900">
              PENDING TO SERVE ({pendingOrders.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-darkbrown-600">
            Tap MARK AS SERVED when food is ready
          </span>
        </div>

        {/* Pending Order Cards Row */}
        {pendingOrders.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {pendingOrders.map((order) => {
              const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
              const elapsed = getElapsedTimeStr(order.createdAt);

              return (
                <div
                  key={order.id}
                  className="bg-white border-2 border-cream-300 rounded-lg p-2.5 min-w-[220px] max-w-[260px] flex flex-col justify-between shadow-sm hover:border-warmorange-500 transition-all shrink-0"
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-cream-200">
                    <span className="font-mono font-black text-xs text-deepred-800">
                      {order.invoiceNo}
                    </span>
                    <span className="text-[10px] font-bold text-warmorange-700 bg-warmorange-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {elapsed}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-darkbrown-800 truncate mb-2" title={itemsSummary}>
                    {itemsSummary}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playSuccess();
                      onMarkReady(order.id);
                    }}
                    className="w-full py-1.5 rounded bg-successgreen-800 hover:bg-successgreen-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>MARK AS SERVED</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-2.5 text-center bg-white rounded-lg border border-cream-300 text-xs font-bold text-successgreen-800">
            ✅ All food orders served! No pending preparation.
          </div>
        )}
      </div>

      {/* SECTION 2: SERVED COMPLETE (Shown as a dedicated separate section) */}
      {servedOrders.length > 0 && (
        <div className="bg-successgreen-50/80 border-2 border-successgreen-600/40 rounded-xl p-2.5 sm:p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-successgreen-800" />
              <h3 className="font-display font-extrabold text-sm text-successgreen-900">
                SERVED COMPLETE ({servedOrders.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-successgreen-800 uppercase tracking-wider">
              Recent Counter Deliveries
            </span>
          </div>

          {/* Served Orders Cards Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {servedOrders.slice(0, 15).map((order) => {
              const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
              const servedTimeStr = order.servedAt
                ? new Date(order.servedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={order.id}
                  className="bg-white border border-successgreen-600/40 rounded-lg p-2 min-w-[200px] max-w-[240px] flex flex-col justify-between shadow-sm shrink-0"
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-cream-200">
                    <span className="font-mono font-black text-xs text-darkbrown-900">
                      {order.invoiceNo}
                    </span>
                    <span className="text-[10px] font-bold text-successgreen-800 bg-successgreen-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5 text-successgreen-700" />
                      {servedTimeStr}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-darkbrown-800 truncate mb-1" title={itemsSummary}>
                    {itemsSummary}
                  </p>

                  <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-cream-100">
                    <span className="text-darkbrown-500 text-[10px]">{order.paymentMode}</span>
                    <span className="font-mono text-deepred-800">₹{order.grandTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
