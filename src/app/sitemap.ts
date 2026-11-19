import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Strictly include ONLY PUBLIC & PUBLISHED videos in sitemap
  const videos = await prisma.video.findMany({
    where: { visibility: 'PUBLIC', isPublished: true, deletedAt: null },
    select: { slug: true, updatedAt: true },
    take: 5000,
  });

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/videos`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    ...videos.map((v) => ({
      url: `${baseUrl}/watch/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
