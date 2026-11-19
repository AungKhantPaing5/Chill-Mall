import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma/client';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const valid = await verifyPassword(user.passwordHash, body.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
