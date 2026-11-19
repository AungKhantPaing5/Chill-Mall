'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export function AdminLoginGate({ wrongRole = false }: { wrongRole?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Admin login failed');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  if (wrongRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-card p-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-red-400" />
          <h1 className="mt-4 text-xl font-bold text-white">Admin Access Required</h1>
          <p className="mt-2 text-sm text-slate-400">
            Current account does not have Administrator privileges.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-lg bg-violet-600 py-2.5 font-semibold text-white hover:bg-violet-500 transition"
          >
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-card p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-violet-400">
          <Shield className="h-6 w-6" />
          <span className="text-xs font-semibold uppercase tracking-wider">CHILL MALL ADMIN</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">Admin Panel Sign In</h1>

        {error && <p className="mt-4 rounded-lg bg-red-500/15 p-3 text-sm text-red-400">{error}</p>}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-secondary px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-secondary px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-2.5 font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Enter Admin Panel'}
          </button>
        </div>
      </form>
    </div>
  );
}
