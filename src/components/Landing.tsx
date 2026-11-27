'use client';
import React, { useState } from 'react';
import { MenuCategory, MenuItem } from '@/types';
import { PHOTOS, photoFor } from '@/lib/photos';

function Photo({ src, alt, className = '', fallback }: { src: string | null | undefined; alt: string; className?: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={className} />;
}

export function CupArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 360" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id="cupBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6ebdd" /><stop offset="1" stopColor="#c9a57e" /></linearGradient>
        <linearGradient id="sleeve" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a4a2c" /><stop offset="1" stopColor="#4b2e1e" /></linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#c68b59" stopOpacity=".35" /><stop offset="1" stopColor="#c68b59" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="160" cy="190" r="150" fill="url(#glow)" />
      {[70, 160, 250].map((x, i) => (
        <path key={x} d={`M${x} 90 C ${x - 14} 70, ${x + 14} 50, ${x} 30`} stroke="#e8d3b8" strokeOpacity={0.5 - i * 0.08} strokeWidth="4" strokeLinecap="round" />
      ))}
      <path d="M72 120 H248 L228 322 Q226 338 210 338 H110 Q94 338 92 322 Z" fill="url(#cupBody)" />
      <path d="M80 190 H240 L234 262 H86 Z" fill="url(#sleeve)" />
      <text x="160" y="224" textAnchor="middle" fill="#f0d9bd" fontSize="15" fontFamily="serif" fontWeight="700" letterSpacing="2.5">BREW &amp; BOOK</text>
      <text x="160" y="240" textAnchor="middle" fill="#e8c9a0" fontSize="7.5" fontFamily="sans-serif" fontWeight="600" letterSpacing="2" opacity="0.85">COFFEE HOUSE</text>
      <rect x="62" y="104" width="196" height="22" rx="11" fill="#fff7ec" />
      <rect x="70" y="96" width="180" height="14" rx="7" fill="#3c2a1e" />
      {[[40, 300, 18], [280, 280, 14], [262, 70, 12], [34, 140, 10]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 1.4} fill="#2c1b12" stroke="#7a4a2c" strokeWidth="2" transform={`rotate(${i * 35} ${x} ${y})`} />
      ))}
    </svg>
  );
}

