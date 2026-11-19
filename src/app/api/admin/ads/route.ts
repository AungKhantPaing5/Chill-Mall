import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();

  if (body.action === 'TOGGLE_PLACEMENT') {
    await prisma.adPlacement.update({
      where: { id: body.id },
      data: { isEnabled: Boolean(body.isEnabled) },
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.adSettings.upsert({
    where: { id: 'singleton' },
    update: {
      adsEnabled: Boolean(body.adsEnabled),
      adsenseEnabled: Boolean(body.adsenseEnabled),
      adsensePublisherId: body.adsensePublisherId || null,
      adsenseClientId: body.adsenseClientId || null,
    },
    create: {
      id: 'singleton',
      adsEnabled: Boolean(body.adsEnabled),
      adsenseEnabled: Boolean(body.adsenseEnabled),
      adsensePublisherId: body.adsensePublisherId || null,
      adsenseClientId: body.adsenseClientId || null,
    },
  });

  return NextResponse.json({ ok: true });
}
