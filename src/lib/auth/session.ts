import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma/client';

export const SESSION_COOKIE_NAME = 'chillmall_session';
const SESSION_TTL_DAYS = 14;

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { sessionToken, userId, expires, ipAddress, userAgent },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });

  return sessionToken;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        include: {
          roles: { include: { role: true } },
        },
      },
    },
  });

  if (!session || session.expires < new Date() || session.user.status !== 'ACTIVE') {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    username: session.user.username,
    preferredLanguage: session.user.preferredLanguage,
    roles: session.user.roles.map((r) => r.role.name),
  };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
