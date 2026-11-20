import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Banknote,
  Lock,
  QrCode,
} from 'lucide-react';
import type {
  Canteen,
  CartItem,
  Order,
  PaymentMethod,
  UserProfile,
} from '../types';
import { api } from '../lib/api';
import { VegIndicator } from './VegBadge';

const PICKUP_SLOTS = [
  'ASAP (~15 mins)',
  'In 20 mins',
  'In 30 mins',
  'In 45 mins',
  '12:30 PM Break',
  '1:15 PM Lunch Slot',
  '4:15 PM Evening Slot',
];

interface CheckoutViewProps {
  cart: CartItem[];
  canteen: Canteen | undefined;
  user: UserProfile | null;
  onBackToMenu: () => void;
  onRequireAuth: () => void;
  onOrderPlaced: (order: Order) => void;
  onTrackOrder: (orderId: string) => void;
}

export function CheckoutView({
  cart,
  canteen,
  user,
  onBackToMenu,
  onRequireAuth,
  onOrderPlaced,
  onTrackOrder,
}: CheckoutViewProps) {
  const [studentName, setStudentName] = useState(user?.fullName || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [pickupTime, setPickupTime] = useState(PICKUP_SLOTS[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiTransactionRef, setUpiTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (user) {
      setStudentName((prev) => prev || user.fullName || '');
      setRollNumber((prev) => prev || user.rollNumber || '');
      setMobileNumber((prev) => prev || user.mobileNumber || '');
    }
  }, [user]);

  const subtotal = cart.reduce((sum, entry) => sum + entry.menuItem.price * entry.quantity, 0);

  const handleCopyUpi = () => {
    if (!canteen?.upiId) return;
    navigator.clipboard?.writeText(canteen.upiId).catch(() => undefined);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      onRequireAuth();
      return;
    }
    if (!canteen) {
      setError('Selected canteen is missing.');
      return;
    }
    if (!studentName.trim() || !rollNumber.trim() || !mobileNumber.trim()) {
      setError('Please enter your full name, roll number, and mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const { order } = await api.placeOrder({
        canteenId: canteen.id,
        studentName: studentName.trim(),
        rollNumber: rollNumber.trim(),
        mobileNumber: mobileNumber.trim(),
        items: cart.map((entry) => ({
          menuItemId: entry.menuItem.id,
          quantity: entry.quantity,
        })),
        pickupTime,
        paymentMethod,
        upiTransactionRef: paymentMethod === 'UPI' ? upiTransactionRef.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      setConfirmedOrder(order);
      onOrderPlaced(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Order Confirmation Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#E7DDD0] p-6 sm:p-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#15803D]/10 text-[#15803D] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#15803D]">Order Confirmed</p>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#2C1810] mt-0.5">
                Order #{confirmedOrder.id}
              </h1>
              <p className="text-sm text-[#6E5649] mt-1">
                Sent directly to <strong>{confirmedOrder.canteenName}</strong>. You can follow live preparation updates below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[#F0E8DC] text-sm">
            <div>
              <span className="block text-xs text-[#8C7466]">Canteen</span>
              <span className="font-semibold text-[#2C1810]">{confirmedOrder.canteenName}</span>
            </div>
            <div>
              <span className="block text-xs text-[#8C7466]">Pickup Time</span>
              <span className="font-semibold text-[#2C1810]">{confirmedOrder.pickupTime}</span>
            </div>
            <div>
              <span className="block text-xs text-[#8C7466]">Payment</span>
              <span className="font-semibold text-[#2C1810]">
                {confirmedOrder.paymentMethod === 'Cash' ? 'Pay at Canteen' : 'UPI Payment'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#8C7466]">Status</span>
              <span className="font-semibold text-[#EA580C]">{confirmedOrder.status}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-display font-semibold text-base text-[#2C1810]">
              Ordered Items
            </h2>
            <div className="divide-y divide-[#F0E8DC]">
              {confirmedOrder.items.map((item) => (
                <div key={item.menuItemId} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <VegIndicator isVeg={item.isVeg} />
                    <span className="text-[#2C1810] font-medium">
                      {item.name} × {item.quantity}
                    </span>
                  </div>
                  <span className="tabular-nums font-semibold text-[#2C1810]">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-[#E7DDD0] flex items-center justify-between">
              <span className="font-display font-bold text-base text-[#2C1810]">Total Bill</span>
              <span className="font-display font-bold text-xl text-[#2C1810] tabular-nums">
                ₹{confirmedOrder.totalAmount}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onTrackOrder(confirmedOrder.id)}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Track Live Order
            </button>
            <button
              type="button"
              onClick={onBackToMenu}
              className="px-5 py-3 rounded-lg border border-[#D8CBB9] text-sm font-semibold text-[#2C1810] hover:bg-[#FAF5EE] cursor-pointer"
            >
              Back to Menus
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0 || !canteen) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display font-bold text-2xl text-[#2C1810]">
          Your cart is empty
        </h1>
        <p className="text-sm text-[#6E5649]">
          Add items from Block 2 Canteen or Apple &amp; Bees Canteen before checking out.
        </p>
        <button
          type="button"
          onClick={onBackToMenu}
          className="px-5 py-2.5 rounded-lg bg-[#EA580C] text-white text-sm font-semibold cursor-pointer"
        >
          Explore Menus
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <button
        type="button"
        onClick={onBackToMenu}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#6E5649] hover:text-[#2C1810] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {canteen.name} Menu</span>
      </button>

      {!user && (
        <div className="mb-8 bg-[#FAF5EE] border border-[#E7DDD0] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display font-semibold text-base text-[#2C1810]">
                Sign in required to place your pre-order
              </h2>
              <p className="text-sm text-[#6E5649]">
                Register or log in with your college roll number so you can track orders and view history.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRequireAuth}
            className="px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Student Sign In / Register
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E7DDD0] p-6 space-y-5">
            <h1 className="font-display font-bold text-2xl text-[#2C1810]">
              Student &amp; Pickup Details
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  College Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. CS2024089"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] uppercase focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6E5649]">
                <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Preferred Pickup Time</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PICKUP_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPickupTime(slot)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors text-left cursor-pointer ${
                      pickupTime === slot
                        ? 'bg-[#EA580C]/10 border-[#EA580C] text-[#9A3412]'
                        : 'bg-white border-[#E7DDD0] text-[#6E5649] hover:border-[#2C1810]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                Kitchen Instructions (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={180}
                placeholder="e.g. Less spicy, extra chutney, no ice"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          {/* Payment Options */}
          <div className="bg-white rounded-2xl border border-[#E7DDD0] p-6 space-y-5">
            <h2 className="font-display font-bold text-xl text-[#2C1810]">
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  paymentMethod === 'UPI'
                    ? 'bg-[#EA580C]/5 border-[#EA580C]'
                    : 'bg-white border-[#E7DDD0] hover:border-[#2C1810]'
                }`}
              >
                <CreditCard className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-sm text-[#2C1810]">
                    UPI Payment
                  </span>
                  <span className="block text-xs text-[#6E5649] mt-0.5">
                    Pay via GPay, PhonePe, Paytm or any UPI app
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'bg-[#EA580C]/5 border-[#EA580C]'
                    : 'bg-white border-[#E7DDD0] hover:border-[#2C1810]'
                }`}
              >
                <Banknote className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-sm text-[#2C1810]">
                    Pay at Canteen (Cash)
                  </span>
                  <span className="block text-xs text-[#6E5649] mt-0.5">
                    Settle cash directly at the pickup counter
                  </span>
                </div>
              </button>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="bg-[#FAF5EE] rounded-xl border border-[#E7DDD0] p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-white border border-[#E7DDD0] flex items-center justify-center text-[#2C1810] shrink-0">
                      <QrCode className="w-6 h-6 text-[#EA580C]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6E5649]">
                        Pay ₹{subtotal} to {canteen.upiMerchantName}
                      </p>
                      <p className="font-mono-tabular text-sm font-semibold text-[#2C1810]">
                        {canteen.upiId}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D8CBB9] text-xs font-semibold text-[#2C1810] hover:bg-[#F3ECE1] cursor-pointer self-start sm:self-auto"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUpi ? 'Copied UPI ID' : 'Copy UPI ID'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                    UPI Transaction ID / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={upiTransactionRef}
                    onChange={(e) => setUpiTransactionRef(e.target.value)}
                    placeholder="Enter 12-digit UTR or UPI ref if paid now"
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white font-semibold text-base transition-colors cursor-pointer"
          >
            {submitting
              ? 'Placing Order...'
              : user
              ? `Place Order · ₹${subtotal}`
              : 'Sign In to Place Order'}
          </button>
        </form>

        {/* Right: Order Bill Summary */}
        <aside className="lg:col-span-5 bg-white rounded-2xl border border-[#E7DDD0] p-6 space-y-5 lg:sticky lg:top-24">
          <div className="border-b border-[#F0E8DC] pb-4">
            <span className="text-xs font-semibold text-[#EA580C]">Selected Canteen</span>
            <h2 className="font-display font-bold text-xl text-[#2C1810] mt-0.5">
              {canteen.name}
            </h2>
            <p className="text-xs text-[#6E5649] mt-0.5">{canteen.location}</p>
          </div>

          <div className="divide-y divide-[#F0E8DC]">
            {cart.map(({ menuItem, quantity }) => (
              <div key={menuItem.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <VegIndicator isVeg={menuItem.isVeg} />
                  <span className="text-[#2C1810] font-medium truncate">
                    {menuItem.name}
                  </span>
                  <span className="text-xs text-[#8C7466] shrink-0 tabular-nums">
                    ×{quantity}
                  </span>
                </div>
                <span className="font-semibold text-[#2C1810] tabular-nums shrink-0">
                  ₹{menuItem.price * quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E7DDD0] pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-[#6E5649]">
              <span>Subtotal</span>
              <span className="tabular-nums">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-[#6E5649]">
              <span>Pickup Slot</span>
              <span className="font-medium text-[#2C1810]">{pickupTime}</span>
            </div>
            <div className="pt-2 border-t border-[#F0E8DC] flex justify-between items-baseline">
              <span className="font-display font-bold text-base text-[#2C1810]">
                Total Payable
              </span>
              <span className="font-display font-bold text-2xl text-[#2C1810] tabular-nums">
                ₹{subtotal}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
