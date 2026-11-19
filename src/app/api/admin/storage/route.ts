import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';
import { getStorageProviderById } from '@/lib/storage/manager';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();

  if (body.action === 'TEST') {
    const provider = await getStorageProviderById(body.id);
    const result = await provider.testConnection();
    return NextResponse.json(result);
  }

  if (body.action === 'SET_DEFAULT') {
    await prisma.$transaction([
      prisma.storageProvider.updateMany({ data: { isDefault: false } }),
      prisma.storageProvider.update({ where: { id: body.id }, data: { isDefault: true } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const provider = await prisma.storageProvider.create({
    data: {
      name: String(body.name),
      type: body.type,
      endpoint: body.endpoint || null,
      region: body.region || 'auto',
      bucket: body.bucket || null,
      localPath: body.localPath || null,
      cdnUrl: body.cdnUrl || null,
      isEnabled: true,
    },
  });

  return NextResponse.json({ provider }, { status: 201 });
}
