'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Login failed');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-card p-8">
        <h1 className="text-2xl font-bold text-white">{t('loginTitle')}</h1>
        {error && <p className="mt-3 rounded bg-red-500/15 p-3 text-sm text-red-400">{error}</p>}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-secondary px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300">{t('password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-secondary px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 py-2.5 font-semibold text-white hover:bg-violet-500 transition"
          >
            {t('submitLogin')}
          </button>
        </div>
      </form>
    </div>
  );
}
