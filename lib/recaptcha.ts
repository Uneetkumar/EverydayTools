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
export async function executeRecaptcha(action: string): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

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
