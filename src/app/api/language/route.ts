import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE_NAME, locales, type Locale } from '@/i18n/config';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma/client';

export async function POST(req: Request) {
  const { locale } = (await req.json()) as { locale: string };
  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  const user = await getCurrentUser();
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { preferredLanguage: locale } });
  }

  return NextResponse.json({ ok: true, locale });
}
