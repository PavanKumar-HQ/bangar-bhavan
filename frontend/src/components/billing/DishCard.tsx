import React, { useRef } from 'react';
import { MenuItem } from '../../types';
import { Plus, Minus, Star } from 'lucide-react';
import { sound } from '../../lib/sound';

interface DishCardProps {
  dish: MenuItem;
  quantity: number;
  layout?: 'grid' | 'list';
  onIncrease: (dish: MenuItem) => void;
  onDecrease: (dish: MenuItem) => void;
  onReset: (dish: MenuItem) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  quantity,
  layout = 'grid',
  onIncrease,
  onDecrease,
  onReset
}) => {
  const timerRef = useRef<any>(null);

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      sound.playError();
      onReset(dish);
    }, 750);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  if (layout === 'list') {
    return (
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-150 select-none shadow-sm gap-3 ${
          quantity > 0
            ? 'bg-softyellow-100 border-deepred-700 shadow-md ring-2 ring-deepred-600/30'
            : 'bg-white border-cream-300 hover:border-deepred-500/40 hover:bg-cream-50/50'
        }`}
      >
        {/* Left Dish Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-extrabold text-sm sm:text-base text-darkbrown-900 leading-tight truncate">
              {dish.name}
            </h3>
            <span className="text-xs text-darkbrown-500 font-semibold">{dish.category}</span>
          </div>
          <span className="font-mono font-black text-deepred-800 text-base sm:text-lg shrink-0 pr-2">
            ₹{dish.price}
          </span>
        </div>

        {/* Right Touch Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (quantity > 0) {
                sound.playTap();
                onDecrease(dish);
              }
            }}
            disabled={quantity === 0}
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl transition-all active:scale-90 ${
              quantity > 0
                ? 'bg-deepred-800 text-white hover:bg-deepred-900 shadow-sm'
                : 'bg-cream-200 text-darkbrown-500 opacity-40 cursor-not-allowed'
            }`}
            title="Decrease / Long press to reset"
          >
            <Minus className="w-5 h-5 stroke-[3]" />
          </button>

          <div className="w-10 text-center font-mono font-black text-xl text-darkbrown-900">
            {quantity}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playTap();
              onIncrease(dish);
            }}
            className="w-10 h-10 rounded-lg bg-successgreen-800 text-white hover:bg-successgreen-700 font-black text-xl flex items-center justify-center shadow-md active:scale-90 transition-all border border-successgreen-600"
            title="Increase quantity"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className={`relative flex flex-col justify-between p-3.5 rounded-xl border-2 transition-all duration-150 select-none shadow-sm ${
        quantity > 0
          ? 'bg-softyellow-100 border-deepred-700 shadow-md ring-2 ring-deepred-600/30'
          : 'bg-white border-cream-300 hover:border-deepred-500/40 hover:bg-cream-50/50'
      }`}
    >
      {/* Top Details */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div>
          <h3 className="font-display font-extrabold text-base sm:text-lg text-darkbrown-900 leading-tight tracking-tight">
            {dish.name}
          </h3>
          <span className="inline-block mt-1 font-mono font-black text-deepred-800 text-lg sm:text-xl">
            ₹{dish.price}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-cream-200">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (quantity > 0) {
              sound.playTap();
              onDecrease(dish);
            }
          }}
          disabled={quantity === 0}
          className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-2xl transition-all active:scale-90 ${
            quantity > 0
              ? 'bg-deepred-800 text-white hover:bg-deepred-900 shadow-sm'
              : 'bg-cream-200 text-darkbrown-500 opacity-40 cursor-not-allowed'
          }`}
          title="Decrease / Long press card to reset"
        >
          <Minus className="w-6 h-6 stroke-[3]" />
        </button>

        <div className="flex-1 text-center font-mono font-black text-2xl sm:text-3xl text-darkbrown-900">
          {quantity}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sound.playTap();
            onIncrease(dish);
          }}
          className="w-12 h-12 rounded-lg bg-successgreen-800 text-white hover:bg-successgreen-700 font-black text-2xl flex items-center justify-center shadow-md active:scale-90 transition-all border border-successgreen-600"
          title="Increase quantity"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
