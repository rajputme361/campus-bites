import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Check,
  Edit3,
  LogOut,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  AdminCanteenMetrics,
  Canteen,
  CanteenId,
  FoodCategory,
  MenuItem,
  Order,
  OrderStatus,
  UserProfile,
} from '../types';
import { api } from '../lib/api';
import { FoodImage } from './FoodImage';
import { VegIndicator } from './VegBadge';

const CATEGORIES: FoodCategory[] = [
  'Breakfast',
  'Snacks',
  'Fast Food',
  'Main Course',
  'Beverages',
  'Desserts',
];

const PRESET_FOOD_IMAGES = [
  { label: 'Masala Dosa', url: '/src/assets/images/food_masala_dosa_1795200117322.jpg' },
  { label: 'Poha Bowl', url: '/src/assets/images/food_poha_breakfast_1795200118143.jpg' },
  { label: 'Samosa Plate', url: '/src/assets/images/food_samosa_chaat_1795200117036.jpg' },
  { label: 'Paneer Roll', url: '/src/assets/images/food_paneer_roll_1795200117443.jpg' },
  { label: 'Crispy Burger', url: '/src/assets/images/food_crispy_burger_1795200116524.jpg' },
  { label: 'Penne Pasta', url: '/src/assets/images/food_margherita_pasta_1795200116461.jpg' },
  { label: 'Rajma Thali', url: '/src/assets/images/food_thali_rajma_1795200117100.jpg' },
  { label: 'Cold Coffee & Chai', url: '/src/assets/images/food_cold_coffee_1795200116907.jpg' },
  { label: 'Chocolate Brownie', url: '/src/assets/images/food_chocolate_brownie_1795200116878.jpg' },
];

interface AdminDashboardProps {
  user: UserProfile;
  canteens: Canteen[];
  menuItems: MenuItem[];
  lastStreamUpdateAt: number;
  onCanteenUpdated: (canteen: Canteen) => void;
  onMenuUpdated: () => Promise<void>;
  onLogout: () => void;
}

