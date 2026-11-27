'use client';

import React, { useState } from 'react';
import { CartItem, Table, TimeSlot } from '@/types';
import { ChevronRightIcon, MinusIcon, PlusIcon, ShoppingBagIcon, TrashIcon, XIcon } from './Icons';

interface CartBarProps {
  cart: CartItem[];
  selectedTable: Table | null;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  lang: 'en' | 'bn';
  isOpen: boolean;
  onToggleOpen: () => void;
  onCheckout: () => void;
}

export default function CartBar({
  cart,
  selectedTable,
  selectedDate,
  selectedSlot,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  lang,
  isOpen,
  onToggleOpen,
  onCheckout,
}: CartBarProps) {
  const [orderNote, setOrderNote] = useState('');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.priceBdt * item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 sm:p-6 pointer-events-none">
        <div className="mx-auto max-w-3xl pointer-events-auto animate-fade-up">
          <div className="flex items-center justify-between rounded-[1.25rem] bg-primary-dark/[0.97] backdrop-blur-xl px-5 py-4 shadow-[0_8px_40px_rgba(36,24,16,0.35)] text-white border border-white/[0.06]">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary-dark font-extrabold">
                {selectedTable ? selectedTable.code : <ShoppingBagIcon className="h-5 w-5" />}
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary-dark px-1">
                  {totalItems}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {selectedTable
                    ? (lang === 'en' ? `Table ${selectedTable.code}` : `টেবিল ${selectedTable.code}`)
                    : (lang === 'en' ? 'Your Order' : 'আপনার অর্ডার')}
                </div>
                <div className="text-xs text-white/60 mt-0.5">
                  {lang === 'en' ? 'Subtotal' : 'সাবটোটাল'}: <span className="text-accent-soft font-bold">{lang === 'en' ? 'BDT' : '৳'} {totalAmount}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onToggleOpen}
              className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-primary-dark hover:bg-accent-soft transition-all cursor-pointer"
            >
              <span>{lang === 'en' ? 'Review Order' : 'অর্ডার দেখুন'}</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-primary-dark/40 p-0 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={onToggleOpen} />
          <div className="relative w-full sm:max-w-lg bg-surface sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
              <div>
                <h3 className="font-display text-xl font-semibold text-primary-dark">
                  {lang === 'en' ? 'Your Order' : 'আপনার অর্ডার'}
                </h3>
                <p className="text-xs text-muted mt-1">
                  {selectedTable ? `Table ${selectedTable.code}` : (lang === 'en' ? 'No table selected' : 'টেবিল নির্বাচন করা হয়নি')} · {selectedDate} · {selectedSlot?.label || ''}
                </p>
              </div>
              <button onClick={onToggleOpen} className="rounded-xl p-2 text-muted hover:text-foreground hover:bg-surface-alt/60 transition-colors cursor-pointer">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
              {cart.map((item) => {
                const optString = item.selectedOptions
                  ? Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')
                  : null;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-primary-dark truncate">
                        {lang === 'bn' ? (item.nameBn || item.name) : item.name}
                      </h4>
                      {optString && <p className="text-[11px] text-muted mt-0.5">{optString}</p>}
                      <p className="text-sm text-accent font-semibold mt-1">{lang === 'en' ? 'BDT' : '৳'} {item.priceBdt * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center rounded-xl border border-border bg-background">
                        <button onClick={() => onUpdateQty(item.id, -1)} className="p-2 text-muted hover:text-primary-dark cursor-pointer"><MinusIcon className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center text-sm font-semibold text-primary-dark">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.id, 1)} className="p-2 text-muted hover:text-primary-dark cursor-pointer"><PlusIcon className="h-3.5 w-3.5" /></button>
                      </div>
                      <button onClick={() => onRemoveItem(item.id)} className="p-2 text-muted hover:text-danger transition-colors cursor-pointer"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-light">
                  {lang === 'en' ? 'Special Instructions' : 'বিশেষ নির্দেশনা'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'en' ? 'E.g. less sugar, no ice...' : 'যেমন: চিনি কম...'}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-foreground placeholder-muted-light focus:border-accent focus:ring-2 focus:ring-accent/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="px-6 py-5 border-t border-border-light bg-surface-alt/30 sm:rounded-b-3xl">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted">{lang === 'en' ? 'Subtotal' : 'সাবটোটাল'}</span>
                <span className="font-medium text-foreground">{lang === 'en' ? 'BDT' : '৳'} {totalAmount}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted">{lang === 'en' ? 'Reservation fee' : 'রিজার্ভেশন ফি'}</span>
                <span className="font-medium text-emerald-600">{lang === 'en' ? 'Free' : 'ফ্রি'}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-primary-dark mb-5 pt-4 border-t border-border-light">
                <span>{lang === 'en' ? 'Total' : 'মোট'}</span>
                <span className="font-display text-xl">{lang === 'en' ? 'BDT' : '৳'} {totalAmount}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={onClearCart} className="px-4 py-3 text-sm font-medium text-muted hover:text-danger transition-colors cursor-pointer">
                  {lang === 'en' ? 'Clear' : 'মুছুন'}
                </button>
                <button
                  onClick={onToggleOpen}
                  className="flex-1 btn-primary rounded-2xl px-6 py-3.5 text-sm font-semibold cursor-pointer"
                >
                  {lang === 'en' ? 'Confirm & Book' : 'প্রি-অর্ডার নিশ্চিত করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}