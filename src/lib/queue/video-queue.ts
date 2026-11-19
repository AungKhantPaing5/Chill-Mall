import { Queue } from 'bullmq';
import { redis } from '@/lib/redis/client';

export const VIDEO_QUEUE_NAME = 'chillmall-video-processing';

export const videoProcessingQueue = new Queue(VIDEO_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export async function enqueueTranscodeJob(videoId: string) {
  return videoProcessingQueue.add('transcode-hls', { videoId }, { jobId: `transcode-${videoId}` });
}
