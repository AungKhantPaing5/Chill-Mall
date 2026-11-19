import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import type { IStorageProvider, StorageObjectMetadata, StorageUploadInput } from './types';

export interface S3Config {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  type: 'S3' | 'R2' | 'S3_COMPATIBLE';
}

export class S3StorageProvider implements IStorageProvider {
  readonly type: 'S3' | 'R2' | 'S3_COMPATIBLE';
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(public readonly providerId: string, config: S3Config) {
    this.type = config.type;
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: config.endpoint || undefined,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: Boolean(config.endpoint),
    });
  }

  async upload(input: StorageUploadInput) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        Body: input.body,
        ContentType: input.contentType,
      })
    );
    const meta = await this.getMetadata(input.objectKey);
    return { objectKey: input.objectKey, sizeBytes: meta?.sizeBytes ?? input.sizeBytes ?? 0 };
  }

  async getStream(objectKey: string, range?: { start: number; end?: number }): Promise<Readable> {
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Range: range ? `bytes=${range.start}-${range.end ?? ''}` : undefined,
      })
    );
    return res.Body as Readable;
  }

  async delete(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }

  async exists(objectKey: string): Promise<boolean> {
    return (await this.getMetadata(objectKey)) !== null;
  }

  async getMetadata(objectKey: string): Promise<StorageObjectMetadata | null> {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
      return {
        sizeBytes: head.ContentLength ?? 0,
        contentType: head.ContentType,
        etag: head.ETag,
        lastModified: head.LastModified,
      };
    } catch {
      return null;
    }
  }

  async createSignedUrl(objectKey: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: expiresInSeconds }
    );
  }

  async testConnection() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { ok: true, message: `Connected to bucket ${this.bucket}` };
    } catch (err: any) {
      return { ok: false, message: err.message };
    }
  }
}
