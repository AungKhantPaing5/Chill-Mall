import Link from 'next/link';
import { prisma } from '@/lib/prisma/client';
import { Upload, ExternalLink } from 'lucide-react';
import { VideoActionsClient } from '@/components/admin/VideoActionsClient';

export default async function AdminVideosPage() {
  const videos = await prisma.video.findMany({
    where: { deletedAt: null },
    include: { category: true, storageProvider: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold">Video Management</h1>
          <p className="mt-1 text-sm text-slate-400">Manage visibility, HLS transcoding status, and featured videos.</p>
        </div>
        <Link
          href="/admin/videos/upload"
          className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
        >
          <Upload className="h-4 w-4" /> Upload Video
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Processing</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {videos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No videos found.
                </td>
              </tr>
            ) : (
              videos.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-white">
                      <span>{v.title}</span>
                      <Link
                        href={`/watch/${v.slug}${v.unlistedToken ? `?u=${v.unlistedToken}` : ''}`}
                        target="_blank"
                        className="text-slate-400 hover:text-violet-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{v.category?.nameEn || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        v.processingStatus === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : v.processingStatus === 'FAILED'
                            ? 'bg-red-500/15 text-red-300'
                            : 'bg-sky-500/15 text-sky-300'
                      }`}
                    >
                      {v.processingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{v.storageProvider.name}</td>
                  <td className="px-4 py-3 text-xs">{Number(v.viewsCount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <VideoActionsClient
                      videoId={v.id}
                      visibility={v.visibility}
                      isFeatured={v.isFeatured}
                      status={v.processingStatus}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
