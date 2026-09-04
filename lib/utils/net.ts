/**
 * `fetch` with a deadline.
 *
 * Plain `fetch` has no timeout: if a host accepts the connection and then never
 * responds, the promise never settles and whatever is awaiting it waits
 * forever. On this site that surfaced as tools stuck on a loading state with no
 * error and no way back.
 *
 * Unlike a `Promise.race`, an AbortController genuinely cancels the request, so
 * the socket and the browser's connection slot are released rather than left
 * hanging until the tab closes.
 */
export class FetchTimeoutError extends Error {
  constructor(url: string, ms: number) {
    super(`Request to ${url} timed out after ${Math.round(ms / 1000)}s`);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  ms = 12_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e) {
    // A caller-supplied signal aborting is a different event from our deadline
    // firing, and they deserve different messages.
    if (e instanceof DOMException && e.name === "AbortError" && !init.signal?.aborted) {
      throw new FetchTimeoutError(input, ms);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
