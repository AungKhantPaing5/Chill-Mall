import { prisma } from '@/lib/prisma/client';

export default async function AdminAnalyticsPage() {
  const [totalEvents, videoViews, topVideos] = await Promise.all([
    prisma.analyticsEvent.count(),
    prisma.analyticsEvent.count({ where: { eventType: 'VIDEO_VIEW' } }),
    prisma.video.findMany({
      where: { deletedAt: null },
      orderBy: { viewsCount: 'desc' },
      take: 10,
      select: { id: true, title: true, viewsCount: true, visibility: true },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Platform Analytics (Real Events)</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
          <div className="text-xs uppercase text-slate-400">Recorded Analytics Events</div>
          <div className="mt-2 text-3xl font-bold">{totalEvents.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
          <div className="text-xs uppercase text-slate-400">Tracked Video Plays</div>
          <div className="mt-2 text-3xl font-bold">{videoViews.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-bg-card p-6">
        <h2 className="mb-4 font-bold">Top Viewed Videos</h2>
        <div className="space-y-2 text-sm">
          {topVideos.map((v) => (
            <div key={v.id} className="flex justify-between border-b border-white/5 py-2">
              <span>{v.title}</span>
              <span className="text-slate-400">{Number(v.viewsCount).toLocaleString()} views</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
