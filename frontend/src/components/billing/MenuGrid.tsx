import React, { useState, useMemo } from 'react';
import { MenuItem } from '../../types';
import { DishCard } from './DishCard';
import { Search, Star, LayoutGrid, List } from 'lucide-react';

interface MenuGridProps {
  dishes: MenuItem[];
  cartMap: Record<string, number>;
  onIncrease: (dish: MenuItem) => void;
  onDecrease: (dish: MenuItem) => void;
  onReset: (dish: MenuItem) => void;
  isLoading?: boolean;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  dishes,
  cartMap,
  onIncrease,
  onDecrease,
  onReset,
  isLoading
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('bbc_pos_layout') as 'grid' | 'list') || 'grid';
  });

  const toggleLayoutMode = (mode: 'grid' | 'list') => {
    setLayoutMode(mode);
    localStorage.setItem('bbc_pos_layout', mode);
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(dishes.map((d) => d.category)));
    return ['ALL', ...cats];
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedCategory === 'ALL') return true;
      return d.category === selectedCategory;
    });
  }, [dishes, selectedCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="h-32 bg-cream-200/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Category Pills, Quick Search & Grid/List View Switcher */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-darkbrown-500" />
          <input
            type="text"
            placeholder="Quick search dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-cream-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-deepred-700 text-darkbrown-900 placeholder-darkbrown-500/60"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-deepred-800 text-cream-50 border-deepred-900 shadow-sm'
                    : 'bg-white text-darkbrown-800 border-cream-300 hover:bg-cream-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid vs Horizontal List View Toggle */}
          <div className="flex items-center bg-cream-100 p-0.5 rounded-lg border border-cream-300 shrink-0">
            <button
              onClick={() => toggleLayoutMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                layoutMode === 'grid'
                  ? 'bg-deepred-800 text-white shadow-sm'
                  : 'text-darkbrown-700 hover:text-darkbrown-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleLayoutMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                layoutMode === 'list'
                  ? 'bg-deepred-800 text-white shadow-sm'
                  : 'text-darkbrown-700 hover:text-darkbrown-900'
              }`}
              title="Horizontal List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Horizontal List Layout */}
      <div
        className={
          layoutMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 overflow-y-auto pr-1 flex-1'
            : 'flex flex-col gap-2 overflow-y-auto pr-1 flex-1'
        }
      >
        {filteredDishes.length > 0 ? (
          filteredDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              quantity={cartMap[dish.id] || 0}
              layout={layoutMode}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
              onReset={onReset}
            />
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-darkbrown-500 font-semibold bg-white rounded-xl border border-cream-300">
            No dishes found matching your selection.
          </div>
        )}
      </div>
    </div>
  );
};
