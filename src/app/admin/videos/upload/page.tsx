import { prisma } from '@/lib/prisma/client';
import { VideoUploadForm } from '@/components/admin/VideoUploadForm';

export default async function AdminUploadVideoPage() {
  const [categories, providers] = await Promise.all([
    prisma.category.findMany({ where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.storageProvider.findMany({ where: { isEnabled: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Upload AI Video</h1>
      <p className="mt-1 mb-6 text-sm text-slate-400">
        Videos are automatically queued for FFmpeg adaptive HLS transcoding (360p, 480p, 720p) and thumbnail extraction.
      </p>
      <VideoUploadForm
        categories={categories.map((c) => ({ id: c.id, name: c.nameEn }))}
        providers={providers.map((p) => ({ id: p.id, name: `${p.name} (${p.type})` }))}
      />
    </div>
  );
}
