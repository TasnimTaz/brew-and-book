'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import SlotSelector from '@/components/SlotSelector';
import FloorPlan from '@/components/FloorPlan';
import TableMenuPanel from '@/components/TableMenuPanel';
import CartBar from '@/components/CartBar';
import { CheckIcon } from '@/components/Icons';
import { Hero, MenuShowcase, OurSpace, HowItWorks, SiteFooter } from '@/components/Landing';
import { Table, TimeSlot, MenuCategory, MenuItem, CartItem } from '@/types';

function getUpcomingDates() {
  const dates = [];
  const today = new Date();
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNamesEn[d.getDay()];

    dates.push({ dateStr, label, dayName });
  }
  return dates;
}

export default function Home() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [tables, setTables] = useState<Table[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const upcomingDates = useMemo(() => getUpcomingDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDates[0].dateStr);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [slotsRes, menuRes, tablesRes] = await Promise.all([
          fetch('/api/slots').then((r) => r.json()),
          fetch('/api/menu').then((r) => r.json()),
          fetch('/api/tables').then((r) => r.json()),
        ]);

        if (slotsRes.slots?.length > 0) {
          setSlots(slotsRes.slots);
          setSelectedSlotId(slotsRes.slots[0].id);
        }
        if (menuRes.categories && menuRes.items) {
          setCategories(menuRes.categories);
          setMenuItems(menuRes.items);
        }
        if (tablesRes.tables) {
          setTables(tablesRes.tables);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedSlotId) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/tables?date=${selectedDate}&slotId=${selectedSlotId}`, { signal: controller.signal });
        const data = await res.json();
        if (data.tables) {
          setTables(data.tables);
          setSelectedTable((prev) => (prev ? data.tables.find((t: Table) => t.id === prev.id) || prev : null));
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Failed to fetch table statuses', err);
      }
    })();
    return () => controller.abort();
  }, [selectedDate, selectedSlotId]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => {
      if (t.zone) set.add(t.zone);
    });
    return Array.from(set);
  }, [tables]);

  const counts = useMemo(() => {
    let available = 0;
    let held = 0;
    let booked = 0;
    let unavailable = 0;
    tables.forEach((t) => {
      const status = t.status || 'AVAILABLE';
      if (status === 'AVAILABLE') available++;
      else if (status === 'HELD') held++;
      else if (status === 'BOOKED' || status === 'OCCUPIED') booked++;
      else unavailable++;
    });
    return { available, held, booked, unavailable };
  }, [tables]);

  const activeSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) || null,
    [slots, selectedSlotId]
  );

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setIsMobileDrawerOpen(true);
  };

  const handleAddToCart = (item: MenuItem, selectedOptions?: Record<string, string>) => {
    const optHash = selectedOptions ? JSON.stringify(selectedOptions) : '';
    const cartItemId = `${item.id}-${optHash}`;

    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartItemId);
      if (existing) {
        return prev.map((c) =>
          c.id === cartItemId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          menuItemId: item.id,
          name: item.name,
          nameBn: item.nameBn,
          priceBdt: item.priceBdt,
          quantity: 1,
          selectedOptions,
        },
      ];
    });
    showToast(
      lang === 'en' ? `Added ${item.name} to order` : `${item.name} অর্ডারে যোগ হয়েছে`
    );
  };

  const handleUpdateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === cartItemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setIsCartModalOpen(false);
  };

  const totalCartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalCartAmount = cart.reduce((sum, c) => sum + c.priceBdt * c.quantity, 0);

  return (
    <div className="min-h-screen bg-[#140d09] text-foreground flex flex-col">
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'bn' : 'en'))}
        cartCount={totalCartCount}
        cartTotal={totalCartAmount}
        onOpenCart={() => setIsCartModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2 rounded-xl bg-primary-dark px-4 py-2.5 text-xs font-semibold text-white shadow-xl ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon className="h-3 w-3" />
          </span>
          <span>{toastMsg}</span>
        </div>
      )}

      <Hero lang={lang} tableCount={tables.length} itemCount={menuItems.length} />
      <MenuShowcase lang={lang} categories={categories} items={menuItems} onAdd={(i) => handleAddToCart(i)} />

      <OurSpace lang={lang} />

      <section id="book" className="bg-[#f6f2ec] py-14">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8 mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{lang === 'en' ? 'Live floor plan' : 'লাইভ ফ্লোর প্ল্যান'}</p>
        <h2 className="font-display mt-2 text-4xl font-semibold text-primary-dark">{lang === 'en' ? 'Choose your table' : 'আপনার টেবিল বেছে নিন'}</h2>
      </div>
      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Sleek Slot & Filter Bar */}
        <SlotSelector
          dates={upcomingDates}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d)}
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelectSlot={(id) => setSelectedSlotId(id)}
          selectedSeats={selectedSeats}
          onSelectSeats={(seats) => setSelectedSeats(seats)}
          selectedZone={selectedZone}
          onSelectZone={(zone) => setSelectedZone(zone)}
          zones={zones}
          counts={counts}
          lang={lang}
        />

        {/* Split Interactive Workspace: Floor Plan (Left) + Live Table/Menu Panel (Right) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 xl:col-span-8">
            {isLoading ? (
              <div className="flex h-[540px] items-center justify-center rounded-2xl border border-border/80 bg-surface shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                  <p className="text-xs font-semibold text-muted">
                    {lang === 'en' ? 'Loading live floor plan...' : 'ফ্লোর প্ল্যান লোড হচ্ছে...'}
                  </p>
                </div>
              </div>
            ) : (
              <FloorPlan
                tables={tables}
                selectedTable={selectedTable}
                onSelectTable={handleSelectTable}
                selectedSeats={selectedSeats}
                selectedZone={selectedZone}
                lang={lang}
              />
            )}
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <TableMenuPanel
              tables={tables}
              selectedTable={selectedTable}
              onSelectTable={handleSelectTable}
              onClearTable={() => setSelectedTable(null)}
              isMobileOpen={isMobileDrawerOpen}
              onCloseMobile={() => setIsMobileDrawerOpen(false)}
              selectedSlot={activeSlot}
              selectedDate={selectedDate}
              categories={categories}
              items={menuItems}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartQty={handleUpdateCartQty}
              lang={lang}
            />
          </div>
        </div>
      </main>
      </section>
      <HowItWorks lang={lang} />

      <CartBar
        cart={cart}
        selectedTable={selectedTable}
        selectedDate={selectedDate}
        selectedSlot={activeSlot}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        lang={lang}
        isOpen={isCartModalOpen}
        onToggleOpen={() => setIsCartModalOpen((prev) => !prev)}
      />

      <SiteFooter lang={lang} />
    </div>
  );
}
