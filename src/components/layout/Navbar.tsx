'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Globe, PlayCircle, Search } from 'lucide-react';
import { useState } from 'react';

export function Navbar({ isAdmin = false, isLoggedIn = false }: { isAdmin?: boolean; isLoggedIn?: boolean }) {
  void isAdmin;
  void isLoggedIn;
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState('');

  async function toggleLanguage() {
    const next = locale === 'en' ? 'my' : 'en';
    await fetch('/api/language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/videos?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg-main/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-wider">
          <PlayCircle className="h-6 w-6 text-violet-500" />
          <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
            CHILL MALL
          </span>
        </Link>

        <form onSubmit={onSearch} className="hidden flex-1 max-w-md md:flex items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-full border border-white/10 bg-bg-secondary py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
          />
        </form>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/videos" className="text-slate-300 hover:text-white transition">
            {t('library')}
          </Link>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-bg-card px-3 py-1.5 text-xs font-medium hover:border-violet-500 transition"
            title="Switch Language"
          >
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            {locale === 'en' ? 'မြန်မာ' : 'EN'}
          </button>
        </nav>
      </div>
    </header>
  );
}
