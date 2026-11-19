import { prisma } from '@/lib/prisma/client';
import { StorageClient } from '@/components/admin/StorageClient';

export default async function AdminStoragePage() {
  const [providers, videos] = await Promise.all([
    prisma.storageProvider.findMany(),
    prisma.video.findMany({ where: { deletedAt: null }, select: { id: true, title: true, storageProviderId: true }, take: 50 }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dual / Hybrid Storage Management</h1>
      <StorageClient providers={providers} videos={videos} />
    </div>
  );
}
