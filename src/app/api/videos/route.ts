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

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const visibility = String(formData.get('visibility') || 'PUBLIC') as any;
    const storageProviderId = String(formData.get('storageProviderId') || '').trim();
    const categoryId = String(formData.get('categoryId') || '').trim() || null;
    const isFeatured = formData.get('isFeatured') === 'true';
    const seoTitle = String(formData.get('seoTitle') || '').trim() || null;
    const seoDescription = String(formData.get('seoDescription') || '').trim() || null;
    const aiDisclosureText = String(formData.get('aiDisclosureText') || '').trim() || null;
    const tagsRaw = String(formData.get('tags') || '').trim();

    if (!file || !title) {
      return NextResponse.json({ error: 'Title and video file are required.' }, { status: 400 });
    }
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Invalid MIME type. Only video files are allowed.' }, { status: 400 });
    }

    const providerRecord = storageProviderId
      ? await prisma.storageProvider.findUniqueOrThrow({ where: { id: storageProviderId } })
      : await prisma.storageProvider.findFirstOrThrow({ where: { isDefault: true } });

    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'ai-video';
    const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
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
        description: description || null,
        visibility,
        unlistedToken: visibility === 'UNLISTED' ? crypto.randomBytes(16).toString('hex') : null,
        processingStatus: 'QUEUED',
        isPublished: true,
        isFeatured,
        isAiGenerated: true,
        aiDisclosureText,
        seoTitle,
        seoDescription,
        publishedAt: new Date(),
        categoryId,
        storageProviderId: providerRecord.id,
        originalObjectKey: objectKey,
        uploaderId: user.id,
      },
    });

    if (tagsRaw) {
      const tagNames = [...new Set(tagsRaw.split(',').map((t) => t.trim()).filter(Boolean))];
      for (const name of tagNames) {
        const tagSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (!tagSlug) continue;
        const tag = await prisma.tag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { slug: tagSlug, name },
        });
        await prisma.videoTag.create({ data: { videoId: video.id, tagId: tag.id } });
      }
    }

    await enqueueTranscodeJob(video.id);
    return NextResponse.json({ video: { id: video.id, slug: video.slug } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
