/**
 * The rules the offline queue follows, pinned as tests.
 *
 * Each one is here because it was wrong in a real run and cost something:
 * a submission silently discarded, or one person's voice counted twice. The
 * counter is the platform's central claim (A-4), so neither is cosmetic.
 *
 * The classification lives in apps/web/src/lib/voice-queue.ts; this mirrors it
 * so the API side documents the contract the client is held to.
 */
describe('queued voice retry semantics (§7 offline tolerance)', () => {
  const isFinalRefusal = (status: number | null): boolean => {
    if (status === null) return false; // never reached the server
    if (status === 429 || status >= 500) return false; // try again later
    return status >= 400 && status < 500; // the content itself was refused
  };

  it('keeps a voice when the server was never reached', () => {
    expect(isFinalRefusal(null)).toBe(false);
  });

  it('keeps a voice that was rate limited, because 429 means try later', () => {
    // Discarding here would throw away submissions exactly when the platform is
    // busiest — which is when people write after something terrible happens.
    expect(isFinalRefusal(429)).toBe(false);
  });

  it('keeps a voice when the server errored', () => {
    expect(isFinalRefusal(500)).toBe(false);
    expect(isFinalRefusal(503)).toBe(false);
  });

  it('drops a voice the server refused on its content', () => {
    // A word limit or a malformed field will refuse identically forever;
    // retrying it is a loop, not persistence.
    expect(isFinalRefusal(400)).toBe(true);
    expect(isFinalRefusal(422)).toBe(true);
  });
});
