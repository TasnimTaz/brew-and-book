'use client';

import React from 'react';
import { TimeSlot } from '@/types';
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from './Icons';

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

export default function SlotSelector({
  dates,
  selectedDate,
  onSelectDate,
  slots,
  selectedSlotId,
  onSelectSlot,
  selectedSeats,
  onSelectSeats,
  selectedZone,
  onSelectZone,
  zones,
  counts,
  lang,
}: SlotSelectorProps) {
  return (
    <section className="rounded-3xl border border-border-light bg-surface p-5 sm:p-6 shadow-[0_1px_3px_rgba(36,24,16,0.02),0_8px_24px_-12px_rgba(36,24,16,0.08)] space-y-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Date */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-light mb-3">
            <CalendarIcon className="h-3.5 w-3.5 text-accent" />
            <span>{lang === 'en' ? 'Select Date' : 'তারিখ নির্বাচন'}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {dates.map((d) => {
              const isSelected = d.dateStr === selectedDate;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => onSelectDate(d.dateStr)}
                  className={`flex shrink-0 flex-col items-center rounded-2xl px-4 py-3 min-w-[72px] transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-primary-dark text-white shadow-[0_4px_16px_rgba(36,24,16,0.25)] scale-[1.02]'
                      : 'bg-background border border-border-light text-foreground hover:border-accent/40 hover:bg-surface-alt/40'
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-accent-soft' : 'text-muted-light'}`}>
                    {d.dayName}
                  </span>
                  <span className="text-sm font-bold mt-1 whitespace-nowrap">{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-light">
              <ClockIcon className="h-3.5 w-3.5 text-accent" />
              <span>{lang === 'en' ? 'Time Slot' : 'সময় স্লট'}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-600/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {counts.available} {lang === 'en' ? 'open' : 'খালি'}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {slots.map((s) => {
              const isSelected = s.id === selectedSlotId;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSlot(s.id)}
                  className={`flex shrink-0 flex-col items-center justify-center rounded-2xl px-4 py-2.5 min-w-[88px] transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-primary-dark font-semibold shadow-[0_4px_16px_rgba(176,122,74,0.3)]'
                      : 'bg-background border border-border-light text-foreground hover:border-accent/40 hover:bg-surface-alt/40'
                  }`}
                >
                  <span className="text-sm font-bold whitespace-nowrap">{s.start}</span>
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-primary-dark/70' : 'text-muted-light'}`}>
                    {s.end}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters + Legend */}
      <div className="flex flex-col gap-4 border-t border-border-light pt-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-2xl bg-background border border-border-light p-1">
            <span className="px-2.5 text-muted-light"><UsersIcon className="h-4 w-4" /></span>
            {[{ v: 'all' as const, l: lang === 'en' ? 'Any' : 'সব' }, { v: 2 as const, l: '2' }, { v: 4 as const, l: '4' }, { v: 6 as const, l: '6+' }].map((opt) => (
              <button
                key={String(opt.v)}
                onClick={() => onSelectSeats(opt.v)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedSeats === opt.v ? 'bg-surface text-primary-dark shadow-sm' : 'text-muted hover:text-foreground'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>

          <div className="inline-flex flex-wrap items-center rounded-2xl bg-background border border-border-light p-1">
            <span className="px-2.5 text-muted-light"><MapPinIcon className="h-4 w-4" /></span>
            <button
              onClick={() => onSelectZone('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedZone === 'all' ? 'bg-surface text-primary-dark shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              {lang === 'en' ? 'All Zones' : 'সব জোন'}
            </button>
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => onSelectZone(z)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedZone === z ? 'bg-surface text-primary-dark shadow-sm' : 'text-muted hover:text-foreground'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          {[
            { color: 'bg-emerald-500', ring: 'ring-emerald-500/20', label: lang === 'en' ? 'Available' : 'খালি', count: counts.available },
            { color: 'bg-amber-500', ring: 'ring-amber-500/20', label: lang === 'en' ? 'Held' : 'হোল্ড', count: counts.held },
            { color: 'bg-rose-500', ring: 'ring-rose-500/20', label: lang === 'en' ? 'Booked' : 'বুকড', count: counts.booked },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${l.color} ring-4 ${l.ring}`} />
              <span>{l.label} <span className="font-semibold text-foreground">{l.count}</span></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
