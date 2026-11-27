'use client';

import React, { useState } from 'react';
import { CartItem, Table, TimeSlot } from '@/types';
import { XIcon } from './Icons';

type BookingResult = { token: string; [key: string]: unknown };
type Props = {
  open: boolean; onClose: () => void; lang: 'en' | 'bn';
  cart: CartItem[]; selectedTable: Table | null; selectedDate: string; selectedSlot: TimeSlot | null;
  onSuccess: (booking: BookingResult) => void;
};

export default function BookingModal({ open, onClose, lang, cart, selectedTable, selectedDate, selectedSlot, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(selectedTable?.seats || 2);
  const [note, setNote] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verification, setVerification] = useState<{phone:string;exp:number;sig:string} | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  if (!open) return null;
  const total = cart.reduce((s, c) => s + c.priceBdt * c.quantity, 0);

  const sendOtp = async () => {
    setError(''); setBusy('send');
    try {
      const res = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true); setDevCode(data.devCode || '');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to send OTP'); } finally { setBusy(''); }
  };

  const verifyOtp = async () => {
    setError(''); setBusy('verify');
    try {
      const res = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code: otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      setVerification(data.verification);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Invalid OTP'); } finally { setBusy(''); }
  };

  const confirm = async () => {
    setError(''); setBusy('book');
    try {
      if (!selectedTable || !selectedSlot) throw new Error('Select table and slot');
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        tableId: selectedTable.id, slotId: selectedSlot.id, date: selectedDate, guests, name, phone, note,
        cart: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity, selectedOptions: c.selectedOptions })),
        verification,
      })});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      onSuccess(data.booking);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Booking failed'); } finally { setBusy(''); }
  };

  const L = (en: string, bn: string) => lang === 'en' ? en : bn;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-primary-dark/40 p-0 sm:p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl bg-surface sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-display text-2xl font-semibold text-primary-dark">{L('Confirm Booking','????? ??????? ????')}</h3>
            <p className="text-sm text-muted mt-1">{selectedTable?.code} ? {selectedDate} ? {selectedSlot?.label}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted hover:bg-surface-alt cursor-pointer"><XIcon className="h-5 w-5"/></button>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={L('Full name','???? ???')} className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
            <input value={guests} onChange={e=>setGuests(Number(e.target.value))} type="number" min={1} max={selectedTable?.seats||20} placeholder={L('Guests','?????')} className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
          </div>
          <div className="flex gap-2">
            <input value={phone} onChange={e=>{setPhone(e.target.value); setVerification(null);}} placeholder={L('Phone (01XXXXXXXXX)','??? (01XXXXXXXXX)')} className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
            <button onClick={sendOtp} disabled={busy==='send' || !phone} className="rounded-xl px-4 py-3 text-sm font-semibold bg-primary-dark text-white disabled:opacity-50 cursor-pointer">{busy==='send'?L('Sending...','?????? ?????...'):L('Send OTP','OTP ?????')}</button>
          </div>
          {otpSent && (
            <div className="flex gap-2">
              <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder={L('6-digit OTP','? ??????? OTP')} className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
              <button onClick={verifyOtp} disabled={busy==='verify' || otp.length!==6} className="rounded-xl px-4 py-3 text-sm font-semibold border border-border hover:bg-surface-alt disabled:opacity-50 cursor-pointer">{verification?L('Verified','????????'):busy==='verify'?L('Verifying...','????? ?????...'):L('Verify','?????')}</button>
            </div>
          )}
          {devCode && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Dev OTP: <b>{devCode}</b></p>}
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder={L('Special note (optional)','????? ??? (??????)')} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" rows={2} />

          <div className="rounded-2xl bg-background border border-border-light p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">{L('Items','?????')}</span><span>{cart.reduce((s,c)=>s+c.quantity,0)}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted">{L('Total','???')}</span><span className="font-bold text-primary-dark">BDT {total}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted">{L('Payment','???????')}</span><span>{L('Pay at shop (Day 3)','?????? ??????? (Day 3)')}</span></div>
          </div>

          {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}

          <button onClick={confirm} disabled={!verification || !name || !selectedTable || !selectedSlot || busy==='book'} className="w-full btn-primary rounded-2xl px-6 py-3.5 text-sm font-semibold disabled:opacity-50 cursor-pointer">
            {busy==='book'?L('Confirming...','??????? ??? ?????...'):L('Confirm Booking & Get Token','????? ??????? ???? ? ????? ???')}
          </button>
          <p className="text-[11px] text-muted text-center">{L('Free cancellation up to 2 hours before slot.','?????? ? ????? ??? ??????? ???? ??????')}</p>
        </div>
      </div>
    </div>
  );
}
