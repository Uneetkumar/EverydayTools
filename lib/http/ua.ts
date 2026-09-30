/**
 * User-Agent parsing. The header is a fossil record — every browser still
 * starts with "Mozilla/5.0" and lists engines it is "like" — so the parser
 * checks the specific, later-added tokens first (Edg/, OPR/, SamsungBrowser/)
 * before falling back to Chrome, then Safari. It also says when a value is
 * unreliable: Chrome froze the macOS version, reduced Android device names,
 * and iPadOS reports itself as a Mac.
 */

export type DeviceType = "desktop" | "mobile" | "tablet" | "tv" | "console" | "wearable" | "bot" | "library" | "unknown";

export interface UaPart {
  name: string;
  version?: string;
}

export interface ParsedUserAgent {
  raw: string;
  browser: UaPart;
  engine: UaPart;
  os: UaPart;
  device: { type: DeviceType; vendor?: string; model?: string };
  cpu?: string;
  /** Set when the string belongs to a crawler, AI agent or HTTP library. */
  bot?: { name: string; kind: "search" | "ai" | "social" | "seo" | "monitor" | "library" | "other"; operator?: string };
  /** Wrapped in an app's own browser (Facebook, Instagram, a WebView). */
  inApp?: string;
  /** Caveats about the accuracy of what was detected. */
  notes: string[];
}

const major = (v?: string) => v?.split(".")[0];

function matchVersion(ua: string, re: RegExp): string | undefined {
  const m = re.exec(ua);
  return m?.[1]?.replace(/_/g, ".");
}

/* -------------------------------------------------------------------- bots */

interface BotDef {
  re: RegExp;
  name: string;
  kind: NonNullable<ParsedUserAgent["bot"]>["kind"];
  operator?: string;
}

