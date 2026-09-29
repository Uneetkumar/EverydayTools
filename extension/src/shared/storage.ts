/** Settings (synced across the user's browsers) and recently used tools (this device only). */

export interface Settings {
  theme: "system" | "light" | "dark";
  openIn: "new-tab" | "current-tab";
  contextMenu: boolean;
}

export const DEFAULT_SETTINGS: Settings = { theme: "system", openIn: "new-tab", contextMenu: true };

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.sync.get("settings");
    return { ...DEFAULT_SETTINGS, ...(stored.settings as Partial<Settings> | undefined) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await chrome.storage.sync.set({ settings: next });
  return next;
}

const RECENT_MAX = 6;

export async function getRecent(): Promise<string[]> {
  try {
    const stored = await chrome.storage.local.get("recent");
    return Array.isArray(stored.recent) ? (stored.recent as string[]) : [];
  } catch {
    return [];
  }
}

export async function addRecent(slug: string): Promise<void> {
  const list = (await getRecent()).filter((s) => s !== slug);
  list.unshift(slug);
  await chrome.storage.local.set({ recent: list.slice(0, RECENT_MAX) });
}

export async function clearRecent(): Promise<void> {
  await chrome.storage.local.remove("recent");
}

/** Apply the theme to an extension page, the same way the site does (.dark on <html>). */
export function applyTheme(theme: Settings["theme"]): void {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
