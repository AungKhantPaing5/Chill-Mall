import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import type { IStorageProvider, StorageObjectMetadata, StorageUploadInput } from './types';

export class LocalStorageProvider implements IStorageProvider {
  readonly type = 'LOCAL' as const;

  constructor(
    public readonly providerId: string,
    private readonly baseDir: string
  ) {}

  private resolveSafePath(objectKey: string): string {
    const cleanKey = objectKey.replace(/^\/+/, '');
    const resolved = path.resolve(this.baseDir, cleanKey);
    const root = path.resolve(this.baseDir);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      throw new Error('Path traversal attempt blocked.');
    }
    return resolved;
  }

  async upload(input: StorageUploadInput) {
    const dest = this.resolveSafePath(input.objectKey);
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });

    if (Buffer.isBuffer(input.body)) {
      await fs.promises.writeFile(dest, input.body);
    } else {
      await pipeline(input.body, fs.createWriteStream(dest));
    }

    const stat = await fs.promises.stat(dest);
    return { objectKey: input.objectKey, sizeBytes: stat.size };
  }

  async getStream(objectKey: string, range?: { start: number; end?: number }): Promise<Readable> {
    const filePath = this.resolveSafePath(objectKey);
    return fs.createReadStream(filePath, range ? { start: range.start, end: range.end } : undefined);
  }

  async delete(objectKey: string): Promise<void> {
    const filePath = this.resolveSafePath(objectKey);
    await fs.promises.rm(filePath, { force: true });
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      await fs.promises.access(this.resolveSafePath(objectKey));
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(objectKey: string): Promise<StorageObjectMetadata | null> {
    try {
      const stat = await fs.promises.stat(this.resolveSafePath(objectKey));
      return { sizeBytes: stat.size, lastModified: stat.mtime };
    } catch {
      return null;
    }
  }

  async createSignedUrl(objectKey: string): Promise<string> {
    return `/api/media/${encodeURIComponent(objectKey)}`;
  }

  async testConnection() {
    try {
      await fs.promises.mkdir(this.baseDir, { recursive: true });
      await fs.promises.access(this.baseDir, fs.constants.R_OK | fs.constants.W_OK);
      return { ok: true, message: `Local storage writable at ${this.baseDir}` };
    } catch (err: any) {
      return { ok: false, message: err.message };
    }
  }
}
