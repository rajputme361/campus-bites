import { useCallback, useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import type { Canteen, CanteenId, CartItem, MenuItem, Order, UserProfile } from './types';
import { api, setAuthToken } from './lib/api';
import { Navbar, type AppRoute } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MenuView } from './components/MenuView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { AuthView } from './components/AuthView';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [authTab, setAuthTab] = useState<'student-login' | 'student-register' | 'admin-login'>('student-login');
  const [returnRouteAfterAuth, setReturnRouteAfterAuth] = useState<AppRoute | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<CanteenId>('block-2');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCanteenId, setCartCanteenId] = useState<CanteenId | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  const [lastStreamUpdateAt, setLastStreamUpdateAt] = useState(0);
  const [readyAlertOrder, setReadyAlertOrder] = useState<{
    orderId: string;
    canteenName: string;
  } | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoadingMenu(true);
    try {
      const [canteenRes, menuRes] = await Promise.all([api.getCanteens(), api.getMenu()]);
      setCanteens(canteenRes.canteens);
      setMenuItems(menuRes.items);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  const refreshMenu = useCallback(async () => {
    try {
      const menuRes = await api.getMenu();
      setMenuItems(menuRes.items);
    } catch (err) {
      console.error('Failed to refresh menu:', err);
    }
  }, []);

  const loadMyOrders = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    setLoadingMyOrders(true);
    try {
      const { orders } = await api.getMyOrders();
      setMyOrders(orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingMyOrders(false);
    }
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadMyOrders();
  }, [loadMyOrders]);

  // Real-time Server-Sent Events subscription for live order status & ready alerts
  useEffect(() => {
    const source = new EventSource('/api/orders/stream');
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type?: string;
          orderId?: string;
          canteenId?: CanteenId;
          status?: string;
        };
        if (data.type === 'ORDER_UPDATE') {
          setLastStreamUpdateAt(Date.now());
          if (user?.role === 'student') {
            api
              .getMyOrders()
              .then(({ orders }) => {
                setMyOrders(orders);
                const updated = orders.find((o) => o.id === data.orderId);
                if (updated && updated.status === 'Ready for Pickup') {
                  setReadyAlertOrder({
                    orderId: updated.id,
                    canteenName: updated.canteenName,
                  });
                }
              })
              .catch(() => undefined);
          }
        }
      } catch {
        // ignore keepalive parse errors
      }
    };
    return () => source.close();
  }, [user]);

  const handleNavigate = (nextRoute: AppRoute) => {
    if (nextRoute === 'admin-dashboard' && user?.role !== 'admin') {
      setAuthTab('admin-login');
      setReturnRouteAfterAuth('admin-dashboard');
      setRoute('auth');
      return;
    }
    if (nextRoute === 'student-dashboard' && user?.role !== 'student') {
      setAuthTab('student-login');
      setReturnRouteAfterAuth('student-dashboard');
      setRoute('auth');
      return;
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCanteen = (canteenId: CanteenId) => {
    setSelectedCanteenId(canteenId);
    setRoute('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.menuItem.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.menuItem.id === item.id
            ? { ...entry, quantity: Math.min(25, entry.quantity + 1) }
            : entry
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    setCartCanteenId(item.canteenId);
  };

  const handleReplaceCartWithItem = (item: MenuItem) => {
    setCart([{ menuItem: item, quantity: 1 }]);
    setCartCanteenId(item.canteenId);
  };

  const handleUpdateCartQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((entry) =>
          entry.menuItem.id === menuItemId
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0);
      if (updated.length === 0) {
        setCartCanteenId(null);
      }
      return updated;
    });
  };

  const handleRemoveCartItem = (menuItemId: string) => {
    setCart((prev) => {
      const updated = prev.filter((entry) => entry.menuItem.id !== menuItemId);
      if (updated.length === 0) setCartCanteenId(null);
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setCartCanteenId(null);
  };

  const handleAuthenticated = (authedUser: UserProfile, token: string) => {
    setAuthToken(token);
    setUser(authedUser);
    if (authedUser.role === 'admin') {
      setReturnRouteAfterAuth(null);
      setRoute('admin-dashboard');
    } else if (returnRouteAfterAuth && returnRouteAfterAuth !== 'admin-dashboard') {
      const target = returnRouteAfterAuth;
      setReturnRouteAfterAuth(null);
      setRoute(target);
    } else {
      setRoute('student-dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setMyOrders([]);
    setRoute('home');
  };

  const handleOrderPlaced = (order: Order) => {
    setCart([]);
    setCartCanteenId(null);
    setMyOrders((prev) => [order, ...prev]);
    setTrackedOrderId(order.id);
  };

  const handleTrackOrder = (orderId: string) => {
    setTrackedOrderId(orderId);
    setRoute('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReorder = (order: Order) => {
    const validItems: CartItem[] = [];
    for (const orderedItem of order.items) {
      const liveItem = menuItems.find(
        (m) => m.id === orderedItem.menuItemId && m.available
      );
      if (liveItem) {
        validItems.push({ menuItem: liveItem, quantity: orderedItem.quantity });
      }
    }
    if (validItems.length === 0) {
      setSelectedCanteenId(order.canteenId);
      setRoute('menu');
      return;
    }
    setCart(validItems);
    setCartCanteenId(order.canteenId);
    setSelectedCanteenId(order.canteenId);
    setCartOpen(true);
  };

  const handleCancelMyOrder = async (orderId: string) => {
    const { order } = await api.cancelOrder(orderId);
    setMyOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
  };

  const cartCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartCanteen = canteens.find((c) => c.id === cartCanteenId);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C1810]">
      <Navbar
        activeRoute={route}
        onNavigate={handleNavigate}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        user={user}
      />

      {/* Live Ready-for-Pickup Notification Banner */}
      {readyAlertOrder && (
        <div className="bg-[#065F46] text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <BellRing className="w-4 h-4 shrink-0" />
              <span>
                <strong>Order {readyAlertOrder.orderId} is Ready for Pickup!</strong> Please collect your meal from{' '}
                <strong>{readyAlertOrder.canteenName}</strong>.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleTrackOrder(readyAlertOrder.orderId);
                  setReadyAlertOrder(null);
                }}
                className="text-xs font-semibold underline cursor-pointer"
              >
                View Order
              </button>
              <button
                type="button"
                onClick={() => setReadyAlertOrder(null)}
                aria-label="Dismiss notification"
                className="p-1 hover:bg-white/10 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {route === 'home' && (
          <HomeView
            canteens={canteens}
            onSelectCanteen={handleSelectCanteen}
            onTrackOrderId={handleTrackOrder}
          />
        )}

        {route === 'menu' && (
          <MenuView
            canteens={canteens}
            selectedCanteenId={selectedCanteenId}
            onSwitchCanteen={setSelectedCanteenId}
            menuItems={menuItems}
            loading={loadingMenu}
            cart={cart}
            cartCanteenId={cartCanteenId}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onReplaceCartWithItem={handleReplaceCartWithItem}
          />
        )}

        {route === 'checkout' && (
          <CheckoutView
            cart={cart}
            canteen={cartCanteen}
            user={user}
            onBackToMenu={() => setRoute('menu')}
            onRequireAuth={() => {
              setAuthTab('student-login');
              setReturnRouteAfterAuth('checkout');
              setRoute('auth');
            }}
            onOrderPlaced={handleOrderPlaced}
            onTrackOrder={handleTrackOrder}
          />
        )}

        {route === 'track' && (
          <OrderTrackingView
            initialOrderId={trackedOrderId}
            myOrders={myOrders}
            lastStreamUpdateAt={lastStreamUpdateAt}
            onOrderUpdated={(updated) =>
              setMyOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
            }
          />
        )}

        {route === 'auth' && (
          <AuthView
            initialTab={authTab}
            onAuthenticated={handleAuthenticated}
          />
        )}

        {route === 'student-dashboard' && user?.role === 'student' && (
          <StudentDashboard
            user={user}
            orders={myOrders}
            loading={loadingMyOrders}
            onLogout={handleLogout}
            onTrackOrder={handleTrackOrder}
            onReorder={handleReorder}
            onCancelOrder={handleCancelMyOrder}
            onBrowseMenus={() => setRoute('menu')}
          />
        )}

        {route === 'admin-dashboard' && user?.role === 'admin' && (
          <AdminDashboard
            user={user}
            canteens={canteens}
            menuItems={menuItems}
            lastStreamUpdateAt={lastStreamUpdateAt}
            onCanteenUpdated={(updatedCanteen) =>
              setCanteens((prev) =>
                prev.map((c) => (c.id === updatedCanteen.id ? updatedCanteen : c))
              )
            }
            onMenuUpdated={refreshMenu}
            onLogout={handleLogout}
          />
        )}
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        canteen={cartCanteen}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckout={() => {
          setCartOpen(false);
          setRoute('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onBrowseMenus={() => setRoute('menu')}
      />

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E7DDD0] bg-[#FAF5EE] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E5649]">
          <p className="font-medium text-[#2C1810]">
            Campus Bites · College Canteen Pre-Order System
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleSelectCanteen('block-2')}
              className="hover:text-[#2C1810] cursor-pointer"
            >
              Block 2 Canteen
            </button>
            <button
              type="button"
              onClick={() => handleSelectCanteen('apple-bees')}
              className="hover:text-[#2C1810] cursor-pointer"
            >
              Apple &amp; Bees Canteen
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('track')}
              className="hover:text-[#2C1810] cursor-pointer"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin-dashboard')}
              className="hover:text-[#2C1810] cursor-pointer"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
