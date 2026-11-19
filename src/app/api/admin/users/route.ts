import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RoleName, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';
import { hashPassword } from '@/lib/auth/password';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(80),
  username: z.string().min(2).max(40).optional().or(z.literal('')),
  roleName: z.nativeEnum(RoleName).default('USER'),
});

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdminRole(currentUser.roles)) {
    return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // 1. CREATE NEW USER
    if (body.action === 'CREATE_USER') {
      const parsed = createUserSchema.parse(body);
      const email = parsed.email.toLowerCase().trim();
      const username = parsed.username?.trim() || null;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email is already registered.' }, { status: 409 });
      }

      if (username) {
        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
          return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
        }
      }

      const passwordHash = await hashPassword(parsed.password);
      const role = await prisma.role.findUniqueOrThrow({ where: { name: parsed.roleName } });

      const created = await prisma.user.create({
        data: {
          email,
          username,
          name: parsed.name.trim(),
          passwordHash,
          emailVerified: new Date(),
          status: UserStatus.ACTIVE,
          roles: { create: { roleId: role.id } },
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'ADMIN_CREATE_USER',
          entityType: 'User',
          entityId: created.id,
          metadata: { email, role: parsed.roleName },
        },
      });

      return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
    }

    // 2. EDIT USER DETAILS / RESET PASSWORD
    if (body.action === 'EDIT_USER') {
      const targetId = String(body.userId || '');
      const name = String(body.name || '').trim();
      const email = String(body.email || '').toLowerCase().trim();
      const username = String(body.username || '').trim() || null;
      const newPassword = String(body.newPassword || '').trim();

      if (!targetId || !name || !email) {
        return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
      }

      const updateData: {
        name: string;
        email: string;
        username: string | null;
        passwordHash?: string;
      } = { name, email, username };

      if (newPassword) {
        if (newPassword.length < 8) {
          return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
        }
        updateData.passwordHash = await hashPassword(newPassword);
      }

      await prisma.user.update({
        where: { id: targetId },
        data: updateData,
      });

      if (body.roleName && targetId !== currentUser.id) {
        const role = await prisma.role.findUniqueOrThrow({ where: { name: body.roleName as RoleName } });
        await prisma.$transaction([
          prisma.userRole.deleteMany({ where: { userId: targetId } }),
          prisma.userRole.create({ data: { userId: targetId, roleId: role.id } }),
        ]);
      }

      return NextResponse.json({ ok: true });
    }

    // 3. SOFT DELETE USER
    if (body.action === 'DELETE_USER') {
      const targetId = String(body.userId || '');
      if (targetId === currentUser.id) {
        return NextResponse.json({ error: 'Cannot delete your own active admin account.' }, { status: 400 });
      }
      await prisma.$transaction([
        prisma.session.deleteMany({ where: { userId: targetId } }),
        prisma.user.update({
          where: { id: targetId },
          data: { deletedAt: new Date(), status: UserStatus.DELETED },
        }),
      ]);
      return NextResponse.json({ ok: true });
    }

    // 4. TOGGLE ROLE PERMISSION
    if (body.action === 'TOGGLE_ROLE_PERMISSION') {
      const roleId = String(body.roleId || '');
      const permissionId = String(body.permissionId || '');
      const enabled = Boolean(body.enabled);

      if (enabled) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        });
      } else {
        await prisma.rolePermission.deleteMany({
          where: { roleId, permissionId },
        });
      }

      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'ROLE_PERMISSION_UPDATED',
          entityType: 'Role',
          entityId: roleId,
          metadata: { permissionId, enabled },
        },
      });

      return NextResponse.json({ ok: true });
    }

    // 5. GRANT / REVOKE PRIVATE VIDEO ACCESS PERMISSION
    if (body.action === 'GRANT_VIDEO_ACCESS') {
      const userId = String(body.userId || '');
      const videoId = String(body.videoId || '');
      if (!userId || !videoId) {
        return NextResponse.json({ error: 'User and video are required.' }, { status: 400 });
      }
      await prisma.videoAccess.upsert({
        where: { videoId_userId: { videoId, userId } },
        update: {},
        create: { videoId, userId },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'REVOKE_VIDEO_ACCESS') {
      const userId = String(body.userId || '');
      const videoId = String(body.videoId || '');
      await prisma.videoAccess.deleteMany({ where: { videoId, userId } });
      return NextResponse.json({ ok: true });
    }

    // 6. QUICK ROLE OR STATUS UPDATE
    if (body.userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot modify your own active admin account here.' }, { status: 400 });
    }

    if (body.status) {
      await prisma.user.update({
        where: { id: body.userId },
        data: { status: body.status as UserStatus },
      });
      if (body.status === 'SUSPENDED') {
        await prisma.session.deleteMany({ where: { userId: body.userId } });
      }
    }

    if (body.roleName) {
      const role = await prisma.role.findUniqueOrThrow({ where: { name: body.roleName as RoleName } });
      await prisma.$transaction([
        prisma.userRole.deleteMany({ where: { userId: body.userId } }),
        prisma.userRole.create({ data: { userId: body.userId, roleId: role.id } }),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
