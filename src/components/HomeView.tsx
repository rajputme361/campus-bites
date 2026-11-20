import { useState, type FormEvent } from 'react';
import { ArrowRight, Clock, MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';
import type { Canteen, CanteenId } from '../types';
import { FoodImage } from './FoodImage';

interface HomeViewProps {
  canteens: Canteen[];
  onSelectCanteen: (canteenId: CanteenId) => void;
  onTrackOrderId: (orderId: string) => void;
}

export function HomeView({
  canteens,
  onSelectCanteen,
  onTrackOrderId,
}: HomeViewProps) {
  const [quickTrackId, setQuickTrackId] = useState('');

  const handleQuickTrack = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = quickTrackId.trim().toUpperCase();
    if (!trimmed) return;
    onTrackOrderId(trimmed);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Split Hero Section */}
      <section className="border-b border-[#E7DDD0] bg-[#FAF5EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-6 flex flex-col justify-center space-y-6"
            >
              <p className="text-sm font-medium text-[#EA580C]">
                College Canteen Pre-Order System
              </p>
              <h1
                className="font-display font-bold text-[#2C1810] tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)', textWrap: 'balance' }}
              >
                Hungry? Skip the Queue!
              </h1>
              <p className="text-base sm:text-lg text-[#6E5649] max-w-xl leading-relaxed">
                Pre-order your favourite food from your college canteen. Browse live menus, pick your break slot, and collect hot meals straight from the counter.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectCanteen('block-2')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Order from Block 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCanteen('apple-bees')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-[#D8CBB9] hover:border-[#2C1810] text-[#2C1810] font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Order from Apple &amp; Bees</span>
                </button>
              </div>

              {/* Inline Order Tracker */}
              <form
                onSubmit={handleQuickTrack}
                className="pt-4 border-t border-[#E7DDD0] max-w-md"
              >
                <label
                  htmlFor="quick-track-id"
                  className="block text-xs font-medium text-[#6E5649] mb-2"
                >
                  Already placed an order? Track live preparation status
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#8C7466] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="quick-track-id"
                      type="text"
                      value={quickTrackId}
                      onChange={(e) => setQuickTrackId(e.target.value)}
                      placeholder="Enter Order ID (e.g. CB-B2-1041)"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#D8CBB9] rounded-lg text-[#2C1810] placeholder:text-[#9E887B] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-[#2C1810] hover:bg-[#432519] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-6"
            >
              <div className="h-full min-h-[280px] lg:min-h-[420px] rounded-2xl overflow-hidden border border-[#E7DDD0] bg-[#EFE6D8]">
                <FoodImage
                  src="/src/assets/images/hero_campus_spread_1795200117267.jpg"
                  alt="Fresh masala dosa, samosas, crispy burger and iced coffee from Campus Bites"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Two Large Canteen Selection Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#2C1810] tracking-tight">
              Choose Your Campus Canteen
            </h2>
            <p className="text-sm sm:text-base text-[#6E5649] mt-1.5">
              Each canteen runs its own live kitchen menu, pickup counter, and order queue.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {canteens.map((canteen, idx) => (
            <motion.article
              key={canteen.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="group bg-white rounded-2xl border border-[#E7DDD0] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-[#F3ECE1]">
                <FoodImage
                  src={canteen.image}
                  alt={canteen.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 text-xs font-medium text-[#6E5649]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                      {canteen.location}
                    </span>
                    <span className={canteen.isOpen ? 'text-[#15803D] font-semibold' : 'text-[#B91C1C] font-semibold'}>
                      {canteen.isOpen ? 'Open for Pre-Orders' : 'Currently Closed'}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-2xl text-[#2C1810]">
                    {canteen.name}
                  </h3>
                  <p className="text-sm text-[#6E5649] leading-relaxed">
                    {canteen.description}
                  </p>
                </div>

                <div className="pt-5 border-t border-[#F0E8DC] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs text-[#6E5649] tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8C7466]" />
                      {canteen.timings}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>~{canteen.avgPrepMinutes} min prep</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectCanteen(canteen.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Explore Menu</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Clean 4-Step Campus Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF5EE] rounded-2xl border border-[#E7DDD0] p-6 sm:p-10">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#2C1810] mb-8">
            How Campus Pre-Ordering Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01. Pick a Canteen',
                text: 'Choose Block 2 Canteen or Apple & Bees Canteen and filter live dishes by category or veg preference.',
              },
              {
                step: '02. Choose Pickup Slot',
                text: 'Set your preferred pickup window between classes so kitchen staff time your order fresh.',
              },
              {
                step: '03. Pay via UPI or Cash',
                text: 'Confirm using instant canteen UPI or pay cash directly when collecting at the pickup counter.',
              },
              {
                step: '04. Track & Collect',
                text: 'Watch live preparation stages and receive an alert the moment your meal is ready for pickup.',
              },
            ].map((item) => (
              <div key={item.step} className="space-y-2">
                <h3 className="font-display font-semibold text-base text-[#2C1810]">
                  {item.step}
                </h3>
                <p className="text-sm text-[#6E5649] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
