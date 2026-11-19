import crypto from 'crypto';

function getSecret(): string {
  return process.env.STREAM_SIGNING_SECRET || 'dev-only-change-in-production-secret';
}

export function createStreamToken(videoId: string, expiresInSeconds = 3600): { token: string; exp: number } {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${videoId}:${exp}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return { token: sig, exp };
}

export function verifyStreamToken(videoId: string, token: string | null, expStr: string | null): boolean {
  if (!token || !expStr) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }
  const payload = `${videoId}:${exp}`;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
