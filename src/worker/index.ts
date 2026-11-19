import { Worker, Job } from 'bullmq';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { prisma } from '@/lib/prisma/client';
import { redis } from '@/lib/redis/client';
import { getStorageProviderById } from '@/lib/storage/manager';
import { VIDEO_QUEUE_NAME } from '@/lib/queue/video-queue';

const TMP_ROOT = process.env.TMP_PROCESSING_PATH || '/data/tmp';

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
    });
  });
}

async function processTranscodeJob(job: Job<{ videoId: string }>) {
  const { videoId } = job.data;
  const workDir = path.join(TMP_ROOT, `job-${videoId}-${Date.now()}`);
  await fs.promises.mkdir(workDir, { recursive: true });

  try {
    const video = await prisma.video.findUniqueOrThrow({ where: { id: videoId } });
    const storage = await getStorageProviderById(video.storageProviderId);

    await prisma.video.update({
      where: { id: videoId },
      data: { processingStatus: 'PROCESSING' },
    });

    // 1. Stream original video from configured storage to temp disk (never buffer in RAM)
    const inputPath = path.join(workDir, 'input.mp4');
    await pipeline(await storage.getStream(video.originalObjectKey), fs.createWriteStream(inputPath));

    // 2. Generate thumbnail
    const thumbPath = path.join(workDir, 'thumb.jpg');
    await runFfmpeg(['-y', '-i', inputPath, '-ss', '00:00:02', '-vframes', '1', '-q:v', '2', thumbPath]);
    const thumbKey = `videos/${videoId}/thumb.jpg`;
    await storage.upload({
      objectKey: thumbKey,
      body: fs.createReadStream(thumbPath),
      contentType: 'image/jpeg',
    });

    // 3. Transcode HLS variants (720p & 480p baseline; extendable via profiles)
    const profiles = [
      { name: '720p', width: 1280, height: 720, bitrate: '2800k', kbps: 2800 },
      { name: '480p', width: 854, height: 480, bitrate: '1400k', kbps: 1400 },
      { name: '360p', width: 640, height: 360, bitrate: '800k', kbps: 800 },
    ];

    const masterLines = ['#EXTM3U', '#EXT-X-VERSION:3'];

    for (const p of profiles) {
      const variantDir = path.join(workDir, p.name);
      await fs.promises.mkdir(variantDir, { recursive: true });
      const playlistPath = path.join(variantDir, 'index.m3u8');

      await runFfmpeg([
        '-y',
        '-i', inputPath,
        '-vf', `scale=-2:${p.height}`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-b:v', p.bitrate,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(variantDir, 'seg_%03d.ts'),
        playlistPath,
      ]);

      // Upload all generated HLS segments and variant playlist
      const files = await fs.promises.readdir(variantDir);
      for (const f of files) {
        const key = `videos/${videoId}/hls/${p.name}/${f}`;
        await storage.upload({
          objectKey: key,
          body: fs.createReadStream(path.join(variantDir, f)),
          contentType: f.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T',
        });
      }

      const playlistKey = `videos/${videoId}/hls/${p.name}/index.m3u8`;
      await prisma.videoVariant.upsert({
        where: { videoId_resolution: { videoId, resolution: p.name } },
        update: { playlistKey, width: p.width, height: p.height, bitrateKbps: p.kbps },
        create: { videoId, resolution: p.name, width: p.width, height: p.height, bitrateKbps: p.kbps, playlistKey },
      });

      masterLines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${p.kbps * 1000},RESOLUTION=${p.width}x${p.height}`);
      masterLines.push(`${p.name}/index.m3u8`);
    }

    // 4. Upload HLS master playlist
    const masterKey = `videos/${videoId}/hls/master.m3u8`;
    await storage.upload({
      objectKey: masterKey,
      body: Buffer.from(masterLines.join('\n'), 'utf-8'),
      contentType: 'application/vnd.apple.mpegurl',
    });

    await prisma.video.update({
      where: { id: videoId },
      data: {
        processingStatus: 'COMPLETED',
        hlsMasterKey: masterKey,
        thumbnailKey: thumbKey,
      },
    });
  } catch (err: any) {
    await prisma.video.update({
      where: { id: videoId },
      data: { processingStatus: 'FAILED' },
    });
    throw err;
  } finally {
    // Always clean temporary files
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}

const worker = new Worker(VIDEO_QUEUE_NAME, processTranscodeJob, {
  connection: redis,
  concurrency: 1,
});

worker.on('completed', (job) => console.log(`[Worker] Completed job ${job.id}`));
worker.on('failed', (job, err) => console.error(`[Worker] Failed job ${job?.id}:`, err.message));

console.log('CHILL MALL FFmpeg Worker started and listening for jobs...');
