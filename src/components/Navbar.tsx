'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CoffeeIcon, GlobeIcon, ShoppingBagIcon, MenuIcon, XIcon } from './Icons';

interface NavbarProps {
  lang: 'en' | 'bn';
  onToggleLang: () => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
}

export default function Navbar({
  lang,
  onToggleLang,
  cartCount,
  cartTotal,
  onOpenCart,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#experience', en: 'Experience', bn: 'অভিজ্ঞতা' },
    { href: '#reserve', en: 'Reserve', bn: 'রিজার্ভ' },
    { href: '#menu', en: 'Menu', bn: 'মেনু' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/90 backdrop-blur-xl border-b border-border/60 shadow-[0_1px_20px_rgba(36,24,16,0.04)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8 h-[72px]">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-dark text-accent-soft shadow-sm transition-transform duration-300 group-hover:scale-105">
            <CoffeeIcon className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
          </div>
          <div className="leading-none">
            <span className="font-display text-xl font-semibold tracking-tight text-primary-dark">
              Brew <span className="text-accent">&</span> Book
            </span>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-muted-light uppercase">
              {lang === 'en' ? 'Dhaka' : 'ঢাকা'}
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-primary-dark transition-colors rounded-lg hover:bg-primary-dark/[0.03]"
            >
              {lang === 'en' ? l.en : l.bn}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLang}
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/60 px-3 py-1.5 text-xs font-semibold text-muted hover:text-primary-dark hover:border-accent/40 transition-all cursor-pointer"
            title="Switch Language"
          >
            <GlobeIcon className="h-3.5 w-3.5" />
            <span className={lang === 'en' ? 'text-primary-dark' : ''}>EN</span>
            <span className="text-border">/</span>
            <span className={lang === 'bn' ? 'text-primary-dark' : ''}>বাং</span>
          </button>

          {cartCount > 0 && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 rounded-full bg-primary-dark px-4 py-2 text-xs font-semibold text-white hover:bg-primary transition-all shadow-sm cursor-pointer"
            >
              <ShoppingBagIcon className="h-4 w-4 text-accent-soft" />
              <span className="hidden sm:inline">৳{cartTotal}</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-primary-dark">
                {cartCount}
              </span>
            </button>
          )}

          <a
            href="#reserve"
            className="hidden sm:inline-flex btn-primary rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide cursor-pointer"
          >
            {lang === 'en' ? 'Reserve a Table' : 'টেবিল বুক করুন'}
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-xl p-2 text-primary-dark hover:bg-surface-alt/60 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-surface/98 backdrop-blur-xl animate-fade-in">
          <nav className="mx-auto max-w-[1440px] px-4 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-surface-alt/50 rounded-xl transition-colors"
              >
                {lang === 'en' ? l.en : l.bn}
              </a>
            ))}
            <div className="flex items-center gap-2 px-3 pt-3 mt-2 border-t border-border/60">
              <button
                onClick={onToggleLang}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted cursor-pointer"
              >
                <GlobeIcon className="h-3.5 w-3.5" />
                {lang === 'en' ? 'EN / বাং' : 'বাং / EN'}
              </button>
              <a
                href="#reserve"
                onClick={() => setMobileOpen(false)}
                className="flex-1 btn-primary rounded-full px-4 py-2.5 text-xs font-semibold text-center"
              >
                {lang === 'en' ? 'Reserve a Table' : 'টেবিল বুক করুন'}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