export function AdminDashboard({
  user,
  canteens,
  menuItems,
  lastStreamUpdateAt,
  onCanteenUpdated,
  onMenuUpdated,
  onLogout,
}: AdminDashboardProps) {
  const [activeCanteenId, setActiveCanteenId] = useState<CanteenId>('block-2');
  const [section, setSection] = useState<'orders' | 'menu' | 'settings'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<AdminCanteenMetrics | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [orderSearch, setOrderSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Menu Item Editor Modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('60');
  const [itemCategory, setItemCategory] = useState<FoodCategory>('Snacks');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemPrep, setItemPrep] = useState('10');
  const [itemImage, setItemImage] = useState(PRESET_FOOD_IMAGES[0].url);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Canteen Settings Form
  const activeCanteen = canteens.find((c) => c.id === activeCanteenId) || canteens[0];
  const [upiId, setUpiId] = useState(activeCanteen?.upiId || '');
  const [upiMerchantName, setUpiMerchantName] = useState(activeCanteen?.upiMerchantName || '');
  const [canteenOpen, setCanteenOpen] = useState(activeCanteen?.isOpen ?? true);
  const [canteenTimings, setCanteenTimings] = useState(activeCanteen?.timings || '');
  const [avgPrep, setAvgPrep] = useState(String(activeCanteen?.avgPrepMinutes || 12));
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (activeCanteen) {
      setUpiId(activeCanteen.upiId);
      setUpiMerchantName(activeCanteen.upiMerchantName);
      setCanteenOpen(activeCanteen.isOpen);
      setCanteenTimings(activeCanteen.timings);
      setAvgPrep(String(activeCanteen.avgPrepMinutes));
    }
  }, [activeCanteen]);

  const loadCanteenOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getAdminOrders(activeCanteenId);
      setOrders(res.orders);
      setMetrics(res.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch canteen orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, [activeCanteenId]);

  useEffect(() => {
    loadCanteenOrders();
  }, [loadCanteenOrders, lastStreamUpdateAt]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const canteenMenu = useMemo(
    () => menuItems.filter((item) => item.canteenId === activeCanteenId),
    [menuItems, activeCanteenId]
  );

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      if (orderFilter === 'active') {
        if (!['Order Placed', 'Order Accepted', 'Preparing Your Food', 'Ready for Pickup'].includes(order.status)) {
          return false;
        }
      } else if (orderFilter === 'completed') {
        if (order.status !== 'Completed') return false;
      }
      if (q) {
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesName = order.studentName.toLowerCase().includes(q);
        const matchesRoll = order.rollNumber.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesRoll) return false;
      }
      return true;
    });
  }, [orders, orderFilter, orderSearch]);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setError(null);
    try {
      await api.updateOrderStatus(orderId, status);
      await loadCanteenOrders();
      showToast(`Order ${orderId} updated to ${status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemDesc('');
    setItemPrice('60');
    setItemCategory('Snacks');
    setItemIsVeg(true);
    setItemAvailable(true);
    setItemPrep('10');
    setItemImage(PRESET_FOOD_IMAGES[0].url);
    setShowItemForm(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(String(item.price));
    setItemCategory(item.category);
    setItemIsVeg(item.isVeg);
    setItemAvailable(item.available);
    setItemPrep(String(item.prepTimeMinutes));
    setItemImage(item.image);
    setShowItemForm(true);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.4 * 1024 * 1024) {
      setError('Please select an image smaller than 2.4 MB.');
      return;
    }
    setUploadingImage(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });
      const { url } = await api.uploadFoodImage(dataUrl, file.name);
      setItemImage(url);
      showToast('Food image uploaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveMenuItem = async (e: FormEvent) => {
    e.preventDefault();
    setSavingItem(true);
    setError(null);
    try {
      const payload = {
        canteenId: activeCanteenId,
        name: itemName.trim(),
        description: itemDesc.trim(),
        price: Number(itemPrice),
        category: itemCategory,
        isVeg: itemIsVeg,
        available: itemAvailable,
        prepTimeMinutes: Number(itemPrep),
        image: itemImage,
      };
      if (editingItem) {
        await api.updateMenuItem(editingItem.id, payload);
        showToast(`Updated "${itemName}"`);
      } else {
        await api.createMenuItem(payload);
        showToast(`Added "${itemName}" to ${activeCanteen?.name}`);
      }
      await onMenuUpdated();
      setShowItemForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save menu item.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await api.updateMenuItem(item.id, { available: !item.available });
      await onMenuUpdated();
      showToast(`${item.name} marked ${!item.available ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not toggle availability.');
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await api.deleteMenuItem(id);
      setConfirmDeleteId(null);
      await onMenuUpdated();
      showToast('Menu item deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete item.');
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);
    try {
      const { canteen } = await api.updateCanteen(activeCanteenId, {
        upiId: upiId.trim(),
        upiMerchantName: upiMerchantName.trim(),
        isOpen: canteenOpen,
        timings: canteenTimings.trim(),
        avgPrepMinutes: Number(avgPrep),
      });
      onCanteenUpdated(canteen);
      showToast(`${canteen.name} settings saved`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save canteen settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Admin Header + Separate Canteen Workspace Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E7DDD0] pb-6">
        <div>
          <p className="text-xs font-semibold text-[#EA580C]">
            Canteen Admin Console · {user.fullName}
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#2C1810] mt-0.5">
            {activeCanteen?.name} Operations
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 rounded-xl bg-[#F3ECE1] border border-[#E7DDD0]">
            {canteens.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCanteenId(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCanteenId === c.id
                    ? 'bg-[#2C1810] text-white'
                    : 'text-[#6E5649] hover:text-[#2C1810]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-xs font-semibold text-[#2C1810] hover:bg-[#FAF5EE] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Feedback / Error Banners */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-sm font-medium text-[#065F46]">
          {feedback}
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E7DDD0] p-5">
          <span className="block text-xs font-medium text-[#6E5649]">Daily Sales (Today)</span>
          <span className="block font-display font-bold text-2xl text-[#2C1810] mt-1 tabular-nums">
            ₹{metrics?.todayRevenue ?? 0}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-[#E7DDD0] p-5">
          <span className="block text-xs font-medium text-[#6E5649]">Today&apos;s Orders</span>
          <span className="block font-display font-bold text-2xl text-[#2C1810] mt-1 tabular-nums">
            {metrics?.todayOrders ?? 0}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-[#E7DDD0] p-5">
          <span className="block text-xs font-medium text-[#6E5649]">Active Kitchen Queue</span>
          <span className="block font-display font-bold text-2xl text-[#EA580C] mt-1 tabular-nums">
            {metrics?.activeOrders ?? 0}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-[#E7DDD0] p-5">
          <span className="block text-xs font-medium text-[#6E5649]">
            Total Revenue ({metrics?.totalOrders ?? 0} orders)
          </span>
          <span className="block font-display font-bold text-2xl text-[#2C1810] mt-1 tabular-nums">
            ₹{metrics?.totalRevenue ?? 0}
          </span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E7DDD0]">
        {(
          [
            { id: 'orders', label: 'Orders Management' },
            { id: 'menu', label: `Menu Items (${canteenMenu.length})` },
            { id: 'settings', label: 'Canteen & UPI Settings' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSection(tab.id)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              section === tab.id
                ? 'border-[#EA580C] text-[#EA580C]'
                : 'border-transparent text-[#6E5649] hover:text-[#2C1810]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section 1: Orders Management */}
      {section === 'orders' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8C7466] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by Order ID, Student Name, or Roll Number..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div className="inline-flex p-1 rounded-lg bg-[#F3ECE1] border border-[#E7DDD0] self-start">
              {(
                [
                  { id: 'active', label: 'Active Queue' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'all', label: 'All Orders' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOrderFilter(f.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    orderFilter === f.id
                      ? 'bg-white text-[#2C1810] shadow-xs'
                      : 'text-[#6E5649] hover:text-[#2C1810]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loadingOrders && orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E7DDD0] p-8 text-sm text-[#6E5649]">
              Loading orders for {activeCanteen?.name}...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E7DDD0] p-10 text-center text-sm text-[#6E5649]">
              No orders match this filter in {activeCanteen?.name}.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#E7DDD0] p-5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F0E8DC] pb-3.5">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E5649]">
                        <span className="font-mono-tabular font-bold text-base text-[#2C1810]">
                          {order.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {order.studentName} ({order.rollNumber})
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{order.mobileNumber}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E5649]">
                        <span>Pickup: <strong className="text-[#2C1810]">{order.pickupTime}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Payment:{' '}
                          <strong className="text-[#2C1810]">
                            {order.paymentMethod === 'Cash' ? 'Cash at Counter' : 'UPI'}
                          </strong>
                          {order.upiTransactionRef ? ` (Ref: ${order.upiTransactionRef})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-display font-bold text-lg text-[#2C1810] tabular-nums">
                        ₹{order.totalAmount}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          order.status === 'Ready for Pickup' || order.status === 'Completed'
                            ? 'text-[#15803D]'
                            : order.status === 'Cancelled' || order.status === 'Rejected'
                            ? 'text-[#B91C1C]'
                            : 'text-[#EA580C]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                      {order.items.map((item) => (
                        <span key={item.menuItemId} className="inline-flex items-center gap-1.5 text-[#2C1810]">
                          <VegIndicator isVeg={item.isVeg} />
                          <span className="font-medium">{item.name}</span>
                          <span className="text-[#6E5649] tabular-nums">×{item.quantity}</span>
                        </span>
                      ))}
                      {order.notes && (
                        <span className="text-xs text-[#9A3412] bg-[#FAF5EE] px-2 py-0.5 rounded">
                          Note: {order.notes}
                        </span>
                      )}
                    </div>

                    {/* Stage Transition Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {order.status === 'Order Placed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'Order Accepted')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Order</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'Rejected')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-xs font-semibold cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {order.status === 'Order Accepted' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'Preparing Your Food')}
                          className="px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold cursor-pointer"
                        >
                          Start Preparing
                        </button>
                      )}

                      {order.status === 'Preparing Your Food' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'Ready for Pickup')}
                          className="px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold cursor-pointer"
                        >
                          Mark Ready for Pickup
                        </button>
                      )}

                      {order.status === 'Ready for Pickup' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'Completed')}
                          className="px-4 py-2 rounded-lg bg-[#2C1810] hover:bg-[#432519] text-white text-xs font-semibold cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Menu Management */}
      {section === 'menu' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[#6E5649]">
              Manage dishes, prices, availability, and photos exclusively for{' '}
              <strong className="text-[#2C1810]">{activeCanteen?.name}</strong>.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Food Item</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7DDD0] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E7DDD0] bg-[#FAF5EE] text-xs text-[#8C7466]">
                  <th className="py-3 px-4 font-semibold">Item</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Price</th>
                  <th className="py-3 px-4 font-semibold">Availability</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DC]">
                {canteenMenu.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDFBF7]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-[#F3ECE1] shrink-0 border border-[#E7DDD0]">
                          <FoodImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <VegIndicator isVeg={item.isVeg} />
                            <span className="font-semibold text-[#2C1810]">{item.name}</span>
                          </div>
                          <p className="text-xs text-[#6E5649] truncate max-w-xs">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#6E5649] whitespace-nowrap">{item.category}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#2C1810] tabular-nums whitespace-nowrap">
                      ₹{item.price}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold border cursor-pointer transition-colors ${
                          item.available
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#15803D]'
                            : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
                        }`}
                      >
                        {item.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg border border-[#E7DDD0] text-[#2C1810] hover:bg-[#FAF5EE] cursor-pointer"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === item.id ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-2 rounded-lg border border-[#E7DDD0] text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Canteen & UPI Settings */}
      {section === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-2xl border border-[#E7DDD0] p-6 sm:p-8 max-w-2xl space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#EA580C]" />
            <h2 className="font-display font-bold text-xl text-[#2C1810]">
              {activeCanteen?.name} Settings &amp; UPI Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                Configurable UPI ID
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="canteen@bank"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm font-mono-tabular text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                UPI Merchant Display Name
              </label>
              <input
                type="text"
                required
                value={upiMerchantName}
                onChange={(e) => setUpiMerchantName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                Opening Hours
              </label>
              <input
                type="text"
                required
                value={canteenTimings}
                onChange={(e) => setCanteenTimings(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                Average Prep Time (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                required
                value={avgPrep}
                onChange={(e) => setAvgPrep(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] tabular-nums focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={canteenOpen}
              onChange={(e) => setCanteenOpen(e.target.checked)}
              className="w-4 h-4 accent-[#EA580C]"
            />
            <span className="text-sm font-medium text-[#2C1810]">
              Accepting online pre-orders ({canteenOpen ? 'Open' : 'Paused'})
            </span>
          </label>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {savingSettings ? 'Saving...' : 'Save Canteen Settings'}
          </button>
        </form>
      )}

      {/* Add / Edit Menu Item Modal */}
      {showItemForm && (
        <div
          className="fixed inset-0 z-50 bg-[#2C1810]/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-[#E7DDD0] max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F0E8DC] pb-4">
              <h2 className="font-display font-bold text-xl text-[#2C1810]">
                {editingItem ? 'Edit Food Item' : `Add Dish to ${activeCanteen?.name}`}
              </h2>
              <button
                type="button"
                onClick={() => setShowItemForm(false)}
                className="p-1.5 rounded-lg text-[#6E5649] hover:bg-[#FAF5EE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Food Name
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Aloo Paratha with Curd"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Describe ingredients and serving style..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8CBB9] text-sm tabular-nums text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                    Category
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as FoodCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] bg-white focus:outline-none focus:border-[#EA580C]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={itemPrep}
                    onChange={(e) => setItemPrep(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8CBB9] text-sm tabular-nums text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-[#2C1810] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemIsVeg}
                    onChange={(e) => setItemIsVeg(e.target.checked)}
                    className="w-4 h-4 accent-[#15803D]"
                  />
                  <span>Vegetarian Dish</span>
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-[#2C1810] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="w-4 h-4 accent-[#EA580C]"
                  />
                  <span>Currently Available</span>
                </label>
              </div>

              {/* Food Image Upload or Preset Selection */}
              <div className="space-y-2.5 pt-2 border-t border-[#F0E8DC]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#6E5649]">
                    Dish Photo (Upload or Choose Preset)
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF5EE] border border-[#D8CBB9] text-xs font-semibold text-[#2C1810] hover:bg-[#F3ECE1] cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-lg overflow-hidden border border-[#E7DDD0] bg-[#F3ECE1] shrink-0">
                    <FoodImage src={itemImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <select
                    value={itemImage}
                    onChange={(e) => setItemImage(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#D8CBB9] text-xs text-[#2C1810] bg-white"
                  >
                    {PRESET_FOOD_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        Preset: {img.label}
                      </option>
                    ))}
                    {!PRESET_FOOD_IMAGES.some((p) => p.url === itemImage) && (
                      <option value={itemImage}>Uploaded Photo ({itemImage})</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0E8DC]">
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8CBB9] text-sm font-semibold text-[#2C1810] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem || uploadingImage}
                  className="px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold cursor-pointer"
                >
                  {savingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
