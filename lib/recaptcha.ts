declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        ready: (callback: () => void) => void;
        execute: (
          siteKey: string,
          options: { action: string }
        ) => Promise<string>;
      };
    };
  }
}

export const RECAPTCHA_SITE_KEY =
  "6LfFkqgtAAAAAIESThxZ7ie3rcfMI3dmcC-fffBq";

/**
 * Executes a reCAPTCHA Enterprise check for a given action name.
 *
 * @param action - Action descriptor (e.g. 'LOGIN', 'SUBMIT_FEEDBACK', 'CONTACT')
 * @returns Promise resolving to the reCAPTCHA token or null if unavailable.
 */
let scriptPromise: Promise<void> | null = null;

/**
 * Loads reCAPTCHA Enterprise on demand.
 *
 * It used to be a synchronous <script> in the root layout, so every one of the
 * site's pages paid a render-blocking third-party download for a check that
 * only the contact form runs. Firebase App Check (the cloud AI path) injects
 * the same script itself when it needs it. Bounded, so a blocked script
 * resolves instead of hanging the form.
 */
function loadRecaptcha(timeoutMs = 8000): Promise<void> {
  if (window.grecaptcha?.enterprise) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve) => {
      const done = () => resolve();
      const timer = setTimeout(done, timeoutMs);
      const el = document.createElement("script");
      el.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
      el.async = true;
      el.onload = () => {
        clearTimeout(timer);
        done();
      };
      el.onerror = () => {
        clearTimeout(timer);
        scriptPromise = null;
        done();
      };
      document.head.appendChild(el);
    });
  }
  return scriptPromise;
}

/** Start loading early (e.g. when a form mounts) so submit is not delayed. */
export function preloadRecaptcha(): void {
  if (typeof window !== "undefined") void loadRecaptcha();
}

export async function executeRecaptcha(action: string): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  await loadRecaptcha();

  return new Promise((resolve) => {
    if (!window.grecaptcha?.enterprise) {
      resolve(null);
      return;
    }

    window.grecaptcha.enterprise.ready(async () => {
      try {
        const token = await window.grecaptcha!.enterprise!.execute(
          RECAPTCHA_SITE_KEY,
          { action }
        );
        resolve(token);
      } catch (error) {
        console.error(`reCAPTCHA Enterprise error for action [${action}]:`, error);
        resolve(null);
      }
    });
  });
}
