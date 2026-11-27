'use client';
import React from 'react';
import Link from 'next/link';
import { CoffeeIcon, GlobeIcon, ShoppingBagIcon } from './Icons';

interface NavbarProps { lang: 'en' | 'bn'; onToggleLang: () => void; cartCount: number; cartTotal: number; onOpenCart: () => void; }

export default function Navbar({ lang, onToggleLang, cartCount, cartTotal, onOpenCart }: NavbarProps) {
  const en = lang === 'en';
  const links = [
    { href: '/', t: en ? 'Home' : 'হোম' },
    { href: '/#menu', t: en ? 'Menu' : 'মেনু' },
    { href: '/book', t: en ? 'Book a Table' : 'টেবিল বুক' },
    { href: '/#how', t: en ? 'How it works' : 'কীভাবে কাজ করে' },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#140d09]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3.5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[#1e1610]"><CoffeeIcon className="h-5 w-5" /></span>
          <span className="font-display text-xl font-semibold tracking-tight text-[#f6ebdd]">Brew <span className="text-accent">&amp;</span> Book</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-[#d9c7b3] transition-colors hover:text-white">{l.t}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={onToggleLang} className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-[#e8d9c6] transition hover:border-accent hover:text-white cursor-pointer">
            <GlobeIcon className="h-3.5 w-3.5" />{en ? 'বাংলা' : 'EN'}
          </button>
          <button onClick={onOpenCart} className="relative flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-[#1e1610] transition hover:brightness-110 cursor-pointer">
            <ShoppingBagIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{cartCount > 0 ? `${en ? 'BDT' : '?'} ${cartTotal}` : en ? 'My Order' : 'অর্ডার'}</span>
            {cartCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1e1610] px-1 text-[10px] text-accent">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
