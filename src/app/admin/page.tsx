import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma/client';
import { Upload, Video, HardDrive, Megaphone } from 'lucide-react';

export default async function AdminOverviewPage() {
  const t = await getTranslations('admin');

  const [
    totalVideos,
    publicVideos,
    privateVideos,
    processingJobs,
    totalUsers,
    storageProviders,
    adSettings,
    recentVideos,
  ] = await Promise.all([
    prisma.video.count({ where: { deletedAt: null } }),
    prisma.video.count({ where: { visibility: 'PUBLIC', deletedAt: null } }),
    prisma.video.count({ where: { visibility: 'PRIVATE', deletedAt: null } }),
    prisma.video.count({ where: { processingStatus: { in: ['QUEUED', 'PROCESSING'] }, deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.storageProvider.findMany(),
    prisma.adSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.video.findMany({
      where: { deletedAt: null },
      include: { category: true, storageProvider: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-400">CHILL MALL Production Administration</p>
        </div>
        <Link
          href="/admin/videos/upload"
          className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition"
        >
          <Upload className="h-4 w-4" />
          {t('upload')}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
          <div className="text-xs uppercase text-slate-400">Total Videos</div>
          <div className="mt-2 text-3xl font-bold">{totalVideos}</div>
          <div className="mt-1 text-xs text-slate-400">
            Public: {publicVideos} • Private: {privateVideos} • Queue: {processingJobs}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
          <div className="text-xs uppercase text-slate-400">Total Users</div>
          <div className="mt-2 text-3xl font-bold">{totalUsers}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
          <div className="text-xs uppercase text-slate-400">Storage Providers</div>
          <div className="mt-2 text-3xl font-bold">{storageProviders.length}</div>
          <div className="mt-1 text-xs text-slate-400">
            Default: {storageProviders.find((s) => s.isDefault)?.name || 'Local'}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
          <div className="text-xs uppercase text-slate-400">AdSense Revenue</div>
          <div className="mt-2 text-sm font-medium text-amber-400">{t('revenueNotConnected')}</div>
          <div className="mt-1 text-xs text-slate-400">
            Ads Enabled: {adSettings?.adsEnabled ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Link href="/admin/videos/upload" className="rounded-xl border border-white/10 bg-bg-secondary p-4 hover:border-violet-500 transition flex items-center gap-3">
          <Upload className="h-5 w-5 text-violet-400" />
          <span className="text-sm font-medium">Upload New AI Video</span>
        </Link>
        <Link href="/admin/videos" className="rounded-xl border border-white/10 bg-bg-secondary p-4 hover:border-violet-500 transition flex items-center gap-3">
          <Video className="h-5 w-5 text-sky-400" />
          <span className="text-sm font-medium">Manage Videos</span>
        </Link>
        <Link href="/admin/storage" className="rounded-xl border border-white/10 bg-bg-secondary p-4 hover:border-violet-500 transition flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium">Storage & Migration</span>
        </Link>
        <Link href="/admin/ads" className="rounded-xl border border-white/10 bg-bg-secondary p-4 hover:border-violet-500 transition flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-medium">Configure AdSense</span>
        </Link>
      </div>

      {/* Recent Videos */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold">Recent Uploads</h2>
        {recentVideos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-bg-secondary p-10 text-center text-sm text-slate-400">
            No videos uploaded yet. Click &ldquo;Upload Video&rdquo; to publish your first AI video.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Storage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentVideos.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3 font-medium">{v.title}</td>
                    <td className="px-4 py-3 text-xs">{v.visibility}</td>
                    <td className="px-4 py-3 text-xs text-sky-400">{v.processingStatus}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{v.storageProvider.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
