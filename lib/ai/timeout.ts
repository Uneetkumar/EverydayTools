/**
 * Bounded waits for anything that touches the network.
 *
 * None of the cloud AI paths had a timeout. If a request stalled — App Check
 * waiting on a reCAPTCHA script that never loads, a slow uplink on a large
 * image, a request that is simply dropped — the promise never settled and the
 * UI sat on "Processing…" forever with no way back. An infinite spinner is
 * worse than an error: the user cannot tell whether to wait or retry, and the
 * on-device fallback sitting right there never gets offered.
 *
 * These budgets are deliberately generous. They are a backstop against hangs,
 * not a performance target, so a genuinely slow-but-working request still
 * completes.
 */
export const AI_TIMEOUTS = {
  /** reCAPTCHA Enterprise script fetch + App Check init. */
  appCheck: 15_000,
  /** Text generation. */
  text: 45_000,
  /** Vision: a multi-megabyte inline image takes longer to upload. */
  vision: 75_000,
} as const;

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${Math.round(ms / 1000)}s`);
    this.name = "TimeoutError";
  }
}

/**
 * Rejects if `promise` has not settled within `ms`.
 *
 * The underlying work is not cancelled — the Firebase AI SDK exposes no abort
 * signal — so this frees the *caller*, not the request. That is the difference
 * between a user who can retry and one who is stuck.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
    }),
  ]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * Condenses a provider error into something a person can read.
 *
 * Gemini's 429 arrives as ~800 characters of JSON — quota metric names, help
 * URLs, RetryInfo objects. Appending that verbatim to a friendly sentence (as an
 * earlier version did) both overflowed the error panel and buried the one fact
 * that matters: how long to wait.
 *
 * Keeps the first human sentence, pulls out the retry delay and the daily limit
 * when present, and drops the JSON.
 */
export function condenseProviderError(msg: string, max = 220): string {
  const retry = msg.match(/"retryDelay":"(\d+)s"/)?.[1];
  const limit = msg.match(/limit:\s*(\d+)/)?.[1];

  // Everything before the first "[" or "{" is the prose part.
  let head = msg.split(/[[{]/)[0].trim();
  head = head.replace(/\s+/g, " ");
  if (head.length > max) head = head.slice(0, max).trim() + "…";

  const extras: string[] = [];
  if (limit) extras.push(`daily free-tier limit: ${limit} requests`);
  if (retry) extras.push(`retry in ${retry}s`);

  return extras.length ? `${head} (${extras.join("; ")})` : head;
}
