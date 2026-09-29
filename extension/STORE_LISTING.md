# Chrome Web Store listing

Copy for the developer dashboard. Keep every claim true of the code.

## Store listing

**Name:** TabBench – Free Online Tools

**Summary (max 132 characters):**
Search TabBench's free tools from any page, make QR codes, clean links, and send text or images straight to the right tool.

**Category:** Tools · **Language:** English

**Description:**

TabBench puts 80+ free everyday tools one click away, and lets you use them on whatever you are looking at.

Search every tool
• Type a few letters in the toolbar popup: "calc", "pdf", "compress", "gst". The best match comes first.
• Recent and popular tools are one click away.
• From the address bar: type tb, a space, then what you need.

For the page you are on
• QR code of the page, with tracking tags removed. Download it or copy it.
• Clean link: strip utm_, fbclid, gclid and other tracking tags before you share.
• Summarise the page in seconds.

Right-click anything
• Selected text: count words, change case, summarise, rewrite in another tone, simplify, read aloud, format JSON.
• Images: compress, convert to JPG or WebP, resize, crop, extract text, view or remove photo metadata, make a PDF.
• Links: make a QR code.

Private by design
• The extension collects no data and has no analytics.
• It reads a page only when you use it, and hands content to the tool without putting it in a web address.
• TabBench's tools run in your browser: files and text are not uploaded.

Light and dark themes, keyboard shortcut Alt+Shift+K (Cmd+Shift+K on Mac).

## Graphics to prepare

- Icon 128 × 128: `extension/dist/icons/icon-128.png` (generated).
- Screenshots, 1280 × 800 or 640 × 400, at least one: the popup over a web page; search results for "pdf"; the QR panel; the right-click menu on an image; a tool opened from the menu.
- Small promo tile 440 × 280 (optional).

## Privacy practices tab

**Single purpose:**
Lets users open TabBench's online tools from any page and send the text, link, image or page they choose to the matching tool.

**Permission justifications:**

- activeTab — Reads the current tab's address and title only after the user opens the popup or chooses a right-click action, to make a QR code, a clean link, or to send the page to a tool.
- contextMenus — Adds the TabBench right-click menu for selected text, images, links and pages.
- scripting — On a user's right-click action, reads the selected text (keeping line breaks) or the page's readable text for "Summarise this page", in the active tab only.
- storage — Saves the user's settings and recently used tools, and briefly holds the content being handed to a tool (session storage, deleted once delivered).
- Host permission (content script on tabbench.com) — Delivers the content the user sent to the tool page on tabbench.com.
- Optional host permissions — Requested only when the user sends an image hosted on another site to an image tool, for that site only unless the user chooses all sites. Used solely to read that image.

**Remote code:** No, I am not using remote code.

**Data usage:** Declare **Website content** — the extension reads page text, links and images the user explicitly chooses and passes them to a TabBench tool page in the same browser. Declaring it is the conservative, transparent choice: nothing goes to a server, but reviewers treat reading page content as handling it. Then certify:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://tabbench.com/privacy (section 7 covers the extension).
