import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { redis } from '@/lib/redis/client';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return NextResponse.json({ status: 'ok', service: 'chill-mall', timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ status: 'degraded', error: err.message }, { status: 503 });
  }
}
