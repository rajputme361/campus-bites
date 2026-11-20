import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Canteen, CartItem } from '../types';
import { FoodImage } from './FoodImage';
import { VegIndicator } from './VegBadge';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  canteen: Canteen | undefined;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onBrowseMenus: () => void;
}

export function CartDrawer({
  open,
  onClose,
  cart,
  canteen,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onBrowseMenus,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#2C1810]/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <aside className="relative z-10 w-full max-w-md bg-[#FDFBF7] h-full flex flex-col border-l border-[#E7DDD0] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7DDD0] bg-white flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-[#2C1810]">
              Your Order Cart
            </h2>
            {canteen && cart.length > 0 && (
              <p className="text-xs font-medium text-[#EA580C] mt-0.5">
                Ordering from {canteen.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6E5649] hover:bg-[#F3ECE1] hover:text-[#2C1810] transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Content */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF5EE] border border-[#E7DDD0] flex items-center justify-center text-[#EA580C]">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h3 className="font-display font-semibold text-lg text-[#2C1810]">
                Your cart is empty
              </h3>
              <p className="text-sm text-[#6E5649]">
                Pick either Block 2 Canteen or Apple &amp; Bees Canteen to add freshly cooked food items.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onBrowseMenus();
              }}
              className="px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Browse Canteen Menus
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#EFE6D8]">
              {cart.map(({ menuItem, quantity }) => (
                <div key={menuItem.id} className="py-4 flex gap-3.5 items-start">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F3ECE1] shrink-0 border border-[#E7DDD0]">
                    <FoodImage
                      src={menuItem.image}
                      alt={menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <VegIndicator isVeg={menuItem.isVeg} />
                        <h4 className="font-medium text-sm text-[#2C1810] truncate">
                          {menuItem.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(menuItem.id)}
                        className="text-[#9E887B] hover:text-[#B91C1C] transition-colors p-0.5 cursor-pointer"
                        aria-label={`Remove ${menuItem.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-[#6E5649] tabular-nums">
                        ₹{menuItem.price} × {quantity} ={' '}
                        <strong className="text-[#2C1810]">
                          ₹{menuItem.price * quantity}
                        </strong>
                      </span>

                      <div className="inline-flex items-center rounded-md border border-[#D8CBB9] bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(menuItem.id, -1)}
                          className="p-1.5 text-[#6E5649] hover:text-[#2C1810] cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-[#2C1810] tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(menuItem.id, 1)}
                          className="p-1.5 text-[#6E5649] hover:text-[#2C1810] cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E7DDD0] bg-white p-6 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#6E5649]">
                  <span>Item Subtotal</span>
                  <span className="tabular-nums font-medium text-[#2C1810]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-[#6E5649]">
                  <span>Campus Pickup Fee</span>
                  <span className="text-[#15803D] font-medium">Free</span>
                </div>
                <div className="pt-2 border-t border-[#F0E8DC] flex justify-between items-baseline">
                  <span className="font-display font-bold text-base text-[#2C1810]">
                    Total Amount
                  </span>
                  <span className="font-display font-bold text-xl text-[#2C1810] tabular-nums">
                    ₹{subtotal}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClearCart}
                  className="px-3.5 py-3 rounded-lg border border-[#D8CBB9] text-xs font-semibold text-[#6E5649] hover:text-[#2C1810] hover:bg-[#FAF5EE] cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onCheckout}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
