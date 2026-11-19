import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';

const eventSchema = z.object({
  eventType: z.enum(['PAGE_VIEW', 'VIDEO_VIEW', 'WATCH_HEARTBEAT', 'VIDEO_COMPLETE']),
  videoId: z.string().optional(),
  path: z.string().optional(),
  watchSeconds: z.number().int().min(0).max(86400).optional(),
});

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  if (/bot|crawler|spider|headless/i.test(ua)) {
    return NextResponse.json({ ignored: true });
  }

  try {
    const data = eventSchema.parse(await req.json());
    const user = await getCurrentUser();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const sessionHash = crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 24);

    await prisma.analyticsEvent.create({
      data: {
        eventType: data.eventType,
        videoId: data.videoId,
        userId: user?.id,
        sessionHash,
        path: data.path,
        watchSeconds: data.watchSeconds,
      },
    });

    if (data.eventType === 'VIDEO_VIEW' && data.videoId) {
      await prisma.video.update({
        where: { id: data.videoId },
        data: { viewsCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
  }
}
