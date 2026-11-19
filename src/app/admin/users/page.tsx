import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from '@/lib/auth/session';
import { UsersClient } from '@/components/admin/UsersClient';

const DEFAULT_PERMISSIONS = [
  { code: 'video:upload', description: 'Upload new AI videos' },
  { code: 'video:edit', description: 'Edit, publish, unpublish, and feature videos' },
  { code: 'video:delete', description: 'Delete videos' },
  { code: 'category:manage', description: 'Create and manage video categories & tags' },
  { code: 'storage:manage', description: 'Configure storage providers and migrate media' },
  { code: 'ads:manage', description: 'Configure Google AdSense and ad placements' },
  { code: 'user:manage', description: 'Create, edit, suspend users and assign permissions' },
  { code: 'page:manage', description: 'Edit bilingual CMS and legal pages' },
  { code: 'analytics:view', description: 'View platform analytics and reports' },
  { code: 'backup:manage', description: 'Export metadata and manage backups' },
];

export default async function AdminUsersPage() {
  const currentAdmin = await getCurrentUser();

  // Ensure default permissions exist in DB
  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

  const [users, roles, permissions, privateVideos] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        roles: { include: { role: true } },
        privateAccess: { select: { videoId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.role.findMany({
      where: { name: { in: ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] } },
      include: { permissions: { select: { permissionId: true } } },
    }),
    prisma.permission.findMany({ orderBy: { code: 'asc' } }),
    prisma.video.findMany({
      where: { visibility: 'PRIVATE', deletedAt: null },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User, Role & Permission Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create user accounts, manage roles/passwords, configure role permissions, and grant private video watch access.
        </p>
      </div>

      <UsersClient
        currentAdminId={currentAdmin?.id || ''}
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          username: u.username,
          name: u.name,
          status: u.status,
          role: u.roles[0]?.role.name || 'USER',
          createdAt: u.createdAt.toISOString().slice(0, 10),
          privateVideoIds: u.privateAccess.map((pa) => pa.videoId),
        }))}
        roles={roles.map((r) => ({
          id: r.id,
          name: r.name,
          permissionIds: r.permissions.map((p) => p.permissionId),
        }))}
        permissions={permissions}
        privateVideos={privateVideos}
      />
    </div>
  );
}
