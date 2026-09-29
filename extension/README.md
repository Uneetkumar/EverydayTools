# TabBench browser extension

A Manifest V3 extension for Chrome, Edge, Brave and other Chromium browsers. Its one purpose: **use TabBench's tools on whatever you are looking at.**

## What it does

| Where | What |
| --- | --- |
| Toolbar popup | Search all tools (same ranking as the site), recent and popular tools |
| Popup → This page | QR code of the page (clean link, download PNG, copy image, customise on TabBench), clean link without tracking tags, summarise the page |
| Right-click selected text | Count words, change case, summarise, rewrite, simplify, read aloud, format JSON |
| Right-click an image | Compress, convert to JPG / WebP, resize, crop, extract text (OCR), view or remove metadata, make a PDF |
| Right-click a link / page | QR code for the link / page, summarise this page |
| Address bar | Type `tb`, a space, then a tool name: `tb gst`, `tb pdf` |
| Shortcut | Alt+Shift+K (Cmd+Shift+K on Mac) opens the popup |

Content is handed to the site without ever going into a URL: the worker keeps it in `chrome.storage.session` under a random id, opens `/tools/<slug>#tb-handoff=<id>`, and the content script on tabbench.com collects it once and posts it to the page, where `components/tool/extension-handoff.tsx` fills the tool's input.

## Permissions

| Permission | Why |
| --- | --- |
| `activeTab` | Read the current page's address and title when the user opens the popup or uses the right-click menu |
| `contextMenus` | The right-click menu |
| `scripting` | Read the selected text with its line breaks, and a page's readable text for "Summarise this page", only on a user action |
| `storage` | Settings, recent tools, and the short-lived hand-off |
| content script on `tabbench.com` | Deliver hand-offs to tool pages |
| `optional_host_permissions` | Requested per site, at the moment a right-click image action needs an image from another site |

No remote code, no analytics, no data collection. Tool links carry `utm_source=tabbench-extension` so the site's analytics can count extension visits.

## Build

```bash
npm run ext:build      # store build → extension/dist and extension/release/tabbench-extension-<version>.zip
npm run ext:dev        # talks to http://localhost:3100 (npm run build, then serve out/) → extension/dist-dev
npm run ext:preview    # popup as a web page with a fake chrome API → extension/dist-preview
npm run ext:test       # dev build + background worker checks
npm run ext:typecheck
```

The tool list, icons, category colours and search ranking are generated from the site's own source on every build (`lib/tools/registry.ts`, `lib/tools/visuals.ts`, `components/tool/tool-icon.tsx`, `lib/tools/search.ts`), so a tool added to the site appears in the extension on the next build. Design tokens in `src/styles.css` are copied from `app/globals.css`; keep them in step.

Bump `VERSION` in `scripts/build.mjs` for each store upload.

## Try it locally

1. `npm run ext:build`
2. Open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked** and pick `extension/dist`.
3. Pin TabBench from the puzzle-piece menu.

Right-click hand-offs deliver to tabbench.com, so the site must be deployed with `ExtensionHandoff` (it is mounted in `components/ToolShell.tsx`). To test against a local build instead, use `npm run ext:dev`, serve the site's `out/` folder on port 3100 and load `extension/dist-dev`.

## Publish

See [STORE_LISTING.md](STORE_LISTING.md) for the listing text, permission justifications and privacy answers. Upload `extension/release/tabbench-extension-<version>.zip` in the Chrome Web Store developer dashboard (one-time US$5 registration). Edge Add-ons accepts the same package.
