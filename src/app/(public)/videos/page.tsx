import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma/client';
import { Navbar } from '@/components/layout/Navbar';
import { Play, Search, SlidersHorizontal } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface VideosPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function VideoLibraryPage({ searchParams }: VideosPageProps) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations();

  const q = (sp.q || '').trim();
  const category = (sp.category || '').trim();
  const sort = sp.sort || 'latest';
  const currentPage = Math.max(1, Number(sp.page) || 1);
  const pageSize = 16;

  const where = {
    visibility: 'PUBLIC' as const,
    isPublished: true,
    deletedAt: null,
    ...(category ? { category: { slug: category } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' as const } } } } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === 'popular'
      ? [{ viewsCount: 'desc' as const }]
      : sort === 'trending'
        ? [{ likesCount: 'desc' as const }, { viewsCount: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

  const [videos, totalCount, categories] = await Promise.all([
    prisma.video.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.video.count({ where }),
    prisma.category.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function buildUrl(overrides: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | number | undefined> = {
      q: q || undefined,
      category: category || undefined,
      sort: sort !== 'latest' ? sort : undefined,
      page: currentPage > 1 ? currentPage : undefined,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    return qs ? `/videos?${qs}` : '/videos';
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* Header & Search */}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t('nav.library')}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {totalCount.toLocaleString()} {locale === 'my' ? 'ဗီဒီယို တွေ့ရှိပါသည်' : 'videos available'}
            </p>
          </div>

          <form action="/videos" method="GET" className="flex w-full max-w-md items-center gap-2">
            {category && <input type="hidden" name="category" value={category} />}
            {sort !== 'latest' && <input type="hidden" name="sort" value={sort} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full rounded-full border border-white/10 bg-bg-secondary py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition"
            >
              {locale === 'my' ? 'ရှာမည်' : 'Search'}
            </button>
          </form>
        </div>

        {/* Category Pills & Sort Bar */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildUrl({ category: undefined, page: undefined })}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                !category
                  ? 'bg-violet-600 text-white'
                  : 'border border-white/10 bg-bg-card text-slate-300 hover:border-violet-500'
              }`}
            >
              {locale === 'my' ? 'အားလုံး' : 'All'}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildUrl({ category: cat.slug, page: undefined })}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  category === cat.slug
                    ? 'bg-violet-600 text-white'
                    : 'border border-white/10 bg-bg-card text-slate-300 hover:border-violet-500'
                }`}
              >
                {locale === 'my' ? cat.nameMy : cat.nameEn}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            {[
              { key: 'latest', label: locale === 'my' ? 'နောက်ဆုံးတင်' : 'Latest' },
              { key: 'popular', label: locale === 'my' ? 'ကြည့်ရှုမှုအများဆုံး' : 'Most Viewed' },
              { key: 'trending', label: locale === 'my' ? 'လူကြိုက်များ' : 'Trending' },
            ].map((item) => (
              <Link
                key={item.key}
                href={buildUrl({ sort: item.key === 'latest' ? undefined : item.key, page: undefined })}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  sort === item.key
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-bg-card text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        <div className="mt-8">
          {videos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-bg-secondary p-16 text-center">
              <p className="text-slate-300 font-medium">
                {locale === 'my'
                  ? 'ကိုက်ညီသော AI ဗီဒီယို မတွေ့ရှိသေးပါ။'
                  : 'No matching AI videos found.'}
              </p>
              {(q || category) && (
                <Link
                  href="/videos"
                  className="mt-4 inline-block rounded-full border border-white/15 px-4 py-2 text-xs text-violet-400 hover:border-violet-500"
                >
                  {locale === 'my' ? 'စစ်ထုတ်မှုအားလုံး ပြန်ဖျက်မည်' : 'Clear Filters'}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {videos.map((v) => (
                <Link
                  key={v.id}
                  href={`/watch/${v.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-bg-card hover:border-violet-500/60 transition"
                >
                  <div className="relative aspect-video bg-bg-secondary flex items-center justify-center text-slate-500">
                    <Play className="h-10 w-10 group-hover:scale-110 group-hover:text-violet-400 transition" />
                    {v.durationSeconds ? (
                      <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] text-white">
                        {Math.floor(v.durationSeconds / 60)}:
                        {String(v.durationSeconds % 60).padStart(2, '0')}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs text-violet-400">
                      {v.isAiGenerated && <span>AI</span>}
                      {v.category && (
                        <span>• {locale === 'my' ? v.category.nameMy : v.category.nameEn}</span>
                      )}
                    </div>
                    <h2 className="line-clamp-2 font-semibold text-white group-hover:text-violet-300">
                      {v.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {Number(v.viewsCount).toLocaleString()} {locale === 'my' ? 'ကြိမ်ကြည့်ရှုပြီး' : 'views'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={buildUrl({ page: currentPage - 1 })}
                className="rounded-lg border border-white/10 bg-bg-card px-4 py-2 text-sm hover:border-violet-500"
              >
                ← {locale === 'my' ? 'ရှေ့သို့' : 'Previous'}
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-slate-400">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={buildUrl({ page: currentPage + 1 })}
                className="rounded-lg border border-white/10 bg-bg-card px-4 py-2 text-sm hover:border-violet-500"
              >
                {locale === 'my' ? 'နောက်သို့' : 'Next'} →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
