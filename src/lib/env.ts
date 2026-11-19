import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  STREAM_SIGNING_SECRET: z.string().min(16),
  APP_URL: z.string().url().default('http://localhost:3000'),
  STORAGE_MODE: z.enum(['local', 'cloud', 'hybrid']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('/data/media'),
  TMP_PROCESSING_PATH: z.string().default('/data/tmp'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_CDN_URL: z.string().optional(),
});

export function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Missing or invalid required environment variables.');
  }
  return parsed.data;
}
