import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyBq6KCEK787HsvkH2s4ROMqvn--qKTMcnQ",
  authDomain: "everydaytools-s.firebaseapp.com",
  projectId: "everydaytools-s",
  storageBucket: "everydaytools-s.firebasestorage.app",
  messagingSenderId: "341790396738",
  appId: "1:341790396738:web:b18e89a0b40fbbc915b8db",
  measurementId: "G-T69LYYKSX3",
};

// Initialize Firebase safely (avoiding duplicate app initialization during Fast Refresh)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * App Check.
 *
 * AI Logic is set to "Basic - Enforced" in the Firebase console, which means
 * unverified requests are REJECTED. Before this existed the console reported
 * 0% verified / 100% unverified: the enforcement was on, but nothing in the
 * client was producing a token, so every Gemini call would have been turned
 * away regardless of AI Logic being enabled.
 *
 * The reCAPTCHA site key is public by design — it ships in client code, which
 * is why it lives in NEXT_PUBLIC_. It is not a secret; the protection comes
 * from Google scoring the request and from the domain allowlist on the key.
 *
 * Deliberately lazy and browser-only:
 *  - it must never run during the static export, where `document` does not exist
 *  - it pulls in the reCAPTCHA Enterprise script, so paying that cost on every
 *    page load — when most tools never touch the network — would be wasteful.
 *    `ensureAppCheck()` is called by the cloud AI path just before it is needed.
 */
// reCAPTCHA Enterprise SITE key. Public by design — it is served in the page
// like firebaseConfig is, and Google's docs treat it as non-secret. Committing
// it means the Firebase build needs no extra environment setup, which is one
// less place for production to silently differ from dev. (The reCAPTCHA SECRET
// key is the sensitive half and never appears in this codebase.)
const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  "6LfFkqgtAAAAAIESThxZ7ie3rcfMI3dmcC-fffBq";

let appCheckPromise: Promise<void> | null = null;

export function isAppCheckConfigured(): boolean {
  return RECAPTCHA_SITE_KEY.length > 0;
}

export function ensureAppCheck(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (appCheckPromise) return appCheckPromise;

  appCheckPromise = (async () => {
    if (!RECAPTCHA_SITE_KEY) {
      // Enforcement is on, so continuing without a token means a guaranteed
      // rejection. Fail loudly here rather than surfacing an opaque 403.
      throw new Error(
        "App Check is enforced for this project but NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set, so no token can be produced."
      );
    }
    const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import(
      "firebase/app-check"
    );
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
      // Tokens expire; without this the first call after expiry fails.
      isTokenAutoRefreshEnabled: true,
    });
  })();

  appCheckPromise = appCheckPromise.catch((e) => {
    // A failed init must not permanently poison later attempts.
    appCheckPromise = null;
    throw e;
  });

  return appCheckPromise;
}

let analyticsInstance: Analytics | null = null;

export const initAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    if (supported && !analyticsInstance) {
      analyticsInstance = getAnalytics(app);
    }
    return analyticsInstance;
  }
  return null;
};
