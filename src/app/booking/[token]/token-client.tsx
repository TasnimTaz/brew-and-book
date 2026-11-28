'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

export default function TokenClient({ token }: { token: string }) {
  type Booking = { token:string; serial:number; status:string; date:string; guests:number; note?:string|null; tableCode:string; slotLabel:string; customerName:string; customerPhone:string; paymentStatus:string; holdExpiresAt?:string|null; totalBdt:number; qrDataUrl?:string; items?: {quantity:number; name:string; unitPriceBdt:number}[] };
  const [data, setData] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [paying, setPaying] = useState(false);
  const [payNote] = useState(() => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('payment') || ''));

  const load = useCallback(async () => {
    try { const r = await fetch(`/api/bookings/${token}`, { cache: 'no-store' }); const d = await r.json(); if (!r.ok) throw new Error(d.error||'Failed'); setData(d.booking); setError(''); }
    catch(e:unknown){ setError(e instanceof Error ? e.message : 'Failed'); }
  }, [token]);
  useEffect(() => { 
    let active = true;
    (async () => {
      try { const r = await fetch(`/api/bookings/${token}`, { cache: 'no-store' }); const d = await r.json(); if (!r.ok) throw new Error(d.error||'Failed'); if(active){ setData(d.booking); setError(''); } }
      catch(e:unknown){ if(active) setError(e instanceof Error ? e.message : 'Failed'); }
    })();
    return () => { active = false; };
  }, [token]);

  const holding = data?.status === 'HELD';
  useEffect(() => {
    if (!holding) return;
    const t = setInterval(() => { load(); }, 4000);
    return () => clearInterval(t);
  }, [holding, load]);

  const payNow = async () => {
    setActionError(''); setPaying(true);
    try {
      const r = await fetch('/api/payments/sslcommerz/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, phone }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not start the payment');
      window.location.assign(d.paymentUrl);
    } catch (e: unknown) { setActionError(e instanceof Error ? e.message : 'Could not start the payment'); setPaying(false); }
  };

  const cancel = async () => {
    setMsg(''); setActionError('');
    const r = await fetch(`/api/bookings/${token}/cancel`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone }) });
    const d = await r.json(); if (!r.ok) { setActionError(d.error||'Cancel failed'); return; } setMsg('Booking cancelled.'); load();
  };

  if (error) return <div className="min-h-screen bg-[#f6f2ec] p-6"><div className="max-w-xl mx-auto bg-white rounded-2xl p-6 border"><h1 className="font-display text-2xl text-primary-dark">Booking</h1><p className="text-rose-600 mt-2">{error}</p></div></div>;
  if (!data) return <div className="min-h-screen bg-[#f6f2ec] p-6"><div className="max-w-xl mx-auto">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-[#f6f2ec] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">Brew & Book</p>
            <h1 className="font-display text-3xl font-semibold text-primary-dark mt-1">Booking Token</h1>
            <p className="text-sm text-muted mt-1">Show this QR at check-in.</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-primary-dark hover:text-accent">Home</Link>
        </div>

        <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="space-y-2 text-sm">
            <Row k="Token" v={data.token} />
            <Row k="Serial" v={`#${data.serial}`} />
            <Row k="Table" v={data.tableCode} />
            <Row k="Name" v={data.customerName} />
            <Row k="Phone" v={data.customerPhone} />
            <Row k="Date" v={String(data.date).slice(0,10)} />
            <Row k="Time" v={`${data.slotLabel}`} />
            <Row k="Guests" v={String(data.guests)} />
            <Row k="Status" v={data.status} />
            <Row k="Payment" v={data.paymentStatus} />
            <Row k="Total" v={`BDT ${data.totalBdt}`} />
          </div>
          <div className="bg-[#faf7f2] border rounded-2xl p-3">
            {data.qrDataUrl ? <img src={data.qrDataUrl} alt="Booking QR" className="w-48 h-48 rounded-lg" /> : null}
            <button onClick={()=>{ if(!data.qrDataUrl) return; const a=document.createElement('a'); a.href=data.qrDataUrl; a.download=`${data.token}.png`; a.click(); }} className="mt-3 w-full rounded-xl bg-primary-dark text-white py-2 text-sm font-semibold cursor-pointer">Download QR</button>
          </div>
        </div>

        {payNote && (
          <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${payNote === 'success' && data.status === 'CONFIRMED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : payNote === 'success' || payNote === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
            {payNote === 'success' && data.status === 'CONFIRMED' && 'Payment received. Your booking is confirmed.'}
            {(payNote === 'success' || payNote === 'pending') && data.status !== 'CONFIRMED' && 'We are confirming your payment. This page updates automatically.'}
            {payNote === 'failed' && 'The payment did not go through. Your table is still held for a few minutes, so you can try again below.'}
            {payNote === 'cancelled' && 'You cancelled the payment. Your table is still held for a few minutes, so you can try again below.'}
          </div>
        )}

        {data.status === 'HELD' && data.paymentStatus !== 'PAID' && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-semibold text-primary-dark">Payment pending</h2>
            <p className="mt-1 text-xs text-muted">
              Your table is held{data.holdExpiresAt ? ` until ${new Date(data.holdExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' for a few minutes'}. Pay online with bKash, Nagad, Rocket or card to confirm it.
            </p>
            <div className="mt-3 flex gap-2">
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Booking phone (01XXXXXXXXX)" className="flex-1 rounded-xl border border-border px-3 py-2 text-sm" />
              <button onClick={payNow} disabled={paying || !phone} className="rounded-xl bg-primary-dark text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 cursor-pointer">{paying ? 'Opening...' : `Pay BDT ${data.totalBdt}`}</button>
            </div>
          </div>
        )}

        {(data.items?.length ?? 0) > 0 && (
          <div className="mt-6 border-t pt-4">
            <h2 className="font-semibold text-primary-dark mb-2">Pre-order</h2>
            <div className="space-y-1 text-sm">
              {(data.items ?? []).map((it, i:number)=><div key={i} className="flex justify-between"><span>{it.quantity}x {it.name}</span><span>BDT {Number(it.unitPriceBdt)*Number(it.quantity)}</span></div>)}
            </div>
          </div>
        )}

        <div className="mt-6 border-t pt-4">
          <h2 className="font-semibold text-primary-dark mb-2">Manage booking</h2>
          <p className="text-xs text-muted mb-2">Cancel with your booking phone number. Free cancellation up to 2 hours before slot.</p>
          <div className="flex gap-2">
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone (01XXXXXXXXX)" className="flex-1 rounded-xl border border-border px-3 py-2 text-sm" />
            <button onClick={cancel} className="rounded-xl border border-rose-200 text-rose-700 px-4 py-2 text-sm font-semibold hover:bg-rose-50 cursor-pointer">Cancel</button>
          </div>
          {msg && <p className="text-sm text-emerald-700 mt-2">{msg}</p>}
          {actionError && <p className="text-sm text-rose-700 mt-2">{actionError}</p>}
        </div>
      </div>
    </div>
  );
}

function Row({k,v}:{k:string;v:string}){ return <div className="flex justify-between gap-4 border-b border-border-light py-1.5"><span className="text-muted">{k}</span><span className="font-medium text-primary-dark text-right">{v}</span></div>; }
