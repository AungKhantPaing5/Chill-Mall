import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';
import { enqueueTranscodeJob } from '@/lib/queue/video-queue';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await req.json();

  if (body.action === 'RETRY_TRANSCODE') {
    await prisma.video.update({ where: { id }, data: { processingStatus: 'QUEUED' } });
    await enqueueTranscodeJob(id);
    return NextResponse.json({ ok: true });
  }

  const video = await prisma.video.update({
    where: { id },
    data: {
      ...(body.visibility ? { visibility: body.visibility } : {}),
      ...(typeof body.isPublished === 'boolean' ? { isPublished: body.isPublished } : {}),
      ...(typeof body.isFeatured === 'boolean' ? { isFeatured: body.isFeatured } : {}),
      ...(body.title ? { title: String(body.title) } : {}),
    },
  });

  return NextResponse.json({ ok: true, id: video.id });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await context.params;
  await prisma.video.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false } });
  return NextResponse.json({ ok: true });
}
