/**
 * Model ids drift, and not every id is offered on every plan or region.
 *
 * The project is on the Spark (free) plan using the **Gemini Developer API**
 * backend (`GoogleAIBackend`), which does have a free tier — Vertex AI is the
 * one that needs Blaze, and it is deprecated in this SDK regardless. So a
 * "model not found" here is not a billing problem; it means that particular id
 * is not served to this project.
 *
 * Rather than hardcode one id and fail, try a short list. The first that
 * answers wins, and the caller reports which one it was, so the working id is
 * observable instead of guessed at.
 */
export const GEMINI_MODEL_CANDIDATES: string[] = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
    ].filter((m): m is string => !!m)
  )
);

/** A 404 / NOT_FOUND means "try the next id"; anything else should surface. */
export function isModelNotFound(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /not found|NOT_FOUND|404/i.test(msg);
}
