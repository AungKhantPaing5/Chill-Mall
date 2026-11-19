import { Readable } from 'stream';

export interface StorageObjectMetadata {
  sizeBytes: number;
  contentType?: string;
  etag?: string;
  lastModified?: Date;
}

export interface StorageUploadInput {
  objectKey: string;
  body: Buffer | Readable;
  contentType: string;
  sizeBytes?: number;
}

export interface IStorageProvider {
  readonly providerId: string;
  readonly type: 'LOCAL' | 'S3' | 'R2' | 'S3_COMPATIBLE';

  upload(input: StorageUploadInput): Promise<{ objectKey: string; sizeBytes: number }>;
  getStream(objectKey: string, range?: { start: number; end?: number }): Promise<Readable>;
  delete(objectKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
  getMetadata(objectKey: string): Promise<StorageObjectMetadata | null>;
  createSignedUrl(objectKey: string, expiresInSeconds: number): Promise<string>;
  testConnection(): Promise<{ ok: boolean; message: string }>;
}
