/**
 * Shown when a right-click image action needs to read an image from a site
 * the extension has no access to. Access can only be granted from a page the
 * user clicks in, so the background worker opens this small window. It asks
 * for the one site by default; "all sites" is an explicit choice.
 */
import { applyTheme, getSettings } from "./shared/storage";
import { LOGO_SVG, button, icon, toggle } from "./ui/components";
import { h } from "./ui/dom";

const params = new URLSearchParams(location.search);
const id = params.get("id") ?? "";
const origin = params.get("origin") ?? "";
let host = origin;
try {
  host = new URL(origin).hostname;
} catch {
  /* shown as given */
}

applyTheme((await getSettings()).theme);

let allSites = false;
const app = document.getElementById("app")!;

function render() {
  const allow = button("Allow and continue", {
    onClick: async () => {
      const origins = allSites ? ["https://*/*", "http://*/*"] : [`${origin}/*`];
      const granted = await chrome.permissions.request({ origins });
      if (granted) {
        await chrome.runtime.sendMessage({ type: "pending:retry", id });
        window.close();
      } else {
        status.textContent = "Access was not granted. You can save the image and drop it into the tool instead.";
      }
    },
  });
  const cancel = button("Cancel", {
    variant: "outline",
    onClick: async () => {
      await chrome.runtime.sendMessage({ type: "pending:cancel", id });
      window.close();
    },
  });
  const status = h("p", { class: "text-xs text-destructive", "aria-live": "polite" });

  app.replaceChildren(
    h(
      "div",
      { class: "flex min-h-screen flex-col gap-5 p-6" },
      h(
        "div",
        { class: "flex items-center gap-2" },
        h("span", { class: "size-6 [&>svg]:size-full", html: LOGO_SVG }),
        h("span", { class: "text-[15px] font-semibold tracking-tight" }, "TabBench")
      ),
      h(
        "div",
        { class: "space-y-2" },
        h("h1", { class: "text-lg font-semibold tracking-tight" }, "Allow access to this image?"),
        h(
          "p",
          { class: "text-sm leading-relaxed text-muted-foreground" },
          "The image is on ",
          h("span", { class: "font-medium text-foreground" }, host),
          ". To send it to the tool, the extension needs permission to read images from that site. It only reads the image you choose."
        )
      ),
      h(
        "div",
        { class: "flex items-start justify-between gap-4 rounded-lg border p-3" },
        h(
          "div",
          null,
          h("label", { for: "all-sites", class: "text-sm font-medium" }, "Allow on all sites"),
          h("p", { class: "mt-0.5 text-xs text-muted-foreground" }, "So you are not asked again for other sites. You can remove this in Settings.")
        ),
        toggle(
          allSites,
          (v) => {
            allSites = v;
            render();
          },
          "all-sites"
        )
      ),
      status,
      h("div", { class: "mt-auto flex justify-end gap-2" }, cancel, allow),
      h(
        "p",
        { class: "flex items-center gap-1.5 text-xs text-muted-foreground" },
        icon("ShieldCheck", "size-3.5 text-success"),
        "Images are processed in your browser on tabbench.com and never uploaded."
      )
    )
  );
}

render();
