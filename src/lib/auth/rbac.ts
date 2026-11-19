import type { RoleName, VideoVisibility } from '@prisma/client';

export interface AuthUserContext {
  id: string;
  roles: RoleName[];
}

export interface VideoAccessTarget {
  visibility: VideoVisibility;
  isPublished: boolean;
  unlistedToken: string | null;
  allowedUserIds: string[];
}

export function isAdminRole(roles: RoleName[]): boolean {
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
}

export function canWatchVideo(
  video: VideoAccessTarget,
  user: AuthUserContext | null,
  providedUnlistedToken?: string | null
): boolean {
  // Admins & Super Admins can always inspect/watch videos
  if (user && isAdminRole(user.roles)) {
    return true;
  }

  if (!video.isPublished) {
    return false;
  }

  switch (video.visibility) {
    case 'PUBLIC':
      return true;
    case 'UNLISTED':
      return Boolean(video.unlistedToken && providedUnlistedToken === video.unlistedToken);
    case 'PRIVATE':
      if (!user) return false;
      return video.allowedUserIds.includes(user.id);
    case 'ADMIN_ONLY':
      return false;
    default:
      return false;
  }
}