export function Hero({
  lang,
  tableCount,
  itemCount,
  availableCount,
  previewTable,
  selectedDate,
  selectedSlotLabel,
}: {
  lang: 'en' | 'bn';
  tableCount: number;
  itemCount: number;
  availableCount: number;
  previewTable: { code: string; seats: number; zone?: string; status?: string } | null;
  selectedDate: string;
  selectedSlotLabel: string;
}) {
  const en = lang === 'en';
  const table = previewTable || { code: 'T05', seats: 4, zone: 'Window side', status: 'AVAILABLE' };
  const status = table.status || 'AVAILABLE';
  const statusLabel = status === 'AVAILABLE' ? (en ? 'Available' : '????') : status === 'HELD' ? (en ? 'Held' : '?????') : (en ? 'Booked' : '????');
  const statusClass = status === 'AVAILABLE' ? 'bg-emerald-400/15 text-emerald-400' : status === 'HELD' ? 'bg-amber-400/15 text-amber-300' : 'bg-rose-400/15 text-rose-300';
  const dotClass = status === 'AVAILABLE' ? 'bg-emerald-400' : status === 'HELD' ? 'bg-amber-300' : 'bg-rose-300';
  const dateLabel = (() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return selectedDate;
    return d.toLocaleDateString(en ? 'en-US' : 'bn-BD', { day: 'numeric', month: 'short' });
  })();
  const token = `BB-${(selectedDate || '').replace(/-/g, '').slice(0, 8) || 'LIVE'}-${table.code}`;

  return (
    <section id="home" className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,#3a2415_0%,#140d09_60%)]">
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-20 pt-14 lg:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{en ? 'Live table availability' : '???? ????? ??????'}
          </span>
          <h1 className="font-display mt-5 text-5xl font-semibold leading-[1.05] text-[#f6ebdd] sm:text-6xl lg:text-7xl">
            {en ? <>Reserve Your Table.<br /><span className="text-accent">Savor Every Sip.</span></> : <>????? ????? ??????? ?????<br /><span className="text-accent">??????? ?????? ????? ?????</span></>}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[#bba992]">
            {en ? 'See the cafe floor in real time, pick the exact table you like, browse the menu and book with OTP confirmation before you arrive.'
                : '???? ???? ??? ?????? ???? ??????? ????? ???? ?????, ??????? ????? ???? ???, ???? ????? ??? OTP ??????? ??? ??? ?????'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#book" className="rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-[#1e1610] shadow-lg shadow-accent/20 transition hover:brightness-110">{en ? 'Reserve a Table' : '????? ??????? ????'}</a>
            <a href="#menu" className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-[#f6ebdd] transition hover:border-accent hover:text-accent">{en ? 'Explore Menu' : '???? ?????'}</a>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {[[availableCount, en ? 'Available now' : '??? ????'], [tableCount || 15, en ? 'Tables' : '?????'], [itemCount || 25, en ? 'Menu items' : '?????']].map(([n, l]) => (
              <div key={String(l)}><dt className="font-display text-3xl font-semibold text-[#f6ebdd]">{n}</dt><dd className="mt-1 text-xs text-[#9c8975]">{l}</dd></div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:max-w-[560px] pt-8 pb-10 sm:pt-10 sm:pb-12">
          <div className="relative mx-auto w-[74%] sm:w-[68%]">
            <CupArt className="h-auto w-full drop-shadow-[0_30px_60px_rgba(198,139,89,0.25)]" />
          </div>

          <div className="absolute left-0 top-0 sm:-left-2 sm:top-4 rounded-2xl border border-white/10 bg-[#241710]/90 px-4 py-3 backdrop-blur-xl shadow-xl shadow-black/20 w-[168px] sm:w-[190px] z-10">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#bba992]">{en ? 'Live table' : '???? ?????'}</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                {statusLabel}
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-[#f6ebdd]">{table.code}</p>
            <p className="text-xs text-[#bba992]">{table.seats} {en ? 'seats' : '???'}{table.zone ? ` ? ${table.zone}` : ''}</p>
            <p className="mt-2 text-[11px] text-[#9c8975]">{dateLabel} ? {selectedSlotLabel || (en ? 'Select slot' : '???? ????????')}</p>
          </div>

          <div className="absolute right-0 bottom-0 sm:-right-2 sm:bottom-2 rounded-2xl border border-accent/20 bg-[#241710]/92 px-4 py-3.5 backdrop-blur-xl shadow-xl shadow-black/20 w-[190px] sm:w-[214px] z-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent/80">BREW &amp; BOOK</p>
            <p className="mt-2 text-[11px] text-[#bba992]">{en ? 'Booking token preview' : '????? ????? ???????'}</p>
            <p className="mt-0.5 font-mono text-sm sm:text-base font-bold tracking-wide text-[#f6ebdd] break-all">{token}</p>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-[#bba992]">
              <span>{dateLabel}</span>
              <span className={`font-semibold ${status === 'AVAILABLE' ? 'text-emerald-400' : status === 'HELD' ? 'text-amber-300' : 'text-rose-300'}`}>{statusLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MenuShowcase({ lang, categories, items, onAdd }: { lang: 'en' | 'bn'; categories: MenuCategory[]; items: MenuItem[]; onAdd: (i: MenuItem) => void }) {
  const en = lang === 'en';
  const [cat, setCat] = useState<number | 'all'>('all');
  const list = items.filter((i) => i.available && (cat === 'all' || i.categoryId === cat)).slice(0, 8);
  return (
    <section id="menu" className="bg-[#1a110c] py-20">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{en ? 'Our menu' : 'আমাদের মেনু'}</p>
        <h2 className="font-display mt-3 text-4xl font-semibold text-[#f6ebdd] sm:text-5xl">{en ? 'Crafted with intent' : 'যত্নে তৈরি প্রতিটি কাপ'}</h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {[{ id: 'all' as const, name: en ? 'All' : 'সব', nameBn: 'সব' }, ...categories].map((c) => (
            <button key={c.id} onClick={() => setCat(c.id as number | 'all')} className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer ${cat === c.id ? 'bg-accent text-[#1e1610]' : 'border border-white/15 text-[#d9c7b3] hover:border-accent'}`}>
              {en ? c.name : (c.nameBn || c.name)}
            </button>
          ))}
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((it) => (
            <article key={it.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#241710] transition hover:-translate-y-1 hover:border-accent/50">
              <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#4a2d1b,#241710)]">
                <Photo src={it.imageUrl || photoFor(categories.find((c) => c.id === it.categoryId)?.name, it.id)} alt={it.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" fallback={<CupArt className="h-32 w-32 opacity-90 transition group-hover:scale-105" />} />
                {it.tags?.[0] && <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">{it.tags[0]}</span>}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-[#f6ebdd]">{en ? it.name : (it.nameBn || it.name)}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-accent">{en ? "BDT" : "?"} {it.priceBdt}</span>
                  <button onClick={() => onAdd(it)} className="rounded-full border border-accent/60 px-3.5 py-1.5 text-xs font-bold text-accent transition hover:bg-accent hover:text-[#1e1610] cursor-pointer">{en ? '+ Add' : '+ যোগ'}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ lang }: { lang: 'en' | 'bn' }) {
  const en = lang === 'en';
  const steps = en
    ? [['01', 'Pick a time & table', 'Choose a date and slot, then tap any green table on the live floor plan.'], ['02', 'Pre-order & pay', 'Add drinks and food, pay online with bKash, Nagad, card, or at the shop.'], ['03', 'Get your token', 'Receive a token with table no., serial no., your name and QR for easy check-in.']]
    : [['০১', 'সময় ও টেবিল বাছুন', 'তারিখ ও স্লট বেছে লাইভ ফ্লোর প্ল্যানে সবুজ টেবিলে ট্যাপ করুন।'], ['০২', 'অর্ডার ও পেমেন্ট', 'খাবার যোগ করুন, বিকাশ, নগদ, কার্ড বা শপে পেমেন্ট করুন।'], ['০৩', 'টোকেন পান', 'টেবিল নম্বর, সিরিয়াল, নাম ও QR সহ টোকেন পাবেন।']];
  return (
    <section id="how" className="bg-[#140d09] py-20">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <h2 className="font-display text-4xl font-semibold text-[#f6ebdd] sm:text-5xl">{en ? <>Three simple steps to <span className="text-accent">your seat</span></> : <>তিন ধাপে <span className="text-accent">আপনার আসন</span></>}</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <span className="font-display text-4xl font-semibold text-accent/80">{n}</span>
              <h3 className="mt-4 text-lg font-semibold text-[#f6ebdd]">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#a8957f]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ lang }: { lang: 'en' | 'bn' }) {
  const en = lang === 'en';
  return (
    <footer className="border-t border-white/10 bg-[#0f0906] py-10 text-sm text-[#9c8975]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-5 sm:flex-row lg:px-8">
        <div><p className="font-display text-lg font-semibold text-[#f6ebdd]">Brew <span className="text-accent">&amp;</span> Book</p><p className="mt-1 text-xs">{en ? 'Table booking & pre-ordering for coffee lovers in Bangladesh.' : 'বাংলাদেশের কফিপ্রেমীদের জন্য টেবিল বুকিং ও প্রি-অর্ডার।'}</p></div>
        <div className="flex items-center gap-5 text-xs"><span>bKash · Nagad · Cards</span><a href="/admin" className="font-semibold text-[#d9c7b3] hover:text-accent">{en ? 'Staff Console' : 'স্টাফ কনসোল'}</a></div>
      </div>
      <p className="mt-6 text-center text-[11px] text-[#6f5f50]">© 2026 Brew &amp; Book · Photos: Unsplash &amp; Pexels contributors</p>
    </footer>
  );
}

export function OurSpace({ lang }: { lang: 'en' | 'bn' }) {
  const en = lang === 'en';
  return (
    <section className="bg-[#1a110c] py-20">
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{en ? 'Our space' : 'আমাদের জায়গা'}</p>
          <h2 className="font-display mt-3 text-4xl font-semibold text-[#f6ebdd] sm:text-5xl">{en ? 'A place to slow down' : 'একটু থেমে বসার জায়গা'}</h2>
          <p className="mt-5 text-sm leading-relaxed text-[#a8957f]">{en ? 'Window lounge, quiet study corner, family booths and a garden terrace. See every seat before you arrive and book the one you love.' : 'উইন্ডো লাউঞ্জ, শান্ত স্টাডি কর্নার, ফ্যামিলি বুথ ও গার্ডেন টেরেস। আসার আগেই পছন্দের আসনটি বুক করুন।'}</p>
          <a href="#book" className="mt-7 inline-block rounded-full bg-accent px-6 py-3 text-sm font-bold text-[#1e1610] transition hover:brightness-110">{en ? 'See the floor plan' : 'ফ্লোর প্ল্যান দেখুন'}</a>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-3">
          {[PHOTOS.interior1, PHOTOS.interior2].map((src, i) => (
            <div key={i} className={`overflow-hidden rounded-2xl border border-white/10 bg-[#241710] ${i === 1 ? 'mt-8' : ''}`}>
              <Photo src={src} alt={en ? 'Cafe interior' : 'ক্যাফের ভেতরের দৃশ্য'} className="h-72 w-full object-cover transition duration-500 hover:scale-105 sm:h-96" fallback={<div className="flex h-72 items-center justify-center sm:h-96"><CupArt className="h-32 w-32 opacity-70" /></div>} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