const BOTS: BotDef[] = [
  { re: /Googlebot-Image|Googlebot-Video|Googlebot-News/i, name: "Googlebot (media)", kind: "search", operator: "Google" },
  { re: /Googlebot/i, name: "Googlebot", kind: "search", operator: "Google" },
  { re: /Google-Extended/i, name: "Google-Extended", kind: "ai", operator: "Google" },
  { re: /GoogleOther|Google-InspectionTool|Storebot-Google/i, name: "Google crawler", kind: "search", operator: "Google" },
  { re: /AdsBot-Google|Mediapartners-Google/i, name: "Google Ads bot", kind: "other", operator: "Google" },
  { re: /bingbot|BingPreview|msnbot/i, name: "Bingbot", kind: "search", operator: "Microsoft" },
  { re: /DuckDuckBot/i, name: "DuckDuckBot", kind: "search", operator: "DuckDuckGo" },
  { re: /Baiduspider/i, name: "Baiduspider", kind: "search", operator: "Baidu" },
  { re: /YandexBot|YandexImages/i, name: "YandexBot", kind: "search", operator: "Yandex" },
  { re: /Slurp/i, name: "Yahoo Slurp", kind: "search", operator: "Yahoo" },
  { re: /Applebot/i, name: "Applebot", kind: "search", operator: "Apple" },
  { re: /Sogou/i, name: "Sogou Spider", kind: "search", operator: "Sogou" },
  { re: /GPTBot/i, name: "GPTBot", kind: "ai", operator: "OpenAI" },
  { re: /ChatGPT-User|OAI-SearchBot/i, name: "OpenAI agent", kind: "ai", operator: "OpenAI" },
  { re: /ClaudeBot|Claude-Web|anthropic-ai|Claude-User|Claude-SearchBot/i, name: "Anthropic crawler", kind: "ai", operator: "Anthropic" },
  { re: /PerplexityBot|Perplexity-User/i, name: "PerplexityBot", kind: "ai", operator: "Perplexity" },
  { re: /CCBot/i, name: "CCBot", kind: "ai", operator: "Common Crawl" },
  { re: /Bytespider/i, name: "Bytespider", kind: "ai", operator: "ByteDance" },
  { re: /Amazonbot/i, name: "Amazonbot", kind: "ai", operator: "Amazon" },
  { re: /Meta-ExternalAgent|FacebookBot/i, name: "Meta crawler", kind: "ai", operator: "Meta" },
  { re: /facebookexternalhit/i, name: "Facebook link preview", kind: "social", operator: "Meta" },
  { re: /Twitterbot/i, name: "Twitterbot", kind: "social", operator: "X" },
  { re: /LinkedInBot/i, name: "LinkedInBot", kind: "social", operator: "LinkedIn" },
  { re: /Slackbot|Slack-ImgProxy/i, name: "Slackbot", kind: "social", operator: "Slack" },
  { re: /WhatsApp\//i, name: "WhatsApp link preview", kind: "social", operator: "Meta" },
  { re: /TelegramBot/i, name: "TelegramBot", kind: "social", operator: "Telegram" },
  { re: /Discordbot/i, name: "Discordbot", kind: "social", operator: "Discord" },
  { re: /Pinterestbot|Pinterest\//i, name: "Pinterestbot", kind: "social", operator: "Pinterest" },
  { re: /AhrefsBot|AhrefsSiteAudit/i, name: "AhrefsBot", kind: "seo", operator: "Ahrefs" },
  { re: /SemrushBot/i, name: "SemrushBot", kind: "seo", operator: "Semrush" },
  { re: /MJ12bot/i, name: "MJ12bot", kind: "seo", operator: "Majestic" },
  { re: /DotBot/i, name: "DotBot", kind: "seo", operator: "Moz" },
  { re: /PetalBot/i, name: "PetalBot", kind: "search", operator: "Huawei" },
  { re: /Screaming Frog/i, name: "Screaming Frog SEO Spider", kind: "seo" },
  { re: /UptimeRobot|Pingdom|StatusCake|Site24x7|BetterUptime/i, name: "Uptime monitor", kind: "monitor" },
  { re: /Lighthouse|Chrome-Lighthouse|PageSpeed/i, name: "Lighthouse / PageSpeed", kind: "monitor", operator: "Google" },
  { re: /HeadlessChrome/i, name: "Headless Chrome", kind: "other" },
  { re: /PhantomJS|Puppeteer|Playwright/i, name: "Browser automation", kind: "other" },
  { re: /PostmanRuntime/i, name: "Postman", kind: "library", operator: "Postman" },
  { re: /insomnia/i, name: "Insomnia", kind: "library" },
  { re: /HTTPie/i, name: "HTTPie", kind: "library" },
  { re: /\bcurl\//i, name: "curl", kind: "library" },
  { re: /\bWget\//i, name: "Wget", kind: "library" },
  { re: /python-requests/i, name: "python-requests", kind: "library" },
  { re: /python-urllib|Python-urllib/i, name: "Python urllib", kind: "library" },
  { re: /python-httpx/i, name: "HTTPX", kind: "library" },
  { re: /aiohttp/i, name: "aiohttp", kind: "library" },
  { re: /Scrapy/i, name: "Scrapy", kind: "library" },
  { re: /Go-http-client/i, name: "Go net/http", kind: "library" },
  { re: /okhttp/i, name: "OkHttp", kind: "library" },
  { re: /Apache-HttpClient|Java\/\d|Jakarta Commons/i, name: "Java HTTP client", kind: "library" },
  { re: /node-fetch|undici|axios\/|got \(|superagent/i, name: "Node.js HTTP client", kind: "library" },
  { re: /libwww-perl|LWP::/i, name: "libwww-perl", kind: "library" },
  { re: /Deno\/|Bun\//i, name: "Deno / Bun", kind: "library" },
  { re: /RestSharp|HttpClient|System\.Net\.Http/i, name: ".NET HTTP client", kind: "library" },
  { re: /Dart\/|Dalvik\//i, name: "Dart / Dalvik", kind: "library" },
  { re: /\bbot\b|crawler|spider|scraper|fetcher|monitor/i, name: "Unnamed bot", kind: "other" },
];

/* ------------------------------------------------------------------ device */

const ANDROID_VENDORS: [RegExp, string][] = [
  [/^SM-|^GT-|^SAMSUNG|^SCG|^SC-/i, "Samsung"],
  [/^Pixel|^Nexus/i, "Google"],
  [/^(M\d{4}|Mi |MI |Redmi|POCO|22\d{6,}|23\d{6,}|21\d{6,})/i, "Xiaomi"],
  [/^(moto|XT\d|Motorola)/i, "Motorola"],
  [/^(CPH|PH[A-Z]\d)/i, "OPPO"],
  [/^RMX/i, "realme"],
  [/^(ONEPLUS|IN20|LE2|KB20|HD19|GM19)/i, "OnePlus"],
  [/^(V\d{4}|vivo)/i, "vivo"],
  [/^(LM-|LG-|LGE)/i, "LG"],
  [/^(Nokia|TA-)/i, "Nokia"],
  [/^(HUAWEI|HONOR|[A-Z]{3}-[A-Z]{2}\d{2})/i, "Huawei / Honor"],
  [/^(SONY|XQ-|SO-|G\d{4})/i, "Sony"],
  [/^(ASUS|ZS\d|AI2)/i, "ASUS"],
  [/^Lenovo/i, "Lenovo"],
  [/^(KF|AFT|Kindle)/i, "Amazon"],
];

function androidDevice(model: string): { vendor?: string; model?: string } {
  const m = model.replace(/\s+Build\/.*$/, "").trim();
  if (!m || m === "K" || m === "Mobile") return {};
  return { model: m, vendor: ANDROID_VENDORS.find(([re]) => re.test(m))?.[1] };
}

/* ------------------------------------------------------------------- parse */

export function parseUserAgent(input: string): ParsedUserAgent {
  const ua = input.trim();
  const notes: string[] = [];
  const out: ParsedUserAgent = {
    raw: ua,
    browser: { name: "Unknown" },
    engine: { name: "Unknown" },
    os: { name: "Unknown" },
    device: { type: "unknown" },
    notes,
  };
  if (!ua) return out;

  // ---- OS
  let os: UaPart | undefined;
  const win = /Windows NT (\d+\.\d+)/.exec(ua);
  if (win) {
    const names: Record<string, string> = { "10.0": "Windows 10 / 11", "6.3": "Windows 8.1", "6.2": "Windows 8", "6.1": "Windows 7", "6.0": "Windows Vista", "5.2": "Windows XP x64", "5.1": "Windows XP", "5.0": "Windows 2000" };
    os = { name: "Windows", version: names[win[1]]?.replace("Windows ", "") ?? win[1] };
    if (win[1] === "10.0") notes.push("Windows NT 10.0 covers both Windows 10 and Windows 11; the User-Agent cannot tell them apart. User-Agent Client Hints can.");
  } else if (/Windows Phone/i.test(ua)) os = { name: "Windows Phone", version: matchVersion(ua, /Windows Phone (?:OS )?(\d+(?:\.\d+)*)/) };
  else if (/(iPhone|iPod|iPad)/.test(ua) || /CPU (?:iPhone )?OS [\d_]+ like Mac OS X/.test(ua)) {
    const v = matchVersion(ua, /OS (\d+[_\d]*) like Mac OS X/);
    os = { name: /iPad/.test(ua) ? "iPadOS" : "iOS", version: v };
  } else if (/Android/.test(ua)) os = { name: "Android", version: matchVersion(ua, /Android[ /]([\d.]+)/) };
  else if (/CrOS/.test(ua)) os = { name: "ChromeOS", version: matchVersion(ua, /CrOS \S+ ([\d.]+)/) };
  else if (/Mac OS X|Macintosh/.test(ua)) {
    os = { name: "macOS", version: matchVersion(ua, /Mac OS X (\d+[_.\d]*)/) };
    notes.push("Browsers report macOS as 10.15.7 no matter which version is installed, and Apple Silicon Macs still say \"Intel\". These values are frozen for privacy.");
  } else if (/Tizen/.test(ua)) os = { name: "Tizen", version: matchVersion(ua, /Tizen ([\d.]+)/) };
  else if (/Web0S|webOS/i.test(ua)) os = { name: "webOS" };
  else if (/KaiOS/.test(ua)) os = { name: "KaiOS", version: matchVersion(ua, /KaiOS\/([\d.]+)/) };
  else if (/(Ubuntu|Fedora|Debian|Mint|Arch|SUSE|Red Hat|CentOS)/i.test(ua)) os = { name: "Linux", version: /Ubuntu|Fedora|Debian|Mint|Arch|SUSE|Red Hat|CentOS/i.exec(ua)![0] };
  else if (/X11|Linux/.test(ua)) os = { name: "Linux" };
  else if (/FreeBSD|OpenBSD|NetBSD/.test(ua)) os = { name: /FreeBSD|OpenBSD|NetBSD/.exec(ua)![0] };
  else if (/PlayStation/.test(ua)) os = { name: "PlayStation" };
  else if (/Xbox/.test(ua)) os = { name: "Xbox" };
  if (os) out.os = os;

  // ---- CPU
  if (/Win64; x64|x86_64|x64|amd64|WOW64/i.test(ua)) out.cpu = /WOW64/.test(ua) ? "x64 (32-bit browser)" : "x86-64 (64-bit)";
  else if (/aarch64|arm64|ARM64/i.test(ua)) out.cpu = "ARM 64-bit";
  else if (/armv7|armv8|arm;/i.test(ua)) out.cpu = "ARM";
  else if (/i[3-6]86|x86;/.test(ua)) out.cpu = "x86 (32-bit)";

  // ---- Bots and libraries (checked first: many masquerade as Chrome)
  const bot = BOTS.find((b) => b.re.test(ua));
  if (bot) {
    const hit = (bot.re.exec(ua)?.[0] ?? "").replace(/\/$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const version = hit ? matchVersion(ua, new RegExp(`${hit}[/ ]v?(\\d+(?:\\.\\d+)*)`, "i")) : undefined;
    out.bot = { name: bot.name, kind: bot.kind, operator: bot.operator };
    out.browser = { name: bot.name, version };
    out.device = { type: bot.kind === "library" ? "library" : "bot" };
    if (/Googlebot|bingbot|GPTBot|ClaudeBot|facebookexternalhit/i.test(ua)) notes.push("Anyone can copy this string. To be sure a crawler is genuine, verify its IP address with the operator's published ranges or a reverse DNS lookup.");
    if (bot.re.test(ua) && /Mobile|Android|iPhone/.test(ua) && bot.kind === "search") out.device.vendor = "smartphone crawler";
  }

  // ---- Engine + browser
  const chromeVer = matchVersion(ua, /(?:Chrome|CriOS|HeadlessChrome)\/([\d.]+)/);
  const edge = /\b(Edg|EdgA|EdgiOS)\/([\d.]+)/.exec(ua);
  const edgeLegacy = /\bEdge\/([\d.]+)/.exec(ua);

  if (!bot) {
    if (edge) out.browser = { name: "Microsoft Edge", version: edge[2] };
    else if (edgeLegacy) out.browser = { name: "Edge (legacy)", version: edgeLegacy[1] };
    else if (/\bOPR\/|\bOPT\/|\bOPX\/|Opera Mini|OPiOS|\bOpera\//.test(ua)) {
      const v = matchVersion(ua, /(?:OPR|OPT|OPX|OPiOS)\/([\d.]+)/) ?? matchVersion(ua, /Opera Mini\/([\d.]+)/) ?? matchVersion(ua, /Version\/([\d.]+)/) ?? matchVersion(ua, /Opera\/([\d.]+)/);
      out.browser = { name: /Opera Mini/.test(ua) ? "Opera Mini" : /\bOPT\//.test(ua) ? "Opera Touch" : /\bOPX\//.test(ua) ? "Opera GX" : "Opera", version: v };
    } else if (/Vivaldi\//.test(ua)) out.browser = { name: "Vivaldi", version: matchVersion(ua, /Vivaldi\/([\d.]+)/) };
    else if (/SamsungBrowser\//.test(ua)) out.browser = { name: "Samsung Internet", version: matchVersion(ua, /SamsungBrowser\/([\d.]+)/) };
    else if (/UCBrowser\/|UCWEB/.test(ua)) out.browser = { name: "UC Browser", version: matchVersion(ua, /UCBrowser\/([\d.]+)/) };
    else if (/YaBrowser\//.test(ua)) out.browser = { name: "Yandex Browser", version: matchVersion(ua, /YaBrowser\/([\d.]+)/) };
    else if (/DuckDuckGo\//.test(ua)) out.browser = { name: "DuckDuckGo", version: matchVersion(ua, /DuckDuckGo\/([\d.]+)/) };
    else if (/Whale\//.test(ua)) out.browser = { name: "Naver Whale", version: matchVersion(ua, /Whale\/([\d.]+)/) };
    else if (/Silk\//.test(ua)) out.browser = { name: "Amazon Silk", version: matchVersion(ua, /Silk\/([\d.]+)/) };
    else if (/MicroMessenger\//.test(ua)) {
      out.browser = { name: "WeChat", version: matchVersion(ua, /MicroMessenger\/([\d.]+)/) };
      out.inApp = "WeChat";
    } else if (/FxiOS\//.test(ua)) out.browser = { name: "Firefox", version: matchVersion(ua, /FxiOS\/([\d.]+)/) };
    else if (/Firefox\/|Focus\//.test(ua)) out.browser = { name: /Focus\//.test(ua) ? "Firefox Focus" : "Firefox", version: matchVersion(ua, /(?:Firefox|Focus)\/([\d.]+)/) };
    else if (/MSIE |Trident\//.test(ua)) out.browser = { name: "Internet Explorer", version: matchVersion(ua, /MSIE ([\d.]+)/) ?? matchVersion(ua, /rv:([\d.]+)/) };
    else if (/Chrome\/|CriOS\//.test(ua)) out.browser = { name: /CriOS/.test(ua) ? "Chrome (iOS)" : "Chrome", version: chromeVer };
    else if (/Safari\//.test(ua) && /Version\/([\d.]+)/.test(ua)) {
      out.browser = { name: /Android/.test(ua) ? "Android Browser" : /Mobile Safari|iPhone|iPad/.test(ua) && /iPhone|iPad|iPod/.test(ua) ? "Safari" : "Safari", version: matchVersion(ua, /Version\/([\d.]+)/) };
    } else if (/AppleWebKit/.test(ua) && /(iPhone|iPad|iPod)/.test(ua)) out.browser = { name: "iOS WebView", version: undefined };
    else if (/Safari\//.test(ua)) out.browser = { name: "Safari", version: matchVersion(ua, /Safari\/([\d.]+)/) };

    // In-app browsers wrap a system WebView and add a marker.
    const inApp: [RegExp, string][] = [
      [/FBAN|FBAV|FB_IAB|FBIOS/, "Facebook"],
      [/Instagram/i, "Instagram"],
      [/Line\//i, "LINE"],
      [/Snapchat/i, "Snapchat"],
      [/musical_ly|BytedanceWebview|TikTok/i, "TikTok"],
      [/LinkedInApp/i, "LinkedIn"],
      [/Pinterest\//i, "Pinterest"],
      [/Twitter for|TwitterAndroid/i, "X (Twitter)"],
      [/GSA\//, "Google app"],
      [/; wv\)|\bwv\b/, "Android WebView"],
    ];
    const hit = inApp.find(([re]) => re.test(ua));
    if (hit) {
      out.inApp = hit[1];
      if (hit[1] === "Android WebView") out.browser = { name: "Android WebView", version: chromeVer };
      notes.push(`This looks like the in-app browser of ${hit[1]}, not the standalone browser app. Features and storage differ from the real browser.`);
    }
    if (/Brave/.test(ua)) out.browser = { ...out.browser, name: "Brave" };
    else if (out.browser.name === "Chrome") notes.push("Brave, Arc and other Chromium browsers deliberately send the same string as Chrome, so they show up as Chrome here.");
  }

  // Engine (from the browser and tokens)
  if (/Trident\//.test(ua) || /MSIE /.test(ua)) out.engine = { name: "Trident", version: matchVersion(ua, /Trident\/([\d.]+)/) };
  else if (edgeLegacy) out.engine = { name: "EdgeHTML", version: edgeLegacy[1] };
  else if (/Firefox\/|Focus\//.test(ua) && !/FxiOS/.test(ua)) out.engine = { name: "Gecko", version: matchVersion(ua, /rv:([\d.]+)/) ?? matchVersion(ua, /Gecko\/([\d.]+)/) };
  else if (/Presto\//.test(ua)) out.engine = { name: "Presto", version: matchVersion(ua, /Presto\/([\d.]+)/) };
  else if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) || (/AppleWebKit/.test(ua) && /(iPhone|iPad|iPod)/.test(ua))) {
    out.engine = { name: "WebKit", version: matchVersion(ua, /AppleWebKit\/([\d.]+)/) };
    if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) notes.push("On iPhone and iPad every browser must use Apple's WebKit engine, even Chrome and Firefox.");
  } else if (/Chrome\/|Chromium\/|HeadlessChrome/.test(ua) && /AppleWebKit/.test(ua)) out.engine = { name: "Blink", version: chromeVer };
  else if (/AppleWebKit\//.test(ua)) out.engine = { name: "WebKit", version: matchVersion(ua, /AppleWebKit\/([\d.]+)/) };
  else if (/KHTML/.test(ua)) out.engine = { name: "KHTML" };

  // ---- Device
  let device: ParsedUserAgent["device"] = { type: "unknown" };
  const androidModel = /Android[^;)]*;\s*([^;)]+?)(?:\s+Build\/[^;)]*)?[;)]/.exec(ua);
  if (/iPad/.test(ua)) device = { type: "tablet", vendor: "Apple", model: "iPad" };
  else if (/iPhone/.test(ua)) device = { type: "mobile", vendor: "Apple", model: "iPhone" };
  else if (/iPod/.test(ua)) device = { type: "mobile", vendor: "Apple", model: "iPod touch" };
  else if (/Android/.test(ua)) {
    const { model, vendor } = androidModel ? androidDevice(androidModel[1]) : {};
    device = { type: /Mobile/.test(ua) ? "mobile" : "tablet", vendor, model };
    if (androidModel && androidModel[1].trim() === "K") notes.push("Chrome's reduced User-Agent replaces the Android device model with \"K\", so the phone or tablet cannot be identified from this string.");
  } else if (/SMART-?TV|Tizen|Web0S|webOS|AppleTV|Roku|CrKey|AFTT|AFTM|HbbTV|BRAVIA|VIERA/i.test(ua)) device = { type: "tv" };
  else if (/PlayStation|Xbox|Nintendo/i.test(ua)) device = { type: "console", vendor: /PlayStation/.test(ua) ? "Sony" : /Xbox/.test(ua) ? "Microsoft" : "Nintendo" };
  else if (/Watch/.test(ua)) device = { type: "wearable" };
  else if (/Windows Phone/.test(ua)) device = { type: "mobile", vendor: "Microsoft" };
  else if (/Mobile|Opera Mini|KaiOS/.test(ua)) device = { type: "mobile" };
  else if (out.os.name !== "Unknown" || out.browser.name !== "Unknown") device = { type: "desktop", vendor: /Macintosh|Mac OS X/.test(ua) ? "Apple" : undefined };
  if (!bot) out.device = device;
  if (/Macintosh/.test(ua) && /Version\/[\d.]+ Safari/.test(ua) && !/Mobile/.test(ua) && !bot) notes.push("An iPad running iPadOS 13 or later asks for desktop websites and sends a macOS User-Agent, so it looks like a Mac. Use touch-point detection to tell them apart.");

  if (out.browser.name === "Unknown" && out.os.name === "Unknown" && !bot) notes.push("Nothing here matches a known browser, operating system or bot. It may be a custom app, an API client or a malformed string.");
  return out;
}

/* ---------------------------------------------------------------- explain */

export interface UaToken {
  text: string;
  meaning: string;
}

/** Splits a UA string into its parts and explains each, the way the format actually works. */
export function explainUserAgent(ua: string): UaToken[] {
  const tokens: UaToken[] = [];
  const re = /\(([^)]*)\)|\[([^\]]*)\]|([^\s()[\]]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ua))) {
    const text = m[0];
    if (m[1] !== undefined) {
      tokens.push({ text, meaning: explainComment(m[1]) });
    } else if (m[2] !== undefined) tokens.push({ text, meaning: "App-specific data added by an in-app browser (Facebook, Instagram…)." });
    else tokens.push({ text, meaning: explainProduct(m[3]) });
  }
  return tokens;
}

function explainProduct(t: string): string {
  const [name, version] = t.split("/");
  const v = version ? ` version ${version}` : "";
  switch (name) {
    case "Mozilla":
      return "A historical token. Netscape's browser was \"Mozilla\", and every browser since has claimed it so servers would not treat them as second-class.";
    case "AppleWebKit":
      return `The WebKit rendering engine${v}. Chrome, Edge and Opera report it too because their Blink engine forked from WebKit.`;
    case "Chrome":
      return `Chrome${v}. Also present in Edge, Opera, Samsung Internet and other Chromium browsers. Recent versions freeze the minor numbers to .0.0.0.`;
    case "CriOS":
      return `Chrome on iOS${v}. It is a shell around Apple's WebKit.`;
    case "Safari":
      return "Another compatibility token. Present in every WebKit and Chromium browser; the number is frozen.";
    case "Version":
      return `The real Safari${v} (or Android Browser) version. Chrome does not send this.`;
    case "Mobile":
      return "Marks a phone-sized browser. Tablets usually omit it.";
    case "Gecko":
      return "Firefox's engine. Firefox sends the fixed date 20100101 after it; other browsers write \"like Gecko\" for compatibility.";
    case "Firefox":
      return `Firefox${v}.`;
    case "Edg":
    case "EdgA":
    case "EdgiOS":
      return `Microsoft Edge${v}, built on Chromium.`;
    case "OPR":
      return `Opera${v}, built on Chromium.`;
    case "SamsungBrowser":
      return `Samsung Internet${v}.`;
    case "Vivaldi":
      return `Vivaldi${v}.`;
    case "Trident":
      return `Internet Explorer's engine${v}.`;
    default:
      return version ? `${name}${v}.` : "";
  }
}

function explainComment(c: string): string {
  const parts = c.split(/;\s*/);
  const notes: string[] = [];
  for (const p of parts) {
    if (/^Windows NT/.test(p)) notes.push(`${p}: the Windows version (NT 10.0 is Windows 10 and 11)`);
    else if (/^Win64|^x64|^WOW64|^x86_64|^arm64|^aarch64/.test(p)) notes.push(`${p}: processor architecture`);
    else if (/^Macintosh/.test(p)) notes.push("Macintosh: an Apple computer");
    else if (/^Intel Mac OS X/.test(p)) notes.push(`${p}: macOS. The version is frozen at 10_15_7`);
    else if (/^Linux/.test(p)) notes.push("Linux: the kernel; on Android it is followed by the Android version");
    else if (/^Android/.test(p)) notes.push(`${p}: Android version`);
    else if (/^iPhone|^iPad|^iPod/.test(p)) notes.push(`${p}: the Apple device`);
    else if (/^CPU (iPhone )?OS/.test(p)) notes.push(`${p}: iOS version (underscores stand for dots)`);
    else if (/^rv:/.test(p)) notes.push(`${p}: Gecko release`);
    else if (/^KHTML, like Gecko$/.test(p)) notes.push("KHTML, like Gecko: compatibility text for old sites that check for engines");
    else if (/^X11/.test(p)) notes.push("X11: a Linux/Unix desktop");
    else if (/^compatible/.test(p)) notes.push("compatible: a claim to behave like a browser (typical for crawlers)");
    else if (p) notes.push(p);
  }
  return notes.join(" · ");
}

/** Sample strings for the "try one" chips. Real, current-format User-Agents. */
export const SAMPLE_USER_AGENTS: { label: string; ua: string }[] = [
  { label: "Chrome · Windows", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" },
  { label: "Safari · iPhone", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1" },
  { label: "Chrome · Android", ua: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36" },
  { label: "Firefox · Linux", ua: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0" },
  { label: "Edge · macOS", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0" },
  { label: "Samsung Internet", ua: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36" },
  { label: "Googlebot", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  { label: "GPTBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot" },
  { label: "curl", ua: "curl/8.4.0" },
  { label: "Python requests", ua: "python-requests/2.31.0" },
];

export const majorVersion = major;
