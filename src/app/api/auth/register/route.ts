import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma/client';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email is already registered.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);
    const userRole = await prisma.role.findUniqueOrThrow({ where: { name: 'USER' } });

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name.trim(),
        passwordHash,
        roles: { create: { roleId: userRole.id } },
      },
    });

    await createSession(user.id);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 400 });
  }
}
