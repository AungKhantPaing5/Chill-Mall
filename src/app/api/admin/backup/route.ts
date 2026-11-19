import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [users, videos, categories, settings] = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.category.count(),
    prisma.siteSetting.findMany(),
  ]);

  const snapshot = {
    exportedAt: new Date().toISOString(),
    counts: { users, videos, categories },
    settings,
  };
  const jsonStr = JSON.stringify(snapshot, null, 2);
  const fileName = `chillmall-config-metadata-${Date.now()}.json`;

  await prisma.backupRecord.create({
    data: {
      type: 'METADATA',
      status: 'COMPLETED',
      fileName,
      sizeBytes: BigInt(Buffer.byteLength(jsonStr)),
      notes: 'Manual metadata/config snapshot (secrets excluded)',
    },
  });

  return new NextResponse(jsonStr, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
