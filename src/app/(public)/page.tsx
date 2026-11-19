import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';
import { Navbar } from '@/components/layout/Navbar';
import { Sparkles, Play } from 'lucide-react';

export default async function HomePage() {
  const t = await getTranslations();
  const user = await getCurrentUser();

  const [latestVideos, categories] = await Promise.all([
    prisma.video.findMany({
      where: { visibility: 'PUBLIC', isPublished: true, deletedAt: null },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    prisma.category.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isLoggedIn={Boolean(user)} isAdmin={Boolean(user && isAdminRole(user.roles))} />

      <main className="flex-1">
        {/* Cinematic Hero */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-violet-950/40 via-bg-main to-sky-950/30 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t('hero.badge')}
            </span>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">{t('hero.subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/videos"
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-500 transition"
              >
                <Play className="h-4 w-4 fill-current" />
                {t('hero.browseLibrary')}
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="mb-4 text-xl font-bold">{t('sections.categories')}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/videos?category=${cat.slug}`}
                className="rounded-full border border-white/10 bg-bg-card px-4 py-2 text-sm text-slate-200 hover:border-violet-500 transition"
              >
                {cat.nameEn}
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Videos */}
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <h2 className="mb-6 text-xl font-bold">{t('sections.latest')}</h2>
          {latestVideos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-bg-secondary p-12 text-center text-slate-400">
              No public AI videos published yet. Upload your first video from the Admin Panel.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestVideos.map((v) => (
                <Link
                  key={v.id}
                  href={`/watch/${v.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-bg-card hover:border-violet-500/60 transition"
                >
                  <div className="aspect-video bg-bg-secondary flex items-center justify-center text-slate-500">
                    <Play className="h-10 w-10 group-hover:scale-110 group-hover:text-violet-400 transition" />
                  </div>
                  <div className="p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs text-violet-400">
                      {v.isAiGenerated && <span>AI</span>}
                      {v.category && <span>• {v.category.nameEn}</span>}
                    </div>
                    <h3 className="line-clamp-2 font-semibold text-white group-hover:text-violet-300">
                      {v.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{Number(v.viewsCount).toLocaleString()} views</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
