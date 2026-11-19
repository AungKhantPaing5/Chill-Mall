import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    redirect('/login');
  }

  const t = await getTranslations('admin');

  const [totalVideos, publicVideos, privateVideos, totalUsers, storageProviders, adSettings] = await Promise.all([
    prisma.video.count({ where: { deletedAt: null } }),
    prisma.video.count({ where: { visibility: 'PUBLIC', deletedAt: null } }),
    prisma.video.count({ where: { visibility: 'PRIVATE', deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.storageProvider.findMany(),
    prisma.adSettings.findUnique({ where: { id: 'singleton' } }),
  ]);

  return (
    <div className="min-h-screen bg-bg-main text-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-sm text-slate-400">CHILL MALL Production Administration</p>
          </div>
          <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-sm hover:border-violet-500">
            ← Public Website
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <div className="text-xs uppercase text-slate-400">Total Videos</div>
            <div className="mt-2 text-3xl font-bold">{totalVideos}</div>
            <div className="mt-1 text-xs text-slate-400">Public: {publicVideos} • Private: {privateVideos}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <div className="text-xs uppercase text-slate-400">Total Users</div>
            <div className="mt-2 text-3xl font-bold">{totalUsers}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <div className="text-xs uppercase text-slate-400">Storage Providers</div>
            <div className="mt-2 text-3xl font-bold">{storageProviders.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <div className="text-xs uppercase text-slate-400">AdSense Revenue</div>
            <div className="mt-2 text-sm text-amber-400">{t('revenueNotConnected')}</div>
            <div className="mt-1 text-xs text-slate-400">
              Ads Enabled: {adSettings?.adsEnabled ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
