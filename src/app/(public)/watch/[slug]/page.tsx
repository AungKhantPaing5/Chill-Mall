import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { canWatchVideo, isAdminRole } from '@/lib/auth/rbac';
import { createStreamToken } from '@/lib/security/signed-url';
import { Navbar } from '@/components/layout/Navbar';
import { VideoPlayer } from '@/components/video/VideoPlayer';

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ u?: string }>;
}) {
  const { slug } = await params;
  const { u } = await searchParams;
  const user = await getCurrentUser();

  const video = await prisma.video.findUnique({
    where: { slug },
    include: {
      category: true,
      allowedUsers: { select: { userId: true } },
    },
  });

  if (!video || video.deletedAt) notFound();

  const allowed = canWatchVideo(
    {
      visibility: video.visibility,
      isPublished: video.isPublished,
      unlistedToken: video.unlistedToken,
      allowedUserIds: video.allowedUsers.map((a) => a.userId),
    },
    user,
    u
  );

  if (!allowed) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Navbar isLoggedIn={Boolean(user)} isAdmin={Boolean(user && isAdminRole(user.roles))} />
        <main className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
          <p className="mt-2 text-slate-400">You do not have permission to watch this protected video.</p>
        </main>
      </div>
    );
  }

  const { token, exp } = createStreamToken(video.id, 3600);
  const hlsUrl = video.hlsMasterKey
    ? `/api/videos/${video.id}/stream/master.m3u8?token=${token}&exp=${exp}${u ? `&u=${encodeURIComponent(u)}` : ''}`
    : null;

  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar isLoggedIn={Boolean(user)} isAdmin={Boolean(user && isAdminRole(user.roles))} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <VideoPlayer videoId={video.id} hlsUrl={hlsUrl} />
        <div className="mt-6 rounded-2xl border border-white/10 bg-bg-card p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-violet-400">
            {video.isAiGenerated && (
              <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 font-medium">
                AI-Generated Content
              </span>
            )}
            <span>Visibility: {video.visibility}</span>
            <span>• {Number(video.viewsCount).toLocaleString()} views</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-white">{video.title}</h1>
          {video.description && <p className="mt-3 whitespace-pre-line text-slate-300">{video.description}</p>}
        </div>
      </main>
    </div>
  );
}
