import { describe, it, expect } from 'vitest';
import { canWatchVideo } from '@/lib/auth/rbac';

describe('Video Access Control (RBAC)', () => {
  it('allows guests to watch PUBLIC published videos', () => {
    expect(
      canWatchVideo(
        { visibility: 'PUBLIC', isPublished: true, unlistedToken: null, allowedUserIds: [] },
        null
      )
    ).toBe(true);
  });

  it('blocks unauthorized users from PRIVATE videos', () => {
    expect(
      canWatchVideo(
        { visibility: 'PRIVATE', isPublished: true, unlistedToken: null, allowedUserIds: ['u-1'] },
        { id: 'u-2', roles: ['USER'] }
      )
    ).toBe(false);
  });

  it('allows explicitly permitted users to watch PRIVATE videos', () => {
    expect(
      canWatchVideo(
        { visibility: 'PRIVATE', isPublished: true, unlistedToken: null, allowedUserIds: ['u-1'] },
        { id: 'u-1', roles: ['USER'] }
      )
    ).toBe(true);
  });

  it('requires valid token for UNLISTED videos', () => {
    const target = { visibility: 'UNLISTED' as const, isPublished: true, unlistedToken: 'secret-123', allowedUserIds: [] };
    expect(canWatchVideo(target, null, 'wrong')).toBe(false);
    expect(canWatchVideo(target, null, 'secret-123')).toBe(true);
  });

  it('restricts ADMIN_ONLY videos strictly to ADMIN/SUPER_ADMIN', () => {
    const target = { visibility: 'ADMIN_ONLY' as const, isPublished: true, unlistedToken: null, allowedUserIds: [] };
    expect(canWatchVideo(target, { id: 'u-1', roles: ['USER'] })).toBe(false);
    expect(canWatchVideo(target, { id: 'a-1', roles: ['ADMIN'] })).toBe(true);
  });
});
