'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LookupPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const t = token.trim();
    if (!t) return;
    const r = await fetch(`/api/bookings/${encodeURIComponent(t)}`);
    if (!r.ok) { const d = await r.json().catch(()=>({})); setError(d.error||'Booking not found'); return; }
    router.push(`/booking/${encodeURIComponent(t)}`);
  };
  return (
    <div className="min-h-screen bg-[#f6f2ec] p-6">
      <div className="max-w-lg mx-auto bg-white rounded-3xl border p-6">
        <h1 className="font-display text-3xl font-semibold text-primary-dark">Find your booking</h1>
        <p className="text-sm text-muted mt-1">Enter your booking token to view or cancel it.</p>
        <form onSubmit={go} className="mt-5 space-y-3">
          <input value={token} onChange={e=>setToken(e.target.value)} placeholder="BB-YYYYMMDD-T01-S001" className="w-full rounded-xl border border-border px-4 py-3 text-sm" />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="w-full btn-primary rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer">Lookup</button>
        </form>
      </div>
    </div>
  );
}
