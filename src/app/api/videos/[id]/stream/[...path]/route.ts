import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { canWatchVideo } from '@/lib/auth/rbac';
import { verifyStreamToken } from '@/lib/security/signed-url';
import { getStorageProviderById } from '@/lib/storage/manager';

/**
 * Protected HLS Playlist & Segment Streaming Endpoint
 * Enforces server-side visibility authorization AND short-lived signed tokens.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path: pathParts } = await context.params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const exp = searchParams.get('exp');
  const unlisted = searchParams.get('u');

  const video = await prisma.video.findUnique({
    where: { id },
    include: { allowedUsers: { select: { userId: true } } },
  });

  if (!video || video.deletedAt) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const user = await getCurrentUser();
  const hasAccess = canWatchVideo(
    {
      visibility: video.visibility,
      isPublished: video.isPublished,
      unlistedToken: video.unlistedToken,
      allowedUserIds: video.allowedUsers.map((a) => a.userId),
    },
    user,
    unlisted
  );

  // For non-public videos, require BOTH authorization and a valid signed stream token
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (video.visibility !== 'PUBLIC' && !verifyStreamToken(video.id, token, exp)) {
    return NextResponse.json({ error: 'Invalid or expired stream token' }, { status: 403 });
  }

  const relativePath = pathParts.join('/');
  if (relativePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const objectKey = `videos/${video.id}/hls/${relativePath}`;
  const provider = await getStorageProviderById(video.storageProviderId);
  if (!(await provider.exists(objectKey))) {
    return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
  }

  const stream = await provider.getStream(objectKey);
  const contentType = relativePath.endsWith('.m3u8')
    ? 'application/vnd.apple.mpegurl'
    : 'video/MP2T';

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': video.visibility === 'PUBLIC' ? 'public, max-age=300' : 'private, no-store',
    },
  });
}
