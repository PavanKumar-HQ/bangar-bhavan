import React, { useState, useEffect } from 'react';
import { Order, PaymentMode, ShopSettings } from '../types';
import { api } from '../lib/api';
import { usePrinter } from '../context/PrinterContext';
import {
  Search,
  Calendar,
  Filter,
  Printer,
  Trash2,
  Download,
  Eye,
  X,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { sound } from '../lib/sound';

export const History: React.FC = () => {
  const { printReceipt } = usePrinter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ShopSettings | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const [historyRes, settingsRes] = await Promise.all([
        api.get('/history', {
          params: { search, startDate, endDate, paymentMode, limit: 100 }
        }),
        api.get('/settings')
      ]);
      setOrders(Array.isArray(historyRes?.data?.orders) ? historyRes.data.orders : []);
      if (settingsRes?.data) setSettings(settingsRes.data);
    } catch (err) {
      console.warn('Failed to fetch history from server, defaulting to local queue:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, startDate, endDate, paymentMode]);

  const handleDelete = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to void/delete this bill record?')) return;
    try {
      await api.delete(`/history/${orderId}`);
      sound.playError();
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err) {
      alert('Failed to delete order.');
    }
  };

  const handleReprint = (order: Order) => {
    sound.playTap();
    printReceipt(order, settings);
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/history/export', {
        params: { startDate, endDate },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bangar_bhavan_billing_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 pb-20">
      {/* Header & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-cream-300 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-black text-xl text-darkbrown-900">Order History & Receipts</h1>
            <p className="text-xs text-darkbrown-600">Search, filter, reprint or export past billing receipts</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-successgreen-800 hover:bg-successgreen-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-cream-200">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-darkbrown-500" />
            <input
              type="text"
              placeholder="Search Bill No or Dish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-cream-50 border border-cream-300 rounded-lg text-xs font-bold text-darkbrown-900 focus:outline-none focus:border-deepred-700"
            />
          </div>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-cream-50 border border-cream-300 rounded-lg text-xs font-bold text-darkbrown-900 focus:outline-none focus:border-deepred-700"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-cream-50 border border-cream-300 rounded-lg text-xs font-bold text-darkbrown-900 focus:outline-none focus:border-deepred-700"
          />

          {/* Payment Mode */}
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="px-3 py-1.5 bg-cream-50 border border-cream-300 rounded-lg text-xs font-bold text-darkbrown-900 focus:outline-none focus:border-deepred-700"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="CARD">CARD</option>
          </select>
        </div>
      </div>

      {/* History Data Table */}
      <div className="bg-white rounded-xl border border-cream-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-darkbrown-900">
            <thead className="bg-cream-100 uppercase font-black text-darkbrown-600 border-b border-cream-300">
              <tr>
                <th className="p-3">Bill No</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Items Summary</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-darkbrown-500">Loading history...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-darkbrown-500">No matching orders found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-50 transition-colors">
                    <td className="p-3 font-mono font-black text-deepred-800">{o.invoiceNo}</td>
                    <td className="p-3">
                      <div>{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                      <div className="text-[10px] text-darkbrown-500 font-normal">
                        {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3 max-w-xs truncate" title={o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}>
                      {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="p-3">
                      <span className="bg-cream-200 px-2 py-0.5 rounded font-black text-[10px]">
                        {o.paymentMode}
                      </span>
                    </td>
                    <td className="p-3">
                      {o.isParcel ? (
                        <span className="bg-deepred-100 text-deepred-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          PARCEL (+₹{o.parcelCharge})
                        </span>
                      ) : (
                        <span className="text-darkbrown-500 text-[10px]">Dine-in</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm text-darkbrown-900">
                      ₹{o.grandTotal}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded bg-cream-200 hover:bg-cream-300 text-darkbrown-900"
                          title="View Bill Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReprint(o)}
                          className="p-1.5 rounded bg-softyellow-200 hover:bg-softyellow-300 text-darkbrown-900"
                          title="Reprint Bluetooth Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="p-1.5 rounded bg-deepred-100 hover:bg-deepred-200 text-deepred-800"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-darkbrown-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border-2 border-deepred-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <div>
                <h3 className="font-display font-extrabold text-lg text-darkbrown-900">
                  Bill {selectedOrder.invoiceNo}
                </h3>
                <p className="text-xs text-darkbrown-600">
                  {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg bg-cream-200 hover:bg-cream-300 text-darkbrown-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-cream-100 text-xs font-semibold">
              {selectedOrder.items.map((i) => (
                <div key={i.id || i.name} className="flex justify-between py-1.5">
                  <span>{i.name} x {i.quantity}</span>
                  <span className="font-mono font-bold">₹{i.price * i.quantity}</span>
                </div>
              ))}
            </div>

            <div className="bg-cream-100 p-3 rounded-xl space-y-1 text-xs font-bold border border-cream-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">₹{selectedOrder.subtotal}</span>
              </div>
              {selectedOrder.isParcel && (
                <div className="flex justify-between text-deepred-800">
                  <span>Parcel Charge:</span>
                  <span className="font-mono">₹{selectedOrder.parcelCharge}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-darkbrown-900 pt-1 border-t border-cream-300">
                <span>Grand Total:</span>
                <span className="font-mono text-deepred-800">₹{selectedOrder.grandTotal}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReprint(selectedOrder)}
                className="flex-1 py-2.5 rounded-xl bg-deepred-800 hover:bg-deepred-900 text-cream-50 font-black text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Reprint Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
