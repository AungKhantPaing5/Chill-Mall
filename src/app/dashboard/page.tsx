import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma/client';
import { Navbar } from '@/components/layout/Navbar';

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard');
  const [historyCount, favoritesCount, playlistsCount] = await Promise.all([
    prisma.watchHistory.count({ where: { userId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.playlist.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar isLoggedIn isAdmin={isAdminRole(user.roles)} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-400">{user.email}</p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <div className="text-xs uppercase text-slate-400">{t('history')}</div>
            <div className="mt-2 text-3xl font-bold">{historyCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <div className="text-xs uppercase text-slate-400">{t('favorites')}</div>
            <div className="mt-2 text-3xl font-bold">{favoritesCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <div className="text-xs uppercase text-slate-400">{t('playlists')}</div>
            <div className="mt-2 text-3xl font-bold">{playlistsCount}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
