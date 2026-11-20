import { useMemo, useState } from 'react';
import { Clock, MapPin, Minus, Plus, Search, AlertTriangle } from 'lucide-react';
import type { Canteen, CanteenId, CartItem, FoodCategory, MenuItem } from '../types';
import { FoodImage } from './FoodImage';
import { VegIndicator } from './VegBadge';

const CATEGORIES: ('All' | FoodCategory)[] = [
  'All',
  'Breakfast',
  'Snacks',
  'Fast Food',
  'Main Course',
  'Beverages',
  'Desserts',
];

interface MenuViewProps {
  canteens: Canteen[];
  selectedCanteenId: CanteenId;
  onSwitchCanteen: (id: CanteenId) => void;
  menuItems: MenuItem[];
  loading: boolean;
  cart: CartItem[];
  cartCanteenId: CanteenId | null;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onReplaceCartWithItem: (item: MenuItem) => void;
}

export function MenuView({
  canteens,
  selectedCanteenId,
  onSwitchCanteen,
  menuItems,
  loading,
  cart,
  cartCanteenId,
  onAddToCart,
  onUpdateQuantity,
  onReplaceCartWithItem,
}: MenuViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | FoodCategory>('All');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [pendingConflictItem, setPendingConflictItem] = useState<MenuItem | null>(null);

  const activeCanteen = canteens.find((c) => c.id === selectedCanteenId) || canteens[0];
  const cartCanteenName =
    canteens.find((c) => c.id === cartCanteenId)?.name || 'another canteen';

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (item.canteenId !== selectedCanteenId) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (vegFilter === 'veg' && !item.isVeg) return false;
      if (vegFilter === 'non-veg' && item.isVeg) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [menuItems, selectedCanteenId, selectedCategory, vegFilter, searchQuery]);

  const getCartQty = (menuItemId: string) =>
    cart.find((entry) => entry.menuItem.id === menuItemId)?.quantity || 0;

  const handleAddClick = (item: MenuItem) => {
    if (!item.available || !activeCanteen?.isOpen) return;
    if (cart.length > 0 && cartCanteenId && cartCanteenId !== item.canteenId) {
      setPendingConflictItem(item);
      return;
    }
    onAddToCart(item);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Canteen Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7DDD0] pb-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E5649]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
              {activeCanteen?.location}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {activeCanteen?.timings}
            </span>
            <span aria-hidden="true">·</span>
            <span className={activeCanteen?.isOpen ? 'text-[#15803D] font-semibold' : 'text-[#B91C1C] font-semibold'}>
              {activeCanteen?.isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#2C1810]">
            {activeCanteen?.name} Menu
          </h1>
          <p className="text-sm text-[#6E5649] max-w-2xl">
            {activeCanteen?.description}
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#F3ECE1] border border-[#E7DDD0] self-start">
          {canteens.map((c) => {
            const active = c.id === selectedCanteenId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSwitchCanteen(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#2C1810] text-white'
                    : 'text-[#6E5649] hover:text-[#2C1810]'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C7466] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${activeCanteen?.name}...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-[#D8CBB9] text-sm text-[#2C1810] placeholder:text-[#9E887B] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F3ECE1] border border-[#E7DDD0] self-start">
            {(
              [
                { id: 'all', label: 'All Items' },
                { id: 'veg', label: 'Veg Only' },
                { id: 'non-veg', label: 'Non-Veg' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVegFilter(opt.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  vegFilter === opt.id
                    ? 'bg-white text-[#2C1810] shadow-xs'
                    : 'text-[#6E5649] hover:text-[#2C1810]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  active
                    ? 'bg-[#EA580C] border-[#EA580C] text-white'
                    : 'bg-white border-[#E7DDD0] text-[#6E5649] hover:border-[#2C1810] hover:text-[#2C1810]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-[#E7DDD0] overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-[#F3ECE1]" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-[#F3ECE1] rounded w-1/3" />
                <div className="h-5 bg-[#F3ECE1] rounded w-2/3" />
                <div className="h-3 bg-[#F3ECE1] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7DDD0] p-12 text-center space-y-3">
          <p className="font-display font-semibold text-lg text-[#2C1810]">
            No matching dishes found
          </p>
          <p className="text-sm text-[#6E5649]">
            Try clearing your search or switching category filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setVegFilter('all');
            }}
            className="px-4 py-2 rounded-lg bg-[#2C1810] text-white text-sm font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const qty = getCartQty(item.id);
            const isDisabled = !item.available || !activeCanteen?.isOpen;

            return (
              <article
                key={item.id}
                className={`bg-white rounded-2xl border border-[#E7DDD0] overflow-hidden flex flex-col transition-transform duration-200 ${
                  isDisabled ? 'opacity-75' : 'hover:-translate-y-0.5'
                }`}
              >
                <div className="relative aspect-[4/3] w-full bg-[#F3ECE1] overflow-hidden">
                  <FoodImage
                    src={item.image}
                    alt={item.name}
                    className={`w-full h-full object-cover ${isDisabled ? 'grayscale-[40%]' : ''}`}
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#6E5649]">
                      <div className="flex items-center gap-2">
                        <VegIndicator isVeg={item.isVeg} />
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{item.prepTimeMinutes} min</span>
                      </div>
                      <span
                        className={`font-semibold ${
                          item.available ? 'text-[#15803D]' : 'text-[#B91C1C]'
                        }`}
                      >
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-lg text-[#2C1810] leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-sm text-[#6E5649] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F3ECE1] flex items-center justify-between gap-4">
                    <span className="font-display font-bold text-lg text-[#2C1810] tabular-nums">
                      ₹{item.price}
                    </span>

                    {qty > 0 ? (
                      <div className="inline-flex items-center rounded-lg border border-[#EA580C] bg-[#EA580C]/5 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="p-2 text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm font-bold text-[#2C1810] tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="p-2 text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleAddClick(item)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          isDisabled
                            ? 'bg-[#EFE6D8] text-[#9E887B] cursor-not-allowed'
                            : 'bg-[#EA580C] hover:bg-[#C2410C] text-white cursor-pointer'
                        }`}
                      >
                        {!activeCanteen?.isOpen
                          ? 'Canteen Closed'
                          : item.available
                          ? 'Add to Cart'
                          : 'Sold Out'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Single-Canteen Cart Enforcement Modal */}
      {pendingConflictItem && (
        <div
          className="fixed inset-0 z-50 bg-[#2C1810]/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="canteen-conflict-title"
        >
          <div className="bg-white rounded-2xl border border-[#E7DDD0] max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#EA580C]/10 text-[#EA580C] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 id="canteen-conflict-title" className="font-display font-bold text-lg text-[#2C1810]">
                  Replace items in your cart?
                </h3>
                <p className="text-sm text-[#6E5649] leading-relaxed">
                  Your cart currently contains items from <strong>{cartCanteenName}</strong>. Orders cannot combine food from two canteens. Clear current cart and add <strong>{pendingConflictItem.name}</strong> from <strong>{activeCanteen?.name}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingConflictItem(null)}
                className="px-4 py-2 rounded-lg border border-[#D8CBB9] text-sm font-semibold text-[#2C1810] hover:bg-[#FAF5EE] cursor-pointer"
              >
                Keep Current Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  onReplaceCartWithItem(pendingConflictItem);
                  setPendingConflictItem(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold cursor-pointer"
              >
                Switch &amp; Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
