'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SlotSelector from '@/components/SlotSelector';
import FloorPlan from '@/components/FloorPlan';
import TableMenuPanel from '@/components/TableMenuPanel';
import CartBar from '@/components/CartBar';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CoffeeIcon,
  MapPinIcon,
  StarIcon,
  UsersIcon,
  WifiIcon,
} from '@/components/Icons';
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
    const label = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
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
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 2400);
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
        if (tablesRes.tables) setTables(tablesRes.tables);
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const fetchTableStatus = useCallback(async (date: string, slotId: number) => {
    try {
      const res = await fetch(`/api/tables?date=${date}&slotId=${slotId}`);
      const data = await res.json();
      if (data.tables) {
        setTables(data.tables);
        setSelectedTable((prev) =>
          prev ? data.tables.find((t: Table) => t.id === prev.id) || prev : null
        );
      }
    } catch (err) {
      console.error('Failed to fetch table statuses', err);
    }
  }, []);

  useEffect(() => {
    if (selectedDate && selectedSlotId) fetchTableStatus(selectedDate, selectedSlotId);
  }, [selectedDate, selectedSlotId, fetchTableStatus]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => t.zone && set.add(t.zone));
    return Array.from(set);
  }, [tables]);

  const counts = useMemo(() => {
    let available = 0, held = 0, booked = 0, unavailable = 0;
    tables.forEach((t) => {
      const s = t.status || 'AVAILABLE';
      if (s === 'AVAILABLE') available++;
      else if (s === 'HELD') held++;
      else if (s === 'BOOKED' || s === 'OCCUPIED') booked++;
      else unavailable++;
    });
    return { available, held, booked, unavailable };
  }, [tables]);

  const activeSlot = useMemo(() => slots.find((s) => s.id === selectedSlotId) || null, [slots, selectedSlotId]);

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setIsMobileDrawerOpen(true);
  };

  const handleAddToCart = (item: MenuItem, selectedOptions?: Record<string, string>) => {
    const optHash = selectedOptions ? JSON.stringify(selectedOptions) : '';
    const cartItemId = `${item.id}-${optHash}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartItemId);
      if (existing) return prev.map((c) => (c.id === cartItemId ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { id: cartItemId, menuItemId: item.id, name: item.name, nameBn: item.nameBn, priceBdt: item.priceBdt, quantity: 1, selectedOptions }];
    });
    showToast(lang === 'en' ? `${item.name} added to order` : `${item.nameBn || item.name} অর্ডারে যোগ হয়েছে`);
  };

  const handleUpdateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === cartItemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => setCart((prev) => prev.filter((c) => c.id !== cartItemId));
  const handleClearCart = () => { setCart([]); setIsCartModalOpen(false); };

  const totalCartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const totalCartAmount = cart.reduce((s, c) => s + c.priceBdt * c.quantity, 0);

  const t = {
    heroTag: lang === 'en' ? 'Artisanal Coffee & Fine Dining in Dhaka' : 'ঢাকার প্রিমিয়াম কফি ও ডাইনিং',
    heroTitle1: lang === 'en' ? 'Where every cup' : 'প্রতিটি কাপে',
    heroTitle2: lang === 'en' ? 'tells a story.' : 'একটি গল্প।',
    heroDesc: lang === 'en'
      ? 'Reserve your perfect spot, explore our curated menu, and pre-order before you arrive. A seamless cafe experience, crafted for you.'
      : 'আপনার পছন্দের টেবিল বুক করুন, আমাদের মেনু দেখুন, এবং আগেই অর্ডার করুন। আপনার জন্য একটি নির্বিঘ্ন ক্যাফে অভিজ্ঞতা।',
    ctaReserve: lang === 'en' ? 'Reserve Your Table' : 'টেবিল রিজার্ভ করুন',
    ctaMenu: lang === 'en' ? 'Explore Menu' : 'মেনু দেখুন',
    statTables: lang === 'en' ? 'Premium Tables' : 'প্রিমিয়াম টেবিল',
    statMenu: lang === 'en' ? 'Curated Items' : 'মেনু আইটেম',
    statSlots: lang === 'en' ? 'Daily Slots' : 'ডেইলি স্লট',
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((p) => (p === 'en' ? 'bn' : 'en'))}
        cartCount={totalCartCount}
        cartTotal={totalCartAmount}
        onOpenCart={() => setIsCartModalOpen(true)}
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 sm:right-6 z-[60] flex items-center gap-2.5 rounded-2xl bg-primary-dark px-4 py-3 text-sm font-medium text-white shadow-2xl animate-fade-up">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon className="h-3 w-3" />
          </span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-[72px]">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop"
            alt="Artisanal coffee"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1410]/92 via-[#1a1410]/75 to-[#1a1410]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/60 via-transparent to-[#1a1410]/20" />
        </div>

        <div className="relative mx-auto max-w-[1440px] w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-accent-soft mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t.heroTag}
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight text-white">
                {t.heroTitle1}
                <span className="block text-accent-soft italic mt-1">{t.heroTitle2}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/70">
                {t.heroDesc}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a href="#reserve" className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-primary-dark hover:bg-accent-soft transition-all shadow-[0_4px_24px_rgba(176,122,74,0.35)]">
                  {t.ctaReserve}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a href="#menu" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 backdrop-blur-sm px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all">
                  {t.ctaMenu}
                </a>
              </div>

              <div className="mt-14 flex flex-wrap gap-8 sm:gap-12 pt-8 border-t border-white/10">
                {[
                  { val: '15+', label: t.statTables },
                  { val: '25+', label: t.statMenu },
                  { val: '9', label: t.statSlots },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-3xl font-semibold text-white">{s.val}</div>
                    <div className="mt-1 text-xs font-medium tracking-wide text-white/50 uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero floating card */}
            <div className="lg:col-span-5 hidden lg:block animate-fade-up delay-200">
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-accent/20 to-transparent blur-2xl" />
                <div className="relative rounded-3xl border border-white/10 bg-white/[0.07] backdrop-blur-xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.15em] text-accent-soft uppercase">{lang === 'en' ? 'Live Availability' : 'লাইভ উপলব্ধতা'}</p>
                      <p className="mt-1 font-display text-2xl text-white">{lang === 'en' ? 'Find your spot' : 'আপনার জায়গা খুঁজুন'}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-soft">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: <CalendarIcon className="h-4 w-4" />, label: lang === 'en' ? 'Today' : 'আজ', val: upcomingDates[0].label },
                      { icon: <ClockIcon className="h-4 w-4" />, label: lang === 'en' ? 'Time' : 'সময়', val: activeSlot?.label || '—' },
                      { icon: <UsersIcon className="h-4 w-4" />, label: lang === 'en' ? 'Available' : 'উপলব্ধ', val: `${counts.available} tables` },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between rounded-2xl bg-white/[0.05] border border-white/[0.06] px-4 py-3">
                        <div className="flex items-center gap-3 text-white/60">
                          <span className="text-accent-soft">{r.icon}</span>
                          <span className="text-sm">{r.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <a href="#reserve" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-primary-dark py-3.5 text-sm font-semibold hover:bg-accent-soft transition-colors">
                    {lang === 'en' ? 'Check Availability' : 'উপলব্ধতা দেখুন'}
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  <p className="mt-4 text-center text-[11px] text-white/40">
                    {lang === 'en' ? 'No prepayment required • Free cancellation' : 'অগ্রিম পেমেন্ট প্রয়োজন নেই • ফ্রি বাতিল'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 text-white/40">
          <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <div className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* EXPERIENCE STRIP */}
      <section id="experience" className="relative py-20 lg:py-24 bg-surface">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase mb-3">{lang === 'en' ? 'The Experience' : 'অভিজ্ঞতা'}</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary-dark leading-tight">
              {lang === 'en' ? 'More than just coffee' : 'শুধু কফি নয়'}
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              {lang === 'en'
                ? 'From the moment you reserve to your last sip, every detail is designed around your comfort.'
                : 'রিজার্ভেশন থেকে শেষ চুমুক পর্যন্ত, প্রতিটি বিবরণ আপনার আরামের জন্য ডিজাইন করা।'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <MapPinIcon className="h-5 w-5" />, en: 'Live Floor Plan', bn: 'লাইভ ফ্লোর প্ল্যান', descEn: 'Pick your exact table from our interactive map in real-time.', descBn: 'রিয়েল-টাইমে ইন্টারেক্টিভ ম্যাপ থেকে আপনার টেবিল বেছে নিন।' },
              { icon: <CoffeeIcon className="h-5 w-5" />, en: 'Pre-Order Menu', bn: 'প্রি-অর্ডার মেনু', descEn: 'Order ahead so your favorites are ready when you arrive.', descBn: 'আগে অর্ডার করুন, পৌঁছালে আপনার পছন্দের খাবার প্রস্তুত থাকবে।' },
              { icon: <ClockIcon className="h-5 w-5" />, en: 'Instant Confirmation', bn: 'তাৎক্ষণিক নিশ্চিতকরণ', descEn: 'Book in seconds with instant confirmation and QR check-in.', descBn: 'সেকেন্ডেই বুক করুন, QR চেক-ইন সহ তাৎক্ষণিক নিশ্চিতকরণ।' },
              { icon: <WifiIcon className="h-5 w-5" />, en: 'Premium Ambiance', bn: 'প্রিমিয়াম পরিবেশ', descEn: 'Free WiFi, cozy zones, and the perfect atmosphere to unwind.', descBn: 'ফ্রি ওয়াইফাই, আরামদায়ক জোন, এবং unwind করার পারফেক্ট পরিবেশ।' },
            ].map((f, i) => (
              <div key={f.en} className={`group relative rounded-3xl border border-border-light bg-background/50 p-6 hover:bg-surface hover:shadow-[0_8px_30px_-12px_rgba(36,24,16,0.12)] transition-all duration-300 animate-fade-up delay-${(i + 1) * 100}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark/[0.04] text-primary group-hover:bg-primary-dark group-hover:text-accent-soft transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="mt-5 text-base font-semibold text-primary-dark">{lang === 'en' ? f.en : f.bn}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{lang === 'en' ? f.descEn : f.descBn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESERVATION WORKSPACE */}
      <section id="reserve" className="relative py-16 lg:py-24 bg-background">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase mb-3">{lang === 'en' ? 'Reserve & Pre-Order' : 'রিজার্ভ ও প্রি-অর্ডার'}</p>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary-dark leading-tight">
                {lang === 'en' ? 'Pick your perfect table' : 'আপনার পারফেক্ট টেবিল বেছে নিন'}
              </h2>
              <p className="mt-4 text-muted leading-relaxed">
                {lang === 'en'
                  ? 'Select a date and time, choose an available table from the live floor plan, and browse our menu to pre-order.'
                  : 'তারিখ ও সময় নির্বাচন করুন, লাইভ ফ্লোর প্ল্যান থেকে টেবিল বেছে নিন, এবং প্রি-অর্ডার করুন।'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 font-medium ring-1 ring-emerald-600/10">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {counts.available} {lang === 'en' ? 'tables available' : 'টি টেবিল খালি'}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <SlotSelector
              dates={upcomingDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              slots={slots}
              selectedSlotId={selectedSlotId}
              onSelectSlot={setSelectedSlotId}
              selectedSeats={selectedSeats}
              onSelectSeats={setSelectedSeats}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              zones={zones}
              counts={counts}
              lang={lang}
            />

            <div id="menu" className="grid grid-cols-1 gap-5 xl:grid-cols-12 items-start">
              <div className="xl:col-span-7">
                {isLoading ? (
                  <div className="flex h-[580px] items-center justify-center rounded-3xl border border-border-light bg-surface">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-accent/30 border-t-accent" />
                      <p className="text-sm font-medium text-muted">{lang === 'en' ? 'Loading floor plan...' : 'ফ্লোর প্ল্যান লোড হচ্ছে...'}</p>
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
              <div className="xl:col-span-5">
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
          </div>
        </div>
      </section>

      {/* FEATURED VISUALS */}
      <section className="py-16 lg:py-20 bg-surface border-y border-border-light">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
            {[
              { src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1200&auto=format&fit=crop', title: lang === 'en' ? 'Signature Brews' : 'সিগনেচার ব্রু', sub: lang === 'en' ? 'Crafted by expert baristas' : 'দক্ষ বারিস্তা দ্বারা তৈরি' },
              { src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop', title: lang === 'en' ? 'Cozy Ambiance' : 'আরামদায়ক পরিবেশ', sub: lang === 'en' ? 'Spaces designed for comfort' : 'আরামের জন্য ডিজাইন করা স্পেস' },
              { src: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1200&auto=format&fit=crop', title: lang === 'en' ? 'Artisan Pastries' : 'কারিগর পেস্ট্রি', sub: lang === 'en' ? 'Freshly baked every day' : 'প্রতিদিন তাজা বেকড' },
            ].map((c, i) => (
              <div key={i} className="group relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[3/4]">
                <Image src={c.src} alt={c.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/80 via-[#1a1410]/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-xs font-medium tracking-[0.15em] text-accent-soft uppercase">{c.sub}</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">{c.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL / TRUST */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center gap-1 text-accent mb-5">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="h-5 w-5" />)}
            </div>
            <blockquote className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-primary-dark leading-snug">
              {lang === 'en'
                ? '"The perfect spot to unwind. Booking a table was effortless, and the coffee arrived just as we sat down."'
                : '"বিশ্রামের জন্য পারফেক্ট জায়গা। টেবিল বুক করা খুব সহজ ছিল, এবং আমরা বসার সাথে সাথেই কফি চলে এসেছে।"'}
            </blockquote>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-dark/10 flex items-center justify-center text-primary-dark font-semibold text-sm">AR</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-primary-dark">Ayesha Rahman</p>
                <p className="text-xs text-muted">{lang === 'en' ? 'Regular Guest, Dhaka' : 'নিয়মিত অতিথি, ঢাকা'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary-dark text-white/80">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-accent-soft">
                  <CoffeeIcon className="h-5 w-5" />
                </div>
                <span className="font-display text-xl font-semibold text-white">Brew <span className="text-accent-soft">&</span> Book</span>
              </div>
              <p className="text-sm leading-relaxed text-white/55 max-w-xs">
                {lang === 'en'
                  ? 'A premium coffee experience in the heart of Dhaka. Reserve, pre-order, and enjoy.'
                  : 'ঢাকার হৃদয়ে একটি প্রিমিয়াম কফি অভিজ্ঞতা। রিজার্ভ করুন, প্রি-অর্ডার করুন, এবং উপভোগ করুন।'}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase mb-4">{lang === 'en' ? 'Visit' : 'ভিজিট'}</h4>
              <ul className="space-y-2.5 text-sm text-white/65">
                <li>Gulshan Avenue, Dhaka 1212</li>
                <li>{lang === 'en' ? 'Open Daily: 8:00 AM – 10:00 PM' : 'প্রতিদিন খোলা: সকাল ৮টা – রাত ১০টা'}</li>
                <li>+880 1XXX-XXXXXX</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase mb-4">{lang === 'en' ? 'Explore' : 'এক্সপ্লোর'}</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '#reserve', en: 'Reserve a Table', bn: 'টেবিল রিজার্ভ' },
                  { href: '#menu', en: 'Our Menu', bn: 'আমাদের মেনু' },
                  { href: '#experience', en: 'Experience', bn: 'অভিজ্ঞতা' },
                ].map((l) => (
                  <li key={l.href}><a href={l.href} className="text-white/65 hover:text-accent-soft transition-colors">{lang === 'en' ? l.en : l.bn}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase mb-4">{lang === 'en' ? 'Payment Partners' : 'পেমেন্ট পার্টনার'}</h4>
              <div className="flex flex-wrap gap-2">
                {['bKash', 'Nagad', 'Visa', 'Mastercard'].map((p) => (
                  <span key={p} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70">{p}</span>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/35">Powered by SSLCommerz</p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/35">
            <p>© 2026 Brew & Book. {lang === 'en' ? 'All rights reserved.' : 'সর্বস্বত্ব সংরক্ষিত।'}</p>
            <div className="flex items-center gap-4">
              <span>{lang === 'en' ? 'Crafted in Dhaka' : 'ঢাকায় তৈরি'}</span>
              <span className="text-white/15">|</span>
              <Link href="/admin" className="hover:text-white/60 transition-colors">{lang === 'en' ? 'Staff Portal' : 'স্টাফ পোর্টাল'}</Link>
            </div>
          </div>
        </div>
      </footer>

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
        onToggleOpen={() => setIsCartModalOpen((p) => !p)}
      />
    </div>
  );
}
