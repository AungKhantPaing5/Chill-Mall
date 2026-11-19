import Database from 'better-sqlite3';
import { PrismaClient, VideoVisibility, ProcessingStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--execute');
const SQLITE_PATH = process.env.LEGACY_SQLITE_PATH || './backups/legacy_backup.db';
const LEGACY_MEDIA_ROOT = process.env.LEGACY_MEDIA_PATH || '/opt/chillmal-legacy/media';
const NEW_MEDIA_ROOT = process.env.LOCAL_STORAGE_PATH || '/data/media';

function sha256File(filePath: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function copyAndVerifyFile(srcPath: string, destPath: string) {
  if (!fs.existsSync(srcPath)) return null;
  const srcHash = sha256File(srcPath);
  const stat = fs.statSync(srcPath);
  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    if (sha256File(destPath) !== srcHash) {
      throw new Error(`Checksum mismatch: ${srcPath}`);
    }
  }
  return { sizeBytes: BigInt(stat.size), checksum: srcHash };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `item-${Date.now()}`;
}

async function main() {
  console.log(`CHILL MALL LEGACY MIGRATION (${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'})`);
  if (!fs.existsSync(SQLITE_PATH)) {
    throw new Error(`Legacy SQLite DB not found at ${SQLITE_PATH}`);
  }
  const legacyDb = new Database(SQLITE_PATH, { readonly: true, fileMustExist: true });
  const tables = legacyDb
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  console.log('Detected Legacy Tables:', tables.map((t) => t.name).join(', '));

  const localProvider = await prisma.storageProvider.findFirst({ where: { type: 'LOCAL' } });
  const fallbackUploader = await prisma.user.findFirst();

  let migratedVideos = 0;
  if (tables.some((t) => t.name === 'videos' || t.name === 'video')) {
    const vidTable = tables.some((t) => t.name === 'videos') ? 'videos' : 'video';
    const rows = legacyDb.prepare(`SELECT * FROM "${vidTable}"`).all() as any[];
    for (const v of rows) {
      const slug = v.slug || `${slugify(v.title || 'video')}-${v.id}`;
      const rel = v.file_path || v.video_path || v.filename;
      if (!rel) continue;
      const src = path.join(LEGACY_MEDIA_ROOT, rel);
      const key = `legacy/videos/${slug}${path.extname(rel)}`;
      const verified = copyAndVerifyFile(src, path.join(NEW_MEDIA_ROOT, key));
      if (!verified) continue;

      if (!DRY_RUN && localProvider && fallbackUploader) {
        await prisma.video.upsert({
          where: { slug },
          update: {},
          create: {
            slug,
            title: v.title || 'Untitled Video',
            description: v.description || null,
            visibility: v.is_private ? VideoVisibility.PRIVATE : VideoVisibility.PUBLIC,
            processingStatus: ProcessingStatus.PENDING,
            isPublished: Boolean(v.is_published ?? true),
            storageProviderId: localProvider.id,
            originalObjectKey: key,
            uploaderId: fallbackUploader.id,
          },
        });
      }
      migratedVideos++;
    }
  }
  legacyDb.close();
  console.log(`Processed videos: ${migratedVideos}`);
}

main().finally(() => prisma.$disconnect());
