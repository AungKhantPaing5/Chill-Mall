import { describe, it, expect } from 'vitest';
import { createStreamToken, verifyStreamToken } from '@/lib/security/signed-url';

describe('Protected HLS Signed Stream Tokens', () => {
  it('verifies a valid non-expired token', () => {
    const { token, exp } = createStreamToken('vid-123', 300);
    expect(verifyStreamToken('vid-123', token, String(exp))).toBe(true);
  });

  it('rejects token for mismatched videoId', () => {
    const { token, exp } = createStreamToken('vid-123', 300);
    expect(verifyStreamToken('vid-999', token, String(exp))).toBe(false);
  });

  it('rejects expired tokens', () => {
    const { token, exp } = createStreamToken('vid-123', -10);
    expect(verifyStreamToken('vid-123', token, String(exp))).toBe(false);
  });
});
