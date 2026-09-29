/**
 * Loaded synchronously in <head> so an extension page opens in the right
 * theme without a flash. chrome.storage is asynchronous, so the popup mirrors
 * the theme setting into localStorage for this one read.
 */
let theme = "system";
try {
  theme = localStorage.getItem("tb-theme") ?? "system";
} catch {
  /* private mode or blocked storage: fall back to the system setting */
}
const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.classList.toggle("dark", dark);
document.documentElement.style.colorScheme = dark ? "dark" : "light";
