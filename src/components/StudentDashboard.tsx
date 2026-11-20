import { LogOut, RotateCcw, ArrowRight, User as UserIcon } from 'lucide-react';
import type { Order, UserProfile } from '../types';
import { VegIndicator } from './VegBadge';

interface StudentDashboardProps {
  user: UserProfile;
  orders: Order[];
  loading: boolean;
  onLogout: () => void;
  onTrackOrder: (orderId: string) => void;
  onReorder: (order: Order) => void;
  onCancelOrder: (orderId: string) => Promise<void>;
  onBrowseMenus: () => void;
}

export function StudentDashboard({
  user,
  orders,
  loading,
  onLogout,
  onTrackOrder,
  onReorder,
  onCancelOrder,
  onBrowseMenus,
}: StudentDashboardProps) {
  const activeOrders = orders.filter((o) =>
    ['Order Placed', 'Order Accepted', 'Preparing Your Food', 'Ready for Pickup'].includes(o.status)
  );
  const pastOrders = orders.filter((o) =>
    ['Completed', 'Cancelled', 'Rejected'].includes(o.status)
  );
  const totalSpent = orders
    .filter((o) => o.status !== 'Cancelled' && o.status !== 'Rejected')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Student Profile & Stats */}
      <div className="bg-white rounded-2xl border border-[#E7DDD0] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF5EE] border border-[#E7DDD0] flex items-center justify-center text-[#EA580C] shrink-0">
            <UserIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl text-[#2C1810]">
              {user.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#6E5649]">
              <span className="font-mono-tabular font-semibold text-[#2C1810]">
                {user.rollNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span>{user.email}</span>
              {user.mobileNumber && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{user.mobileNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="grid grid-cols-3 gap-6 text-left">
            <div>
              <span className="block text-xs text-[#8C7466]">Total Orders</span>
              <span className="font-display font-bold text-xl text-[#2C1810] tabular-nums">
                {orders.length}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#8C7466]">Active</span>
              <span className="font-display font-bold text-xl text-[#EA580C] tabular-nums">
                {activeOrders.length}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#8C7466]">Total Spent</span>
              <span className="font-display font-bold text-xl text-[#2C1810] tabular-nums">
                ₹{totalSpent}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D8CBB9] text-xs font-semibold text-[#2C1810] hover:bg-[#FAF5EE] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Current Active Orders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-[#2C1810]">
            Current Orders
          </h2>
          <button
            type="button"
            onClick={onBrowseMenus}
            className="text-sm font-semibold text-[#EA580C] hover:underline cursor-pointer"
          >
            Order More Food
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E7DDD0] p-8 text-sm text-[#6E5649]">
            Loading your orders...
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-[#FAF5EE] rounded-2xl border border-[#E7DDD0] p-8 text-center space-y-3">
            <p className="font-display font-semibold text-base text-[#2C1810]">
              No active orders right now
            </p>
            <p className="text-sm text-[#6E5649]">
              Hungry between lectures? Pre-order from Block 2 or Apple &amp; Bees Canteen.
            </p>
            <button
              type="button"
              onClick={onBrowseMenus}
              className="px-5 py-2.5 rounded-lg bg-[#EA580C] text-white text-sm font-semibold cursor-pointer"
            >
              Browse Canteen Menus
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#E7DDD0] p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3 border-b border-[#F0E8DC] pb-3">
                  <div>
                    <p className="text-xs font-semibold text-[#EA580C]">{order.canteenName}</p>
                    <h3 className="font-mono-tabular font-bold text-lg text-[#2C1810]">
                      {order.id}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold ${
                        order.status === 'Ready for Pickup' ? 'text-[#15803D]' : 'text-[#EA580C]'
                      }`}
                    >
                      {order.status}
                    </span>
                    <p className="text-xs text-[#6E5649] mt-0.5">Pickup: {order.pickupTime}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {order.items.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between text-sm">
                      <span className="inline-flex items-center gap-2 text-[#2C1810]">
                        <VegIndicator isVeg={item.isVeg} />
                        {item.name} × {item.quantity}
                      </span>
                      <span className="tabular-nums font-medium text-[#2C1810]">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#F0E8DC] flex items-center justify-between gap-3">
                  <span className="font-display font-bold text-base text-[#2C1810] tabular-nums">
                    Total: ₹{order.totalAmount}
                  </span>

                  <div className="flex items-center gap-2">
                    {order.status === 'Order Placed' && (
                      <button
                        type="button"
                        onClick={() => onCancelOrder(order.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#FECACA] text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onTrackOrder(order.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2C1810] text-white text-xs font-semibold hover:bg-[#432519] cursor-pointer"
                    >
                      <span>Track Live</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Previous Order History */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-xl text-[#2C1810]">
          Order History
        </h2>

        {pastOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E7DDD0] p-6 text-sm text-[#6E5649]">
            Completed and past orders will appear here with a one-click reorder option.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E7DDD0] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E7DDD0] text-xs text-[#8C7466] bg-[#FAF5EE]">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Canteen</th>
                  <th className="py-3 px-4 font-semibold">Items</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DC]">
                {pastOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FDFBF7]">
                    <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#2C1810]">
                      {order.id}
                    </td>
                    <td className="py-3.5 px-4 text-[#2C1810]">{order.canteenName}</td>
                    <td className="py-3.5 px-4 text-[#6E5649] max-w-xs truncate">
                      {order.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E5649] tabular-nums whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <span
                        className={
                          order.status === 'Completed'
                            ? 'text-[#15803D]'
                            : 'text-[#B91C1C]'
                        }
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#2C1810] tabular-nums">
                      ₹{order.totalAmount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onReorder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8CBB9] text-xs font-semibold text-[#2C1810] hover:bg-[#FAF5EE] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
