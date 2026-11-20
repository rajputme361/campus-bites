import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import type { UserProfile } from '../types';

export type AppRoute =
  | 'home'
  | 'menu'
  | 'checkout'
  | 'track'
  | 'student-dashboard'
  | 'admin-dashboard'
  | 'auth';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  cartCount: number;
  onOpenCart: () => void;
  user: UserProfile | null;
}

export function Navbar({
  activeRoute,
  onNavigate,
  cartCount,
  onOpenCart,
  user,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route: AppRoute) => {
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  const navItems: { label: string; route: AppRoute }[] = [
    { label: 'Home', route: 'home' },
    { label: 'Menus', route: 'menu' },
    { label: 'Track Order', route: 'track' },
    {
      label: user?.role === 'student' ? 'My Orders' : 'Student Sign In',
      route: user?.role === 'student' ? 'student-dashboard' : 'auth',
    },
    { label: 'Admin', route: 'admin-dashboard' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E7DDD0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-[#EA580C] text-white font-display font-bold text-base flex items-center justify-center shrink-0">
            CB
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-[#2C1810]">
            Campus Bites
          </span>
        </button>

        {/* Zone 2: Concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6E5649]" aria-label="Primary">
          {navItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded ${
                  isActive
                    ? 'text-[#2C1810] font-semibold'
                    : 'hover:text-[#2C1810]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-[21px] h-[2px] bg-[#EA580C]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C1810]"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Cart</span>
            <span className="tabular-nums font-mono text-xs bg-white/20 px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg border border-[#E7DDD0] text-[#2C1810] hover:bg-[#F3ECE1] transition-colors"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7DDD0] bg-[#FDFBF7] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EA580C]/10 text-[#EA580C] font-semibold'
                    : 'text-[#2C1810] hover:bg-[#F3ECE1]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
