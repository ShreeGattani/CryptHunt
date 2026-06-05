/** Minimum wall-clock time for login responses — reduces timing-oracle enumeration. */
export const LOGIN_MIN_RESPONSE_MS = 600;

/** Wait until at least minMs have elapsed since startedAt. */
export async function ensureMinElapsed(
  startedAt: number,
  minMs: number = LOGIN_MIN_RESPONSE_MS
): Promise<void> {
  const remaining = minMs - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
