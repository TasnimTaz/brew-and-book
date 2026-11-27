'use client';

import React, { useState } from 'react';
import { Table, MenuCategory, MenuItem, CartItem, TimeSlot } from '@/types';
import {
  CalendarIcon,
  ChevronRightIcon,
  CoffeeIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from './Icons';

interface TableMenuPanelProps {
  tables: Table[];
  selectedTable: Table | null;
  onSelectTable: (table: Table) => void;
  onClearTable: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  selectedSlot: TimeSlot | null;
  selectedDate: string;
  categories: MenuCategory[];
  items: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem, selectedOptions?: Record<string, string>) => void;
  onUpdateCartQty: (cartItemId: string, delta: number) => void;
  lang: 'en' | 'bn';
}

export default function TableMenuPanel({
  tables,
  selectedTable,
  onSelectTable,
  onClearTable,
  isMobileOpen,
  onCloseMobile,
  selectedSlot,
  selectedDate,
  categories,
  items,
  cart,
  onAddToCart,
  onUpdateCartQty,
  lang,
}: TableMenuPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItemForOptions, setActiveItemForOptions] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const availableTables = tables.filter((t) => (t.status || 'AVAILABLE') === 'AVAILABLE');

  const filteredItems = items.filter((item) => {
    if (!item.available) return false;
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.nameBn?.toLowerCase().includes(q) ?? false) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const getItemCartEntries = (itemId: number) => cart.filter((c) => c.menuItemId === itemId);
  const getItemCartCount = (itemId: number) => getItemCartEntries(itemId).reduce((sum, c) => sum + c.quantity, 0);

  const handleItemAction = (item: MenuItem) => {
    if (item.options && Object.keys(item.options).length > 0) {
      const defaults: Record<string, string> = {};
      Object.entries(item.options).forEach(([optKey, optValues]) => {
        if (Array.isArray(optValues) && optValues.length > 0) defaults[optKey] = optValues[0];
      });
      setSelectedOptions(defaults);
      setActiveItemForOptions(item);
    } else {
      onAddToCart(item);
    }
  };

  const handleConfirmOptions = () => {
    if (activeItemForOptions) {
      onAddToCart(activeItemForOptions, selectedOptions);
      setActiveItemForOptions(null);
    }
  };

  const renderPanelContent = (isMobile: boolean) => {
    if (!selectedTable) {
      return (
        <div className="flex h-full flex-col">
          <div className="p-6 border-b border-border-light">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent mb-3">
              <SparklesIcon className="h-3 w-3" />
              {lang === 'en' ? 'Quick Start' : 'দ্রুত শুরু'}
            </div>
            <h3 className="font-display text-2xl font-semibold text-primary-dark">
              {lang === 'en' ? 'Select a table' : 'একটি টেবিল নির্বাচন করুন'}
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              {lang === 'en'
                ? 'Choose a table from the floor plan to browse our menu and pre-order for your visit.'
                : 'মেনু দেখতে এবং প্রি-অর্ডার করতে ফ্লোর প্ল্যান থেকে একটি টেবিল বেছে নিন।'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-light">
              {lang === 'en' ? 'Available Now' : 'এখন উপলব্ধ'}
            </p>
            {availableTables.slice(0, 8).map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTable(t)}
                className="w-full flex items-center justify-between rounded-2xl border border-border-light bg-background/50 p-4 text-left hover:border-accent/40 hover:bg-accent/[0.03] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm ring-1 ring-emerald-600/10 group-hover:bg-primary-dark group-hover:text-accent-soft group-hover:ring-0 transition-all">
                    {t.code}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary-dark">{lang === 'en' ? `Table ${t.code}` : `টেবিল ${t.code}`}</div>
                    <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                      <span className="inline-flex items-center gap-1"><UsersIcon className="h-3 w-3" /> {t.seats}</span>
                      <span className="inline-flex items-center gap-1"><MapPinIcon className="h-3 w-3" /> {t.zone}</span>
                    </div>
                  </div>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-light group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
            {availableTables.length === 0 && (
              <div className="py-12 text-center text-muted text-sm">
                {lang === 'en' ? 'No tables available for this slot.' : 'এই স্লটে কোনো টেবিল খালি নেই।'}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex h-full flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border-light bg-surface">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {selectedTable.photoUrl ? (
                <img src={selectedTable.photoUrl} alt={`Table ${selectedTable.code}`} className="h-14 w-14 rounded-2xl object-cover border border-border-light" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark text-accent-soft font-display font-bold text-lg">
                  {selectedTable.code}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-semibold text-primary-dark">
                    {lang === 'en' ? `Table ${selectedTable.code}` : `টেবিল ${selectedTable.code}`}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    selectedTable.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15'
                    : selectedTable.status === 'HELD' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/15'
                  }`}>
                    {selectedTable.status || 'AVAILABLE'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted mt-1">
                  <span className="inline-flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" /> {selectedTable.seats} {lang === 'en' ? 'seats' : 'সিট'}</span>
                  <span className="inline-flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" /> {selectedTable.zone}</span>
                </div>
              </div>
            </div>
            <button
              onClick={isMobile ? onCloseMobile : onClearTable}
              className="rounded-xl p-2 text-muted-light hover:text-foreground hover:bg-surface-alt/60 transition-colors cursor-pointer"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-background px-3.5 py-2.5 text-xs text-muted border border-border-light">
            <CalendarIcon className="h-3.5 w-3.5 text-accent" />
            <span className="font-medium text-foreground">{selectedDate}</span>
            <span className="text-border">•</span>
            <span>{selectedSlot?.label || 'Selected slot'}</span>
          </div>
        </div>

        {/* Search & categories */}
        <div className="px-5 py-4 border-b border-border-light bg-surface space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-light" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search menu...' : 'মেনু খুঁজুন...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border-light bg-background py-2.5 pl-10 pr-9 text-sm text-foreground placeholder-muted-light focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-light hover:text-foreground cursor-pointer">
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all' ? 'bg-primary-dark text-white' : 'bg-background text-muted hover:text-foreground border border-border-light'
              }`}
            >
              {lang === 'en' ? 'All' : 'সব'}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === c.id ? 'bg-primary-dark text-white' : 'bg-background text-muted hover:text-foreground border border-border-light'
                }`}
              >
                {lang === 'bn' ? (c.nameBn || c.name) : c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin pb-28 lg:pb-6">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <CoffeeIcon className="mx-auto h-10 w-10 text-border" />
              <p className="mt-3 text-sm font-medium text-muted">{lang === 'en' ? 'No items found' : 'কোনো আইটেম পাওয়া যায়নি'}</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const countInCart = getItemCartCount(item.id);
              const hasOptions = item.options && Object.keys(item.options).length > 0;
              const simpleCartEntry = !hasOptions ? getItemCartEntries(item.id)[0] : null;
              return (
                <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-border-light bg-background/40 p-4 hover:bg-surface hover:border-accent/20 hover:shadow-[0_4px_16px_-8px_rgba(36,24,16,0.08)] transition-all">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover border border-border-light" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-alt text-accent">
                      <CoffeeIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-primary-dark truncate">
                          {lang === 'bn' ? (item.nameBn || item.name) : item.name}
                        </h4>
                      </div>
                      <span className="font-bold text-sm text-primary-dark whitespace-nowrap">৳{item.priceBdt}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex gap-1 flex-wrap">
                        {item.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            tag === 'veg' ? 'bg-emerald-50 text-emerald-700'
                            : tag === 'hot' ? 'bg-amber-50 text-amber-700'
                            : tag === 'cold' ? 'bg-sky-50 text-sky-700'
                            : 'bg-surface-alt text-muted'
                          }`}>{tag}</span>
                        ))}
                        {hasOptions && <span className="text-[10px] text-accent font-medium">{lang === 'en' ? 'Customizable' : 'কাস্টমাইজযোগ্য'}</span>}
                      </div>
                      <div className="shrink-0">
                        {simpleCartEntry ? (
                          <div className="flex items-center rounded-xl bg-primary-dark text-white">
                            <button onClick={() => onUpdateCartQty(simpleCartEntry.id, -1)} className="p-2 hover:text-accent-soft transition-colors cursor-pointer"><MinusIcon className="h-3.5 w-3.5" /></button>
                            <span className="w-6 text-center text-xs font-bold">{simpleCartEntry.quantity}</span>
                            <button onClick={() => onUpdateCartQty(simpleCartEntry.id, 1)} className="p-2 hover:text-accent-soft transition-colors cursor-pointer"><PlusIcon className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleItemAction(item)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                              countInCart > 0 ? 'bg-primary-dark text-white' : 'bg-surface border border-border text-primary-dark hover:bg-primary-dark hover:text-white hover:border-primary-dark'
                            }`}
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
                            {lang === 'en' ? 'Add' : 'যোগ'}
                            {countInCart > 0 && <span className="ml-0.5 rounded-full bg-accent px-1.5 text-[10px] font-bold text-primary-dark">{countInCart}</span>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Options Modal */}
        {activeItemForOptions && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary-dark/30 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl animate-scale-in">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h4 className="font-display text-lg font-semibold text-primary-dark">{activeItemForOptions.name}</h4>
                  <p className="text-accent font-semibold">৳{activeItemForOptions.priceBdt}</p>
                </div>
                <button onClick={() => setActiveItemForOptions(null)} className="rounded-lg p-1.5 text-muted hover:text-foreground cursor-pointer"><XIcon className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-thin">
                {Object.entries(activeItemForOptions.options || {}).map(([key, vals]) => {
                  if (!Array.isArray(vals)) return null;
                  return (
                    <div key={key}>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-light">{key}</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {vals.map((v) => {
                          const isSelected = selectedOptions[key] === v;
                          return (
                            <button key={v} onClick={() => setSelectedOptions((p) => ({ ...p, [key]: v }))}
                              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                                isSelected ? 'bg-primary-dark text-white' : 'bg-background border border-border-light text-foreground hover:border-accent/40'
                              }`}>{v}</button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setActiveItemForOptions(null)} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-muted hover:text-foreground cursor-pointer">{lang === 'en' ? 'Cancel' : 'বাতিল'}</button>
                <button onClick={handleConfirmOptions} className="flex-1 btn-primary rounded-xl py-2.5 text-sm font-semibold cursor-pointer">{lang === 'en' ? 'Add to Order' : 'যোগ করুন'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="hidden lg:block h-[680px] sticky top-[88px] rounded-3xl border border-border-light bg-surface shadow-[0_1px_3px_rgba(36,24,16,0.02),0_12px_32px_-12px_rgba(36,24,16,0.08)] overflow-hidden">
        {renderPanelContent(false)}
      </div>
      {isMobileOpen && selectedTable && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-primary-dark/40 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={onCloseMobile} />
          <div className="relative z-10 flex h-[88vh] w-full flex-col rounded-t-3xl bg-surface shadow-2xl overflow-hidden animate-fade-up">
            <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-border" /></div>
            {renderPanelContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
