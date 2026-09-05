import { ensureAppCheck } from "@/lib/firebase";

/**
 * Pre-pays the fixed setup cost of a cloud call.
 *
 * A first cloud request does three things before a single byte of the prompt is
 * sent: dynamically imports the Firebase AI chunk, initialises App Check (which
 * fetches the reCAPTCHA Enterprise script from Google), and builds the model
 * handle. That is seconds of dead time attributed, from the user's point of
 * view, to "the AI being slow".
 *
 * None of it depends on the prompt, so none of it has to happen after the click.
 * Calling this when the user *selects* the cloud engine moves the whole setup
 * into the seconds they spend typing.
 *
 * Deliberately fire-and-forget: warming is an optimisation, and a failure here
 * must not surface as an error. If it fails, the real call fails the same way
 * and reports it properly.
 */
let warmed: Promise<void> | null = null;

export function warmCloudAI(): void {
  if (warmed) return;
  warmed = (async () => {
    await Promise.all([
      import("firebase/ai"),
      ensureAppCheck().catch(() => {
        /* the real call will surface this */
      }),
    ]);
  })().catch(() => {
    // Allow a later attempt rather than caching the failure.
    warmed = null;
  });
}
