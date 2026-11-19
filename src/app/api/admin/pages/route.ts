import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { pageId, language, title, contentHtml } = await req.json();

  await prisma.pageTranslation.upsert({
    where: { pageId_language: { pageId, language } },
    update: { title, contentHtml, revision: { increment: 1 } },
    create: { pageId, language, title, contentHtml },
  });

  return NextResponse.json({ ok: true });
}
