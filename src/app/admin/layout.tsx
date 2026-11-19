import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';
import { AdminLoginGate } from '@/components/admin/AdminLoginGate';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    return <AdminLoginGate />;
  }
  if (!isAdminRole(user.roles)) {
    return <AdminLoginGate wrongRole />;
  }

  return (
    <div className="min-h-screen bg-bg-main text-slate-100">
      <AdminSidebar userEmail={user.email} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
