import React from 'react';
import { CartItem, PaymentMode } from '../../types';
import { ShoppingBag, Banknote, QrCode, CreditCard, CheckCircle2, Trash2, Package } from 'lucide-react';
import { sound } from '../../lib/sound';

interface RunningBillProps {
  items: CartItem[];
  isParcel: boolean;
  parcelChargeAmount: number;
  paymentMode: PaymentMode;
  onToggleParcel: (val: boolean) => void;
  onSelectPaymentMode: (mode: PaymentMode) => void;
  onGenerateBill: () => void;
  onClearBill: () => void;
  isSubmitting?: boolean;
}

export const RunningBill: React.FC<RunningBillProps> = ({
  items,
  isParcel,
  parcelChargeAmount,
  paymentMode,
  onToggleParcel,
  onSelectPaymentMode,
  onGenerateBill,
  onClearBill,
  isSubmitting
}) => {
  const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currentParcelCharge = isParcel ? parcelChargeAmount : 0;
  const grandTotal = itemTotal + currentParcelCharge;

  const paymentOptions: { mode: PaymentMode; label: string; icon: any }[] = [
    { mode: 'CASH', label: 'CASH', icon: Banknote },
    { mode: 'UPI', label: 'UPI', icon: QrCode },
    { mode: 'CARD', label: 'CARD', icon: CreditCard }
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-deepred-800/30 p-3 sm:p-4 shadow-lg flex flex-col justify-between h-full gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cream-200">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-deepred-800" />
          <h2 className="font-display font-extrabold text-base sm:text-lg text-darkbrown-900">
            Running Bill ({items.reduce((s, i) => s + i.quantity, 0)} items)
          </h2>
        </div>

        <button
          type="button"
          onClick={onClearBill}
          disabled={items.length === 0}
          className="text-xs font-bold text-deepred-700 hover:text-darkbrown-900 disabled:opacity-30 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Item Summary List */}
      <div className="flex-1 overflow-y-auto max-h-48 sm:max-h-64 border-b border-cream-200 py-1.5 divide-y divide-cream-100 pr-1">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.dishId} className="flex items-center justify-between py-1.5 text-xs sm:text-sm font-semibold text-darkbrown-900">
              <div className="truncate pr-2">
                <span>{item.name}</span>
                <span className="text-darkbrown-500 font-normal ml-1.5">x{item.quantity}</span>
              </div>
              <span className="font-mono font-bold">₹{item.price * item.quantity}</span>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs font-semibold text-darkbrown-500 italic">
            No items selected. Tap dish cards to add.
          </div>
        )}
      </div>

      {/* LOWER QUICK BILLING CONTROLS */}
      <div className="space-y-2.5 pt-1">
        {/* PARCEL TOGGLE - LOWER POSITION FOR INSTANT 1-TAP BILLING */}
        <div
          onClick={() => {
            sound.playTap();
            onToggleParcel(!isParcel);
          }}
          className={`cursor-pointer p-2.5 rounded-xl border-2 transition-all flex items-center justify-between shadow-sm select-none ${
            isParcel
              ? 'bg-softyellow-200 border-warmorange-600 ring-2 ring-warmorange-500/20'
              : 'bg-cream-100 border-cream-300 hover:bg-cream-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className={`w-4 h-4 ${isParcel ? 'text-deepred-800' : 'text-darkbrown-600'}`} />
            <span className="font-extrabold text-xs sm:text-sm text-darkbrown-900">
              Parcel Packing (+₹{parcelChargeAmount})
            </span>
          </div>

          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isParcel ? 'bg-deepred-800 justify-end' : 'bg-cream-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </div>
        </div>

        {/* Math breakdown */}
        <div className="space-y-1 text-xs font-semibold text-darkbrown-800 bg-cream-50 p-2.5 rounded-lg border border-cream-200">
          <div className="flex justify-between">
            <span>Items Total:</span>
            <span className="font-mono font-bold">₹{itemTotal}</span>
          </div>
          {isParcel && (
            <div className="flex justify-between text-deepred-800 font-bold">
              <span>Parcel Charge:</span>
              <span className="font-mono">+₹{parcelChargeAmount}</span>
            </div>
          )}
          <div className="flex justify-between text-base sm:text-xl font-black text-darkbrown-900 pt-1 border-t border-cream-300">
            <span>Grand Total:</span>
            <span className="font-mono text-deepred-800">₹{grandTotal}</span>
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div>
          <label className="block text-[10px] font-black text-darkbrown-500 uppercase tracking-wider mb-1">
            Payment Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = paymentMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    onSelectPaymentMode(opt.mode);
                  }}
                  className={`py-2 rounded-lg font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all border ${
                    isSelected
                      ? 'bg-darkbrown-900 text-softyellow-200 border-darkbrown-900 shadow-md ring-2 ring-darkbrown-700'
                      : 'bg-cream-100 text-darkbrown-900 border-cream-300 hover:bg-cream-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={onClearBill}
            disabled={items.length === 0}
            className="py-2.5 px-2 rounded-lg font-extrabold text-xs text-deepred-800 bg-deepred-100 hover:bg-deepred-200 disabled:opacity-40 transition-all border border-deepred-300"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onGenerateBill}
            disabled={items.length === 0 || isSubmitting}
            className="sm:col-span-2 py-3 px-4 rounded-xl font-black text-sm text-cream-50 bg-deepred-800 hover:bg-deepred-900 disabled:opacity-40 shadow-md flex items-center justify-center gap-1.5 transition-all border border-deepred-900 active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5 text-softyellow-300 stroke-[2.5]" />
            <span>{isSubmitting ? 'GENERATING...' : 'GENERATE BILL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
