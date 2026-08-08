import React from 'react';
import { Order, ShopSettings } from '../../types';
import { Printer, X, CheckCircle, Download } from 'lucide-react';
import { usePrinter } from '../../context/PrinterContext';

interface ReceiptPreviewModalProps {
  order: Order | null;
  settings?: ShopSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  order,
  settings,
  isOpen,
  onClose
}) => {
  const { printReceipt, isConnected } = usePrinter();

  if (!isOpen || !order) return null;

  const shopName = settings?.shopName || 'BANGAR BHAVAN CHATS';
  const address = settings?.address || 'Near Central Bus Stand, Bengaluru';
  const phone = settings?.phone || '+91 98765 43210';
  const footerText = settings?.footerText || 'Authentic Taste • Quality Guaranteed! Visit Again!';

  const orderDate = new Date(order.createdAt);
  const dateStr = orderDate.toLocaleDateString('en-IN');
  const timeStr = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    printReceipt(order, settings);
  };

  const handleDownloadTxt = () => {
    let txt = `================================\n`;
    txt += `     ${shopName.toUpperCase()}\n`;
    txt += `   ${address}\n`;
    txt += `   Ph: ${phone}\n`;
    txt += `================================\n`;
    txt += `Invoice No: ${order.invoiceNo}\n`;
    txt += `Date: ${dateStr}   Time: ${timeStr}\n`;
    txt += `Payment Mode: ${order.paymentMode} ${order.isParcel ? '[PARCEL]' : ''}\n`;
    txt += `--------------------------------\n`;
    txt += `ITEM               QTY    AMOUNT\n`;
    txt += `--------------------------------\n`;
    order.items.forEach((item) => {
      const name = item.name.substring(0, 16).padEnd(16, ' ');
      const qty = `${item.quantity}`.padStart(4, ' ');
      const amt = `Rs.${(item.quantity * item.price).toFixed(0)}`.padStart(8, ' ');
      txt += `${name}${qty}${amt}\n`;
    });
    txt += `--------------------------------\n`;
    txt += `Subtotal:              Rs.${order.subtotal.toFixed(0)}\n`;
    if (order.isParcel && order.parcelCharge > 0) {
      txt += `Parcel Charge:         Rs.${order.parcelCharge.toFixed(0)}\n`;
    }
    txt += `================================\n`;
    txt += `TOTAL:                 Rs.${order.grandTotal.toFixed(0)}\n`;
    txt += `================================\n`;
    txt += `   ${footerText}\n`;

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${order.invoiceNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-darkbrown-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-deepred-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="bg-deepred-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-softyellow-200" />
            <h3 className="font-display font-extrabold text-base text-cream-50">
              Print Receipt Preview
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-deepred-900 text-cream-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentic Thermal Paper Body */}
        <div className="p-4 sm:p-6 bg-cream-100/70 overflow-y-auto max-h-[65vh]">
          <div className="bg-white p-5 rounded-lg shadow-md border border-cream-300 font-mono text-xs text-darkbrown-900 space-y-2 select-text relative">
            {/* Thermal Jagged Top Edge Visual */}
            <div className="text-center border-b-2 border-dashed border-darkbrown-800/40 pb-3">
              <div className="font-display font-black text-lg text-deepred-800 uppercase tracking-tight">
                {shopName}
              </div>
              <div className="text-[11px] text-darkbrown-700 font-semibold">{address}</div>
              <div className="text-[11px] text-darkbrown-700 font-semibold">Ph: {phone}</div>
            </div>

            {/* Bill Info */}
            <div className="py-1 text-[11px] space-y-0.5 border-b border-darkbrown-800/30">
              <div className="flex justify-between font-bold">
                <span>Bill No:</span>
                <span className="text-deepred-800">{order.invoiceNo}</span>
              </div>
              <div className="flex justify-between text-darkbrown-700">
                <span>Date: {dateStr}</span>
                <span>Time: {timeStr}</span>
              </div>
              <div className="flex justify-between font-bold pt-0.5">
                <span>Payment Mode:</span>
                <span className="bg-cream-200 px-1.5 py-0.2 rounded font-black text-darkbrown-900">
                  {order.paymentMode} {order.isParcel ? '[PARCEL]' : ''}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 space-y-1">
              <div className="flex justify-between font-black text-[11px] border-b border-darkbrown-800/30 pb-1 uppercase">
                <span className="flex-1">Item</span>
                <span className="w-10 text-center">Qty</span>
                <span className="w-16 text-right">Amount</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] font-semibold py-0.5">
                  <span className="flex-1 truncate pr-1">{item.name}</span>
                  <span className="w-10 text-center font-bold">{item.quantity}</span>
                  <span className="w-16 text-right font-bold">₹{item.quantity * item.price}</span>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="border-t-2 border-dashed border-darkbrown-800/40 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-darkbrown-700">
                <span>Subtotal:</span>
                <span className="font-bold">₹{order.subtotal}</span>
              </div>
              {order.isParcel && order.parcelCharge > 0 && (
                <div className="flex justify-between text-deepred-800 font-bold">
                  <span>Parcel Charge:</span>
                  <span>+₹{order.parcelCharge}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-darkbrown-900 pt-1.5 border-t border-darkbrown-900">
                <span>GRAND TOTAL:</span>
                <span className="text-deepred-800">₹{order.grandTotal}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-dashed border-darkbrown-800/30 pt-3 mt-3 text-[11px] font-bold text-darkbrown-700">
              <p>{footerText}</p>
              <p className="text-[10px] text-darkbrown-500 font-semibold mt-1">*** Thank You! Visit Again ***</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-3 sm:p-4 bg-cream-50 border-t border-cream-300 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="py-2.5 px-3 rounded-xl bg-cream-200 hover:bg-cream-300 text-darkbrown-900 font-black text-xs flex items-center justify-center gap-1.5 border border-cream-300"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="sm:col-span-2 py-3 px-4 rounded-xl bg-deepred-800 hover:bg-deepred-900 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 border border-deepred-900"
          >
            <Printer className="w-4 h-4 text-softyellow-200" />
            <span>{isConnected ? 'Print via Bluetooth' : 'Connect & Print'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
