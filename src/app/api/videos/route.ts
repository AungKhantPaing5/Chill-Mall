import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';
import { getStorageProviderById } from '@/lib/storage/manager';
import { enqueueTranscodeJob } from '@/lib/queue/video-queue';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const category = searchParams.get('category')?.trim();

  const videos = await prisma.video.findMany({
    where: {
      visibility: 'PUBLIC',
      isPublished: true,
      deletedAt: null,
      ...(category ? { category: { slug: category } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });

  return NextResponse.json({ videos });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const visibility = String(formData.get('visibility') || 'PUBLIC') as any;
  const storageProviderId = String(formData.get('storageProviderId') || '');

  if (!file || !title) {
    return NextResponse.json({ error: 'Title and video file are required.' }, { status: 400 });
  }
  if (!file.type.startsWith('video/')) {
    return NextResponse.json({ error: 'Invalid MIME type. Only video files are allowed.' }, { status: 400 });
  }

  const providerRecord = storageProviderId
    ? await prisma.storageProvider.findUniqueOrThrow({ where: { id: storageProviderId } })
    : await prisma.storageProvider.findFirstOrThrow({ where: { isDefault: true } });

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
  const objectKey = `uploads/${slug}.mp4`;

  const provider = await getStorageProviderById(providerRecord.id);
  const webStream = file.stream() as any;
  await provider.upload({
    objectKey,
    body: Readable.fromWeb(webStream),
    contentType: file.type,
    sizeBytes: file.size,
  });

  const video = await prisma.video.create({
    data: {
      slug,
      title,
      description,
      visibility,
      unlistedToken: visibility === 'UNLISTED' ? crypto.randomBytes(16).toString('hex') : null,
      processingStatus: 'QUEUED',
      isPublished: true,
      isAiGenerated: true,
      storageProviderId: providerRecord.id,
      originalObjectKey: objectKey,
      uploaderId: user.id,
    },
  });

  await enqueueTranscodeJob(video.id);
  return NextResponse.json({ video }, { status: 201 });
}
