import crypto from 'crypto';
import { prisma } from '@/lib/prisma/client';
import { LocalStorageProvider } from './local-provider';
import { S3StorageProvider } from './s3-provider';
import type { IStorageProvider } from './types';

export async function getStorageProviderById(providerId: string): Promise<IStorageProvider> {
  const record = await prisma.storageProvider.findUniqueOrThrow({ where: { id: providerId } });

  if (record.type === 'LOCAL') {
    return new LocalStorageProvider(record.id, record.localPath || process.env.LOCAL_STORAGE_PATH || '/data/media');
  }

  return new S3StorageProvider(record.id, {
    type: record.type,
    endpoint: record.endpoint || process.env.S3_ENDPOINT,
    region: record.region || process.env.S3_REGION || 'auto',
    bucket: record.bucket || process.env.S3_BUCKET || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  });
}

async function hashStream(stream: NodeJS.ReadableStream): Promise<{ hash: string; size: number }> {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    let size = 0;
    stream.on('data', (chunk: Buffer) => {
      size += chunk.length;
      h.update(chunk);
    });
    stream.on('end', () => resolve({ hash: h.digest('hex'), size }));
    stream.on('error', reject);
  });
}

/**
 * Safe Hybrid Storage Migration:
 * 1. Copies object from source -> target
 * 2. Verifies destination existence + SHA-256 integrity
 * 3. Updates DB pointer in transaction
 * 4. Only deletes source AFTER verification succeeds
 */
export async function migrateVideoStorage(videoId: string, targetProviderId: string, actorUserId: string) {
  const video = await prisma.video.findUniqueOrThrow({ where: { id: videoId } });
  if (video.storageProviderId === targetProviderId) {
    throw new Error('Video is already stored in the target provider.');
  }

  const source = await getStorageProviderById(video.storageProviderId);
  const target = await getStorageProviderById(targetProviderId);

  const keysToMigrate = [video.originalObjectKey, video.thumbnailKey].filter(Boolean) as string[];

  for (const key of keysToMigrate) {
    const srcHash = await hashStream(await source.getStream(key));
    const uploadStream = await source.getStream(key);
    await target.upload({
      objectKey: key,
      body: uploadStream,
      contentType: key.endsWith('.jpg') ? 'image/jpeg' : 'video/mp4',
    });

    const destHash = await hashStream(await target.getStream(key));
    if (srcHash.hash !== destHash.hash || srcHash.size !== destHash.size) {
      throw new Error(`Migration integrity verification failed for ${key}. Source file preserved.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.video.update({
      where: { id: video.id },
      data: { storageProviderId: targetProviderId },
    });
    await tx.activityLog.create({
      data: {
        userId: actorUserId,
        action: 'VIDEO_STORAGE_MIGRATED',
        entityType: 'Video',
        entityId: video.id,
        metadata: { from: video.storageProviderId, to: targetProviderId, verifiedKeys: keysToMigrate },
      },
    });
  });

  // Only remove source files after DB update & integrity verification succeeded
  for (const key of keysToMigrate) {
    await source.delete(key);
  }
}
