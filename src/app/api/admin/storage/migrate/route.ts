import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/rbac';
import { migrateVideoStorage } from '@/lib/storage/manager';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { videoId, targetProviderId } = await req.json();
  try {
    await migrateVideoStorage(videoId, targetProviderId, user.id);
    return NextResponse.json({ ok: true, message: 'Migration verified and completed.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
