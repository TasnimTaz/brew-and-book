'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

type Payment = { id: number; status: string; method: string; gateway: string; amountBdt: number; txn: string | null; refundNote?: string | null };
type Row = {
  id: number; token: string; serial: number; status: string; date: string; guests: number; note?: string | null;
  tableCode: string; slotLabel: string; slotStart: string; customerName: string; customerPhone: string;
  orderTotalBdt: number; needsRefund: boolean; payments: Payment[];
};
type Props = { adminFetch: (url: string, init?: RequestInit) => Promise<Response> };
type View = 'day' | 'refund';

const todayBd = () => new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10);
const shiftDay = (d: string, n: number) => new Date(new Date(d + 'T00:00:00Z').getTime() + n * 86400_000).toISOString().slice(0, 10);

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HELD: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-sky-50 text-sky-700 border-sky-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  NO_SHOW: 'bg-slate-100 text-slate-600 border-slate-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  REFUNDED: 'bg-violet-50 text-violet-700 border-violet-200',
  UNPAID: 'bg-slate-100 text-slate-600 border-slate-200',
};
const Badge = ({ text }: { text: string }) => (
  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[text] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{text.replace('_', ' ')}</span>
);

export default function AdminBookings({ adminFetch }: Props) {
  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState(todayBd());
  const [rows, setRows] = useState<Row[]>([]);
  const [refundCount, setRefundCount] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Loads the list, and refreshes it every 20 seconds while the page stays open
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const url = view === 'refund' ? '/api/admin/bookings?filter=refund' : `/api/admin/bookings?date=${date}`;
        const res = await adminFetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        if (!active) return;
        setRows(data.bookings);
        setError('');
      } catch (e: unknown) {
        if (!active || (e instanceof Error && e.message === 'Session expired')) return;
        setError(e instanceof Error ? e.message : 'Failed to load bookings');
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    const t = setInterval(() => { void run(); }, 20000);
    return () => { active = false; clearInterval(t); };
  }, [adminFetch, view, date, reloadKey]);

  // Badge count for the "Needs refund" button
  useEffect(() => {
    let active = true;
    adminFetch('/api/admin/bookings?filter=refund').then((r) => r.json()).then((d) => { if (active && d.bookings) setRefundCount(d.bookings.length); }).catch(() => {});
    return () => { active = false; };
  }, [adminFetch, rows]);

  const act = async (row: Row, action: 'complete' | 'no_show' | 'cancel') => {
    const label = { complete: 'check in', no_show: 'mark as no-show', cancel: 'cancel' }[action];
    if (!confirm(`${label[0].toUpperCase() + label.slice(1)} booking ${row.token} (${row.customerName})?`)) return;
    setBusyId(row.id);
    try {
      const res = await adminFetch(`/api/admin/bookings/${row.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      reload();
    } catch (e: unknown) { if (!(e instanceof Error && e.message === 'Session expired')) alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusyId(null); }
  };

  const refund = async (row: Row, p: Payment) => {
    const note = prompt(`Refund BDT ${p.amountBdt} to ${row.customerName} (${row.customerPhone}).\nFirst refund it in your SSLCommerz merchant panel, then write a note (e.g. reference no.) and press OK:`);
    if (note === null) return;
    setBusyId(row.id);
    try {
      const res = await adminFetch(`/api/admin/payments/${p.id}/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      reload();
    } catch (e: unknown) { if (!(e instanceof Error && e.message === 'Session expired')) alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusyId(null); }
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.token, r.customerName, r.customerPhone, r.tableCode].some((v) => String(v).toLowerCase().includes(q)));
  }, [rows, query]);

  const stats = useMemo(() => {
    const live = rows.filter((r) => r.status === 'CONFIRMED' || r.status === 'COMPLETED');
    const onlinePaid = rows.flatMap((r) => r.payments).filter((p) => p.status === 'PAID' && p.method === 'ONLINE').reduce((s, p) => s + p.amountBdt, 0);
    return { total: rows.length, expected: live.filter((r) => r.status === 'CONFIRMED').length, checkedIn: live.filter((r) => r.status === 'COMPLETED').length, guests: live.reduce((s, r) => s + r.guests, 0), onlinePaid };
  }, [rows]);

  const pill = (active: boolean) => `rounded-full border px-4 py-2 text-xs font-bold transition cursor-pointer ${active ? 'border-primary-dark bg-primary-dark text-white' : 'border-border bg-surface text-muted hover:border-accent'}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => { setLoading(true); setView('day'); }} className={pill(view === 'day')}>By date</button>
        <button onClick={() => { setLoading(true); setView('refund'); }} className={pill(view === 'refund')}>
          Needs refund {refundCount > 0 && <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">{refundCount}</span>}
        </button>
        {view === 'day' && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setLoading(true); setDate(shiftDay(date, -1)); }} className="rounded-xl border border-border px-3 py-2 text-sm cursor-pointer hover:border-accent" aria-label="Previous day">‹</button>
            <input type="date" value={date} onChange={(e) => { if (e.target.value) { setLoading(true); setDate(e.target.value); } }} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
            <button onClick={() => { setLoading(true); setDate(shiftDay(date, 1)); }} className="rounded-xl border border-border px-3 py-2 text-sm cursor-pointer hover:border-accent" aria-label="Next day">›</button>
            <button onClick={() => { setLoading(true); setDate(todayBd()); }} className="rounded-xl border border-border px-3 py-2 text-xs font-bold cursor-pointer hover:border-accent">Today</button>
          </div>
        )}
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search token, name, phone, table" className="ml-auto w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm sm:w-72" />
      </div>

      {view === 'day' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Bookings', stats.total], ['Expected', stats.expected], ['Checked in', stats.checkedIn], ['Online paid', `BDT ${stats.onlinePaid}`]].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl border border-border bg-surface p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-muted">{k}</p><p className="font-display mt-1 text-2xl font-semibold text-primary-dark">{v}</p></div>
          ))}
        </div>
      )}

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {loading && <p className="text-sm text-muted">Loading...</p>}
      {!loading && !error && shown.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">{view === 'refund' ? 'No refunds waiting. All clear.' : 'No bookings for this day.'}</div>
      )}

      <div className="space-y-3">
        {shown.map((r) => {
          const online = r.payments.find((p) => p.method === 'ONLINE' && (p.status === 'PAID' || p.status === 'REFUNDED')) || r.payments[r.payments.length - 1];
          const busy = busyId === r.id;
          return (
            <div key={r.id} className={`rounded-2xl border bg-surface p-4 ${r.needsRefund ? 'border-rose-300 ring-1 ring-rose-200' : 'border-border'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-primary-dark px-3 py-2 text-center text-white">
                    <p className="text-sm font-extrabold">{r.tableCode}</p>
                    <p className="text-[10px] opacity-80">{r.slotLabel}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-primary-dark">{r.customerName} <span className="font-normal text-muted">· {r.guests} guests</span></p>
                    <p className="text-xs text-muted">{r.customerPhone} · <span className="font-mono">{r.token}</span>{view === 'refund' ? ` · ${r.date}` : ''}</p>
                    {r.note && <p className="mt-0.5 text-xs italic text-muted">“{r.note}”</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge text={r.status} />
                  {online ? <Badge text={online.status} /> : <Badge text="UNPAID" />}
                  {(online || r.orderTotalBdt > 0) && <span className="text-xs font-semibold text-primary-dark">BDT {online ? online.amountBdt : r.orderTotalBdt}</span>}
                </div>
              </div>

              {r.payments.some((p) => p.refundNote) && <p className="mt-2 text-xs text-violet-700">Refund note: {r.payments.find((p) => p.refundNote)?.refundNote}</p>}

              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === 'CONFIRMED' && <button disabled={busy} onClick={() => act(r, 'complete')} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer">Check in</button>}
                {r.status === 'CONFIRMED' && <button disabled={busy} onClick={() => act(r, 'no_show')} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted hover:border-accent disabled:opacity-50 cursor-pointer">No-show</button>}
                {(r.status === 'CONFIRMED' || r.status === 'HELD') && <button disabled={busy} onClick={() => act(r, 'cancel')} className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 cursor-pointer">Cancel</button>}
                {r.needsRefund && r.payments.filter((p) => p.status === 'PAID' && p.method === 'ONLINE').map((p) => (
                  <button key={p.id} disabled={busy} onClick={() => refund(r, p)} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer">Mark refunded · BDT {p.amountBdt}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
