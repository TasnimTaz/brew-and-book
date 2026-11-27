'use client';

import React, { useRef } from 'react';
import { TimeSlot } from '@/types';

interface SlotSelectorProps {
  dates: { dateStr: string; label: string; dayName: string }[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
  slots: TimeSlot[];
  selectedSlotId: number | null;
  onSelectSlot: (id: number) => void;
  selectedSeats: number | 'all';
  onSelectSeats: (seats: number | 'all') => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  zones: string[];
  counts: { available: number; held: number; booked: number; unavailable: number };
  lang: 'en' | 'bn';
}

const fmt = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

function Step({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2c1b12] text-[11px] font-bold text-[#e9c49a]">{n}</span>
      <h3 className="text-sm font-bold text-primary-dark">{title}</h3>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export default function SlotSelector(p: SlotSelectorProps) {
  const en = p.lang === 'en';
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  const activeSlot = p.slots.find((s) => s.id === p.selectedSlotId);
  const selDate = new Date(p.selectedDate + 'T00:00:00');
  const summary = `${selDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}${activeSlot ? ` · ${fmt(activeSlot.start)} – ${fmt(activeSlot.end)}` : ''}`;

  const groups = [
    { key: 'morning', label: en ? 'Morning' : 'সকাল', test: (h: number) => h < 12 },
    { key: 'afternoon', label: en ? 'Afternoon' : 'দুপুর', test: (h: number) => h >= 12 && h < 17 },
    { key: 'evening', label: en ? 'Evening' : 'সন্ধ্যা', test: (h: number) => h >= 17 },
  ]
    .map((g) => ({ ...g, items: p.slots.filter((s) => g.test(Number(s.start.split(':')[0]))) }))
    .filter((g) => g.items.length > 0);

  const seatOpts: (number | 'all')[] = ['all', 2, 4, 6];
  const zoneOpts = ['all', ...p.zones];

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
      active ? 'border-[#2c1b12] bg-[#2c1b12] text-[#f6ebdd]' : 'border-[#e8dccb] bg-white text-muted hover:border-accent hover:text-primary-dark'
    }`;

  return (
    <section className="overflow-hidden rounded-3xl border border-[#e8dccb] bg-white shadow-[0_10px_40px_-20px_rgba(60,42,30,0.35)]">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2c1b12] px-5 py-3.5 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a57e]">{en ? 'Your visit' : 'আপনার ভিজিট'}</p>
          <p className="font-display text-lg font-semibold text-[#f6ebdd]">{summary}</p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          {p.counts.available} {en ? 'tables open' : 'টি টেবিল খালি'}
        </span>
      </div>

      <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-12">
        {/* 1. Date */}
        <div className="lg:col-span-5">
          <Step n={1} title={en ? 'Pick a date' : 'তারিখ বাছুন'} />
          <div className="relative">
            <button onClick={() => scroll(-1)} aria-label="Previous dates" className="absolute -left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8dccb] bg-white text-primary-dark shadow-sm hover:border-accent sm:flex cursor-pointer">‹</button>
            <div ref={scroller} className="scrollbar-none flex gap-2.5 overflow-x-auto scroll-smooth py-1 sm:px-3">
              {p.dates.map((d) => {
                const dt = new Date(d.dateStr + 'T00:00:00');
                const active = d.dateStr === p.selectedDate;
                return (
                  <button key={d.dateStr} onClick={() => p.onSelectDate(d.dateStr)}
                    className={`flex w-[72px] shrink-0 flex-col items-center rounded-2xl border py-3 transition cursor-pointer ${active ? 'border-[#2c1b12] bg-[#2c1b12] text-[#f6ebdd] shadow-lg shadow-[#2c1b12]/25' : 'border-[#e8dccb] bg-[#fbf8f3] text-primary-dark hover:border-accent'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-[#e9c49a]' : 'text-muted'}`}>
                      {d.dayName === 'Today' ? (en ? 'Today' : 'আজ') : dt.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="font-display my-0.5 text-2xl font-semibold leading-none">{dt.getDate()}</span>
                    <span className={`text-[10px] font-medium ${active ? 'text-[#c9a57e]' : 'text-muted'}`}>{dt.toLocaleDateString('en-US', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => scroll(1)} aria-label="Next dates" className="absolute -right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8dccb] bg-white text-primary-dark shadow-sm hover:border-accent sm:flex cursor-pointer">›</button>
          </div>
        </div>

        {/* 2. Time */}
        <div className="lg:col-span-7">
          <Step n={2} title={en ? 'Choose a time' : 'সময় বাছুন'} hint={en ? '90-minute seating' : '৯০ মিনিটের সিটিং'} />
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="w-20 shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted">{g.label}</span>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((s) => {
                    const active = s.id === p.selectedSlotId;
                    return (
                      <button key={s.id} onClick={() => p.onSelectSlot(s.id)}
                        className={`rounded-xl border px-3.5 py-2 text-left transition cursor-pointer ${active ? 'border-accent bg-accent text-[#1e1610] shadow-md shadow-accent/30' : 'border-[#e8dccb] bg-[#fbf8f3] text-primary-dark hover:border-accent'}`}>
                        <span className="block text-sm font-bold leading-tight">{fmt(s.start)}</span>
                        <span className={`block text-[10px] ${active ? 'text-[#4b2e1e]' : 'text-muted'}`}>{en ? 'until' : 'পর্যন্ত'} {fmt(s.end)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Filters + legend */}
      <div className="border-t border-[#efe5d6] bg-[#fbf8f3] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-muted">{en ? 'Guests' : 'অতিথি'}</span>
            {seatOpts.map((s) => (
              <button key={String(s)} onClick={() => p.onSelectSeats(s)} className={pill(p.selectedSeats === s)}>
                {s === 'all' ? (en ? 'Any' : 'যেকোনো') : s === 6 ? '6+' : s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-muted">{en ? 'Area' : 'এলাকা'}</span>
            {zoneOpts.map((z) => (
              <button key={z} onClick={() => p.onSelectZone(z)} className={pill(p.selectedZone === z)}>
                {z === 'all' ? (en ? 'All areas' : 'সব এলাকা') : z}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-muted">
            {[['bg-emerald-500', en ? 'Available' : 'খালি', p.counts.available], ['bg-amber-500', en ? 'Held' : 'হোল্ড', p.counts.held], ['bg-rose-500', en ? 'Booked' : 'বুকড', p.counts.booked]].map(([c, l, n]) => (
              <span key={String(l)} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${c}`} />{l} <b className="text-primary-dark">{n}</b></span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
