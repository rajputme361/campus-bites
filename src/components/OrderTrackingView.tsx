import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  BellRing,
  Check,
  Clock,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import type { Order, OrderStatus } from '../types';
import { api } from '../lib/api';
import { VegIndicator } from './VegBadge';

const TRACKING_STAGES: OrderStatus[] = [
  'Order Placed',
  'Order Accepted',
  'Preparing Your Food',
  'Ready for Pickup',
  'Completed',
];

interface OrderTrackingViewProps {
  initialOrderId?: string | null;
  myOrders: Order[];
  lastStreamUpdateAt: number;
  onOrderUpdated: (order: Order) => void;
}

export function OrderTrackingView({
  initialOrderId,
  myOrders,
  lastStreamUpdateAt,
  onOrderUpdated,
}: OrderTrackingViewProps) {
  const [searchId, setSearchId] = useState(initialOrderId || '');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (id: string) => {
    const clean = id.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.trackOrder(clean);
      setTrackedOrder(res.order);
      setCanCancel(res.canCancel);
    } catch (err) {
      setTrackedOrder(null);
      setCanCancel(false);
      setError(err instanceof Error ? err.message : 'Order not found.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrderId) {
      setSearchId(initialOrderId);
      fetchOrder(initialOrderId);
    } else if (myOrders.length > 0 && !trackedOrder) {
      const latest = myOrders[0];
      setSearchId(latest.id);
      fetchOrder(latest.id);
    }
  }, [initialOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh tracked order whenever SSE broadcasts an update
  useEffect(() => {
    if (trackedOrder && lastStreamUpdateAt > 0) {
      fetchOrder(trackedOrder.id);
    }
  }, [lastStreamUpdateAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchOrder(searchId);
  };

  const handleCancelOrder = async () => {
    if (!trackedOrder) return;
    setCancelling(true);
    setError(null);
    try {
      const { order } = await api.cancelOrder(trackedOrder.id);
      setTrackedOrder(order);
      setCanCancel(false);
      onOrderUpdated(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const activeStageIndex = trackedOrder
    ? TRACKING_STAGES.indexOf(trackedOrder.status)
    : -1;
  const isTerminated =
    trackedOrder?.status === 'Cancelled' || trackedOrder?.status === 'Rejected';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#2C1810]">
          Live Order Tracking
        </h1>
        <p className="text-sm sm:text-base text-[#6E5649]">
          Enter your Campus Bites Order ID to follow live preparation updates from the canteen kitchen.
        </p>
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl border border-[#E7DDD0] p-4 sm:p-5 flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C7466] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Order ID (e.g. CB-B2-1041)"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D8CBB9] text-sm font-mono-tabular uppercase text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {loading ? 'Checking...' : 'Track Order'}
        </button>
      </form>

      {/* Quick switch from logged-in student's orders */}
      {myOrders.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#6E5649]">Your Recent Orders</p>
          <div className="flex flex-wrap gap-2">
            {myOrders.slice(0, 5).map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  setSearchId(order.id);
                  fetchOrder(order.id);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono-tabular font-semibold transition-colors cursor-pointer ${
                  trackedOrder?.id === order.id
                    ? 'bg-[#2C1810] border-[#2C1810] text-white'
                    : 'bg-white border-[#E7DDD0] text-[#2C1810] hover:border-[#2C1810]'
                }`}
              >
                {order.id} · {order.status}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]">
          {error}
        </div>
      )}

      {trackedOrder && (
        <div className="bg-white rounded-2xl border border-[#E7DDD0] p-6 sm:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0E8DC] pb-5">
            <div>
              <div className="flex items-center gap-2.5 text-xs text-[#6E5649]">
                <span className="font-semibold text-[#EA580C]">{trackedOrder.canteenName}</span>
                <span aria-hidden="true">·</span>
                <span>Pickup: {trackedOrder.pickupTime}</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-[#2C1810] mt-1 font-mono-tabular">
                {trackedOrder.id}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchOrder(trackedOrder.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8CBB9] text-xs font-semibold text-[#2C1810] hover:bg-[#FAF5EE] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {canCancel && trackedOrder.status === 'Order Placed' && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelOrder}
                  className="px-3.5 py-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Ready for Pickup Highlight */}
          {trackedOrder.status === 'Ready for Pickup' && (
            <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-3 text-[#065F46]">
              <BellRing className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <strong>Your order is ready for pickup!</strong> Head to the{' '}
                <strong>{trackedOrder.canteenName}</strong> counter and show Order ID{' '}
                <span className="font-mono-tabular font-bold">{trackedOrder.id}</span>.
              </div>
            </div>
          )}

          {/* Cancelled / Rejected Banner */}
          {isTerminated ? (
            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-3 text-[#991B1B]">
              <XCircle className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <strong>Order {trackedOrder.status}:</strong>{' '}
                {trackedOrder.status === 'Cancelled'
                  ? 'This order was cancelled before preparation started.'
                  : 'This order could not be accepted by the canteen.'}
              </div>
            </div>
          ) : (
            /* 5-Stage Visual Progress Indicator */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6E5649]">
                <span className="font-semibold text-[#2C1810]">Preparation Progress</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  Est. {trackedOrder.estimatedPrepMinutes} mins
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {TRACKING_STAGES.map((stage, index) => {
                  const completed = index <= activeStageIndex;
                  const current = index === activeStageIndex;

                  return (
                    <div
                      key={stage}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        current
                          ? 'bg-[#EA580C]/10 border-[#EA580C]'
                          : completed
                          ? 'bg-[#FAF5EE] border-[#D8CBB9]'
                          : 'bg-white border-[#EFE6D8] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                            completed
                              ? 'bg-[#EA580C] text-white'
                              : 'bg-[#F3ECE1] text-[#8C7466]'
                          }`}
                        >
                          {completed ? <Check className="w-3.5 h-3.5" /> : index + 1}
                        </span>
                        {current && (
                          <span className="text-[11px] font-semibold text-[#EA580C]">
                            Current
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs font-semibold leading-snug ${
                          completed ? 'text-[#2C1810]' : 'text-[#8C7466]'
                        }`}
                      >
                        {stage}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#F0E8DC]">
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-base text-[#2C1810]">
                Order Summary
              </h3>
              <div className="divide-y divide-[#F0E8DC]">
                {trackedOrder.items.map((item) => (
                  <div key={item.menuItemId} className="py-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <VegIndicator isVeg={item.isVeg} />
                      <span className="text-[#2C1810]">
                        {item.name} × {item.quantity}
                      </span>
                    </div>
                    <span className="tabular-nums font-medium text-[#2C1810]">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#E7DDD0] flex justify-between font-bold text-[#2C1810]">
                <span>Total</span>
                <span className="tabular-nums">₹{trackedOrder.totalAmount}</span>
              </div>
            </div>

            <div className="bg-[#FAF5EE] rounded-xl border border-[#E7DDD0] p-4 space-y-2.5 text-sm">
              <h3 className="font-display font-semibold text-base text-[#2C1810]">
                Pickup Information
              </h3>
              <div className="flex justify-between">
                <span className="text-[#6E5649]">Student</span>
                <span className="font-medium text-[#2C1810]">
                  {trackedOrder.studentName} ({trackedOrder.rollNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E5649]">Payment</span>
                <span className="font-medium text-[#2C1810]">
                  {trackedOrder.paymentMethod === 'Cash' ? 'Pay at Canteen' : 'UPI'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E5649]">Placed At</span>
                <span className="font-medium text-[#2C1810] tabular-nums">
                  {new Date(trackedOrder.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {trackedOrder.notes && (
                <div className="pt-2 border-t border-[#E7DDD0]">
                  <span className="block text-xs text-[#6E5649]">Notes</span>
                  <span className="text-xs text-[#2C1810]">{trackedOrder.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
