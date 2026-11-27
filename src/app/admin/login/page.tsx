'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CoffeeIcon } from '@/components/Icons';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@brewbook.local');
  const [password, setPassword] = useState('change-me-in-production');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-surface p-7 sm:p-8 shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark text-accent shadow-sm mb-3">
            <CoffeeIcon className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-primary-dark">Brew &amp; Book Staff Portal</h1>
          <p className="text-xs text-muted mt-1">
            Sign in to manage floor layout, tables, and live menu
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              Staff Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:bg-surface focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:bg-surface focus:outline-hidden"
            />
          </div>

          <div className="rounded-xl border border-border/80 bg-background/70 p-3 text-[11px] text-muted">
            <p className="font-bold text-primary-dark">Configured Admin Credentials</p>
            <p className="mt-0.5">
              Email: <code className="text-foreground font-semibold">admin@brewbook.local</code>
            </p>
            <p>
              Password: <code className="text-foreground font-semibold">change-me-in-production</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-primary-dark py-3 text-sm font-bold text-white hover:bg-primary transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Signing in...' : 'Sign In to Console'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-semibold text-muted hover:text-primary-dark transition-colors">
            ← Back to Live Floor Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
