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

  if (body.action === 'TOGGLE') {
    await prisma.category.update({
      where: { id: body.id },
      data: { isEnabled: Boolean(body.isEnabled) },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'DELETE') {
    await prisma.category.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  const nameEn = String(body.nameEn || '').trim();
  const nameMy = String(body.nameMy || nameEn).trim();
  const slug =
    String(body.slug || nameEn)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `cat-${Date.now()}`;

  if (!nameEn) {
    return NextResponse.json({ error: 'English name is required' }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { nameEn, nameMy, slug, description: body.description || null },
  });
  return NextResponse.json({ category }, { status: 201 });
}
