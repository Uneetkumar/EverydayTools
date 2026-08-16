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
