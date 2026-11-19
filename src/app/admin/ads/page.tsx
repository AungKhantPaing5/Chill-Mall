import { prisma } from '@/lib/prisma/client';
import { AdsClient } from '@/components/admin/AdsClient';

export default async function AdminAdsPage() {
  const [settings, placements] = await Promise.all([
    prisma.adSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.adPlacement.findMany(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Google AdSense & Advertisement Management</h1>
      <AdsClient settings={settings} placements={placements} />
    </div>
  );
}
