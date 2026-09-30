/**
 * A dictionary of HTTP headers: what each one is for, where it applies and
 * where it is defined. The viewer uses it to explain pasted headers; the
 * generator and the header lookup pages use it for names and descriptions.
 */

export type HeaderKind = "request" | "response" | "both";

export type HeaderCategory =
  | "Content"
  | "Caching"
  | "Conditional"
  | "Authentication"
  | "Cookies"
  | "CORS"
  | "Security"
  | "Connection"
  | "Redirect"
  | "Negotiation"
  | "Range"
  | "Proxy"
  | "Client hints"
  | "Fetch metadata"
  | "Info"
  | "Rate limits"
  | "Reporting";

export interface HeaderInfo {
  name: string;
  kind: HeaderKind;
  category: HeaderCategory;
  summary: string;
  spec: string;
  example?: string;
  /** Still seen in the wild but should not be used. */
  deprecated?: boolean;
  /** Not defined by a standard (vendor or de-facto). */
  nonStandard?: boolean;
}

const H = (h: HeaderInfo): HeaderInfo => h;

export const HEADER_INFO: HeaderInfo[] = [
  // ----- Content
  H({ name: "Content-Type", kind: "both", category: "Content", summary: "The media type of the body, such as application/json or text/html, with optional parameters like charset.", spec: "RFC 9110 §8.3", example: "application/json; charset=utf-8" }),
  H({ name: "Content-Length", kind: "both", category: "Content", summary: "The size of the body in bytes. Lets the receiver know where the message ends and show progress.", spec: "RFC 9110 §8.6", example: "348" }),
  H({ name: "Content-Encoding", kind: "both", category: "Content", summary: "How the body was compressed (gzip, br, zstd, deflate). The client decodes it after receiving.", spec: "RFC 9110 §8.4", example: "gzip" }),
  H({ name: "Content-Language", kind: "both", category: "Content", summary: "The natural language of the intended audience for the body.", spec: "RFC 9110 §8.5", example: "en-GB" }),
  H({ name: "Content-Location", kind: "both", category: "Content", summary: "A URL for the returned representation, useful after content negotiation or for a created resource.", spec: "RFC 9110 §8.7", example: "/documents/foo.json" }),
  H({ name: "Content-Disposition", kind: "response", category: "Content", summary: "Whether the browser should display the body inline or download it, and under what file name. Also names each part of multipart/form-data.", spec: "RFC 6266", example: 'attachment; filename="report.pdf"' }),
  H({ name: "Content-Range", kind: "response", category: "Range", summary: "Which part of the whole resource this partial body covers.", spec: "RFC 9110 §14.4", example: "bytes 0-1023/146515" }),
  H({ name: "Content-Digest", kind: "both", category: "Content", summary: "A checksum of the body as sent, for integrity checking.", spec: "RFC 9530", example: "sha-256=:X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=:" }),
  H({ name: "Transfer-Encoding", kind: "both", category: "Connection", summary: "How the body is framed for transfer, most often chunked when the length is not known in advance. HTTP/2 does not use it.", spec: "RFC 9112 §6.1", example: "chunked" }),
  H({ name: "Trailer", kind: "both", category: "Connection", summary: "Names headers that will be sent after the body, in a chunked message.", spec: "RFC 9110 §6.6.2" }),

  // ----- Caching
  H({ name: "Cache-Control", kind: "both", category: "Caching", summary: "Directives that control who may cache the response and for how long: max-age, no-store, no-cache, private, public, must-revalidate, immutable.", spec: "RFC 9111 §5.2", example: "public, max-age=31536000, immutable" }),
  H({ name: "Expires", kind: "response", category: "Caching", summary: "The date after which the response is stale. Ignored when Cache-Control has max-age.", spec: "RFC 9111 §5.3", example: "Wed, 21 Oct 2026 07:28:00 GMT" }),
  H({ name: "Age", kind: "response", category: "Caching", summary: "Seconds the response has already spent in caches, as reported by a shared cache or CDN.", spec: "RFC 9111 §5.1", example: "241" }),
  H({ name: "Pragma", kind: "both", category: "Caching", summary: "Legacy HTTP/1.0 cache header. Pragma: no-cache is only meaningful in requests; use Cache-Control instead.", spec: "RFC 9111 §5.4", deprecated: true, example: "no-cache" }),
  H({ name: "Vary", kind: "response", category: "Caching", summary: "Request headers that change the response (Accept-Encoding, Origin…). Caches keep a separate copy per value.", spec: "RFC 9110 §12.5.5", example: "Accept-Encoding, Origin" }),
  H({ name: "Clear-Site-Data", kind: "response", category: "Caching", summary: "Asks the browser to clear cookies, storage or cache for the site — typically on logout.", spec: "W3C Clear Site Data", example: '"cache", "cookies", "storage"' }),
  H({ name: "Surrogate-Control", kind: "response", category: "Caching", summary: "Caching instructions aimed at CDNs and reverse proxies, not browsers.", spec: "Edge Architecture spec", nonStandard: true, example: "max-age=3600" }),
  H({ name: "CDN-Cache-Control", kind: "response", category: "Caching", summary: "Targeted cache control for CDNs, using Cache-Control syntax.", spec: "RFC 9213", example: "max-age=3600" }),
  H({ name: "Cache-Status", kind: "response", category: "Caching", summary: "Reports how each cache in the chain handled the request (hit, miss, stored).", spec: "RFC 9211", example: 'ExampleCDN; hit; ttl=300' }),
  H({ name: "Warning", kind: "response", category: "Caching", summary: "Advisory about possible problems with the response, such as staleness. Obsolete.", spec: "RFC 7234 (obsoleted)", deprecated: true }),

  // ----- Conditional
  H({ name: "ETag", kind: "response", category: "Conditional", summary: "An identifier for one version of the resource. Clients send it back in If-None-Match to check whether it changed.", spec: "RFC 9110 §8.8.3", example: '"33a64df551425fcc55e4d42a148795d9f25f89d4"' }),
  H({ name: "Last-Modified", kind: "response", category: "Conditional", summary: "When the resource last changed. Used with If-Modified-Since for cache validation.", spec: "RFC 9110 §8.8.2", example: "Tue, 15 Nov 2022 12:45:26 GMT" }),
  H({ name: "If-None-Match", kind: "request", category: "Conditional", summary: "Send the resource only if its ETag differs from these; otherwise answer 304 Not Modified.", spec: "RFC 9110 §13.1.2", example: '"33a64df5"' }),
  H({ name: "If-Modified-Since", kind: "request", category: "Conditional", summary: "Send the resource only if it changed after this date; otherwise 304 Not Modified.", spec: "RFC 9110 §13.1.3", example: "Tue, 15 Nov 2022 12:45:26 GMT" }),
  H({ name: "If-Match", kind: "request", category: "Conditional", summary: "Proceed only if the resource's current ETag matches. Used to avoid overwriting someone else's edit.", spec: "RFC 9110 §13.1.1", example: '"33a64df5"' }),
  H({ name: "If-Unmodified-Since", kind: "request", category: "Conditional", summary: "Proceed only if the resource has not changed since this date, else 412.", spec: "RFC 9110 §13.1.4" }),
  H({ name: "If-Range", kind: "request", category: "Range", summary: "Make a Range request conditional: get the range if unchanged, otherwise the whole resource.", spec: "RFC 9110 §13.1.5" }),

  // ----- Authentication
  H({ name: "Authorization", kind: "request", category: "Authentication", summary: "Credentials for the server: Basic (base64 user:password), Bearer token, Digest and more.", spec: "RFC 9110 §11.6.2", example: "Bearer eyJhbGciOi…" }),
  H({ name: "WWW-Authenticate", kind: "response", category: "Authentication", summary: "Sent with 401: names the authentication scheme and parameters the client should use.", spec: "RFC 9110 §11.6.1", example: 'Bearer realm="api"' }),
  H({ name: "Proxy-Authorization", kind: "request", category: "Authentication", summary: "Credentials for a proxy server.", spec: "RFC 9110 §11.7.2" }),
  H({ name: "Proxy-Authenticate", kind: "response", category: "Authentication", summary: "Sent with 407: the scheme a proxy requires.", spec: "RFC 9110 §11.7.1" }),

  // ----- Cookies
  H({ name: "Cookie", kind: "request", category: "Cookies", summary: "Cookies the browser sends back to the server, as name=value pairs.", spec: "RFC 6265 §5.4", example: "session=abc123; theme=dark" }),
  H({ name: "Set-Cookie", kind: "response", category: "Cookies", summary: "Tells the browser to store a cookie, with attributes such as Secure, HttpOnly, SameSite, Max-Age and Path.", spec: "RFC 6265bis", example: "session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax" }),

  // ----- CORS
  H({ name: "Origin", kind: "request", category: "CORS", summary: "Where a cross-origin or POST request comes from (scheme, host, port), so the server can apply CORS rules.", spec: "RFC 6454", example: "https://app.example.com" }),
  H({ name: "Access-Control-Allow-Origin", kind: "response", category: "CORS", summary: "Which origin may read the response from a cross-origin request: one origin, or * for any.", spec: "Fetch Standard", example: "https://app.example.com" }),
  H({ name: "Access-Control-Allow-Credentials", kind: "response", category: "CORS", summary: "true lets the page read responses to requests that include cookies or credentials. Cannot be combined with Allow-Origin: *.", spec: "Fetch Standard", example: "true" }),
  H({ name: "Access-Control-Allow-Methods", kind: "response", category: "CORS", summary: "Methods allowed for cross-origin requests; the reply to a preflight.", spec: "Fetch Standard", example: "GET, POST, PUT, DELETE" }),
  H({ name: "Access-Control-Allow-Headers", kind: "response", category: "CORS", summary: "Request headers a cross-origin request may carry; the reply to a preflight.", spec: "Fetch Standard", example: "Content-Type, Authorization" }),
  H({ name: "Access-Control-Expose-Headers", kind: "response", category: "CORS", summary: "Response headers that scripts on other origins may read. Others are hidden.", spec: "Fetch Standard", example: "X-Request-Id, ETag" }),
  H({ name: "Access-Control-Max-Age", kind: "response", category: "CORS", summary: "How many seconds the browser may cache a preflight result. Browsers cap it (Chrome at 2 hours).", spec: "Fetch Standard", example: "7200" }),
  H({ name: "Access-Control-Request-Method", kind: "request", category: "CORS", summary: "In a preflight: the method the real request will use.", spec: "Fetch Standard", example: "POST" }),
  H({ name: "Access-Control-Request-Headers", kind: "request", category: "CORS", summary: "In a preflight: the headers the real request will send.", spec: "Fetch Standard", example: "content-type, x-api-key" }),
  H({ name: "Timing-Allow-Origin", kind: "response", category: "CORS", summary: "Which origins may see detailed Resource Timing data for this response.", spec: "W3C Resource Timing", example: "*" }),

  // ----- Security
  H({ name: "Strict-Transport-Security", kind: "response", category: "Security", summary: "Tells browsers to use only HTTPS for this site for a period of time (HSTS).", spec: "RFC 6797", example: "max-age=63072000; includeSubDomains; preload" }),
  H({ name: "Content-Security-Policy", kind: "response", category: "Security", summary: "Whitelists where scripts, styles, images, frames and connections may come from; the main defence against XSS.", spec: "W3C CSP Level 3", example: "default-src 'self'; img-src 'self' data:" }),
  H({ name: "Content-Security-Policy-Report-Only", kind: "response", category: "Security", summary: "Tests a CSP without enforcing it: violations are reported but nothing is blocked.", spec: "W3C CSP Level 3" }),
  H({ name: "X-Content-Type-Options", kind: "response", category: "Security", summary: "nosniff stops browsers from guessing a file's type, which blocks a class of attacks where an upload is run as a script.", spec: "WHATWG Fetch", example: "nosniff" }),
  H({ name: "X-Frame-Options", kind: "response", category: "Security", summary: "Stops other sites from embedding the page in a frame (clickjacking). CSP frame-ancestors is the modern replacement.", spec: "RFC 7034", example: "DENY" }),
  H({ name: "X-XSS-Protection", kind: "response", category: "Security", summary: "Controlled the old built-in XSS filter, which is removed from modern browsers and could itself introduce vulnerabilities. Use 0 or omit it and rely on CSP.", spec: "None", deprecated: true, nonStandard: true, example: "0" }),
  H({ name: "Referrer-Policy", kind: "response", category: "Security", summary: "How much of the page's URL is sent in the Referer header when following links or loading resources.", spec: "W3C Referrer Policy", example: "strict-origin-when-cross-origin" }),
  H({ name: "Permissions-Policy", kind: "response", category: "Security", summary: "Turns browser features (camera, microphone, geolocation…) on or off for the page and its frames.", spec: "W3C Permissions Policy", example: "camera=(), microphone=(), geolocation=()" }),
  H({ name: "Feature-Policy", kind: "response", category: "Security", summary: "The earlier name of Permissions-Policy.", spec: "Superseded", deprecated: true }),
  H({ name: "Cross-Origin-Opener-Policy", kind: "response", category: "Security", summary: "Isolates the page's browsing context from windows it opens or that open it (needed for cross-origin isolation).", spec: "HTML Standard", example: "same-origin" }),
  H({ name: "Cross-Origin-Embedder-Policy", kind: "response", category: "Security", summary: "Requires every cross-origin resource to opt in to being loaded; with COOP it enables cross-origin isolation.", spec: "HTML Standard", example: "require-corp" }),
  H({ name: "Cross-Origin-Resource-Policy", kind: "response", category: "Security", summary: "Limits which sites may load this resource, protecting it from cross-site leaks such as Spectre.", spec: "Fetch Standard", example: "same-origin" }),
  H({ name: "Origin-Agent-Cluster", kind: "response", category: "Security", summary: "Requests that the page runs in an origin-keyed agent cluster, isolating it from other origins on the same site.", spec: "HTML Standard", example: "?1" }),
  H({ name: "X-Permitted-Cross-Domain-Policies", kind: "response", category: "Security", summary: "Controls whether Flash and PDF readers may load cross-domain policy files. Only relevant to legacy plugins.", spec: "Adobe", nonStandard: true, example: "none" }),
  H({ name: "X-DNS-Prefetch-Control", kind: "response", category: "Security", summary: "Turns browser DNS prefetching of links on or off.", spec: "None", nonStandard: true, example: "off" }),
  H({ name: "Public-Key-Pins", kind: "response", category: "Security", summary: "HTTP Public Key Pinning, removed from browsers because a mistake could lock visitors out of a site.", spec: "RFC 7469 (obsolete)", deprecated: true }),
  H({ name: "Expect-CT", kind: "response", category: "Security", summary: "Certificate Transparency enforcement; no longer needed since browsers require it for all certificates.", spec: "RFC 9163 (obsolete)", deprecated: true }),
  H({ name: "Upgrade-Insecure-Requests", kind: "request", category: "Security", summary: "The browser tells the server it prefers an encrypted, authenticated version of the page.", spec: "W3C UI Security", example: "1" }),
  H({ name: "Sec-GPC", kind: "request", category: "Security", summary: "Global Privacy Control: the user asks not to have their data sold or shared.", spec: "GPC spec", example: "1" }),
  H({ name: "DNT", kind: "request", category: "Security", summary: "Do Not Track. Dropped by browsers; superseded by Global Privacy Control.", spec: "Withdrawn", deprecated: true, example: "1" }),
  H({ name: "X-Robots-Tag", kind: "response", category: "Security", summary: "Tells search engines whether to index a resource or follow its links — a header-level version of the robots meta tag, useful for PDFs and images.", spec: "Google documentation", nonStandard: true, example: "noindex, nofollow" }),

  // ----- Connection & protocol
  H({ name: "Host", kind: "request", category: "Connection", summary: "The host and optional port the client is talking to, so one server can host many sites. Required in HTTP/1.1.", spec: "RFC 9110 §7.2", example: "www.example.com" }),
  H({ name: "Connection", kind: "both", category: "Connection", summary: "Controls whether the connection stays open (keep-alive) or closes, and lists hop-by-hop headers. Ignored in HTTP/2.", spec: "RFC 9110 §7.6.1", example: "keep-alive" }),
  H({ name: "Keep-Alive", kind: "both", category: "Connection", summary: "Timeout and maximum request count for a persistent HTTP/1.1 connection.", spec: "Informational", nonStandard: true, example: "timeout=5, max=1000" }),
  H({ name: "Upgrade", kind: "both", category: "Connection", summary: "Asks to switch protocol on the same connection, for example to WebSocket.", spec: "RFC 9110 §7.8", example: "websocket" }),
  H({ name: "TE", kind: "request", category: "Connection", summary: "Transfer codings the client accepts in the response, such as trailers.", spec: "RFC 9110 §10.1.4" }),
  H({ name: "Expect", kind: "request", category: "Connection", summary: "Expectations the server must meet before the body is sent, mainly 100-continue.", spec: "RFC 9110 §10.1.1", example: "100-continue" }),
  H({ name: "Alt-Svc", kind: "response", category: "Connection", summary: "Advertises another endpoint or protocol (HTTP/3 over QUIC) for the same site.", spec: "RFC 7838", example: 'h3=":443"; ma=86400' }),
  H({ name: "Early-Data", kind: "request", category: "Connection", summary: "Set by a proxy when the request arrived in TLS 1.3 early data (0-RTT) and could be replayed.", spec: "RFC 8470", example: "1" }),
  H({ name: "Via", kind: "both", category: "Proxy", summary: "Lists the proxies and gateways the message passed through.", spec: "RFC 9110 §7.6.3", example: "1.1 vegur, 1.1 varnish" }),
  H({ name: "Max-Forwards", kind: "request", category: "Proxy", summary: "Limits how many proxies a TRACE or OPTIONS request may pass through.", spec: "RFC 9110 §7.6.2" }),
  H({ name: "Forwarded", kind: "request", category: "Proxy", summary: "The standard header a proxy uses to pass the original client's IP, host and protocol to the server.", spec: "RFC 7239", example: "for=192.0.2.60;proto=https;by=203.0.113.43" }),
  H({ name: "X-Forwarded-For", kind: "request", category: "Proxy", summary: "The de-facto list of client IPs a proxy chain has seen, leftmost first. Easily spoofed unless set by a trusted proxy.", spec: "De-facto", nonStandard: true, example: "203.0.113.195, 70.41.3.18" }),
  H({ name: "X-Forwarded-Proto", kind: "request", category: "Proxy", summary: "The protocol (http or https) the client used to reach the proxy.", spec: "De-facto", nonStandard: true, example: "https" }),
  H({ name: "X-Forwarded-Host", kind: "request", category: "Proxy", summary: "The Host header the client originally asked for.", spec: "De-facto", nonStandard: true }),
  H({ name: "X-Real-IP", kind: "request", category: "Proxy", summary: "The client's IP as set by nginx or another proxy.", spec: "De-facto", nonStandard: true }),

  // ----- Redirect
  H({ name: "Location", kind: "response", category: "Redirect", summary: "Where to go next: the target of a redirect (3xx) or the URL of a newly created resource (201).", spec: "RFC 9110 §10.2.2", example: "https://example.com/new-page" }),
  H({ name: "Refresh", kind: "response", category: "Redirect", summary: "Reloads or redirects the page after a delay. Non-standard; a real redirect or meta refresh is preferred.", spec: "Non-standard", nonStandard: true, example: "5; url=https://example.com/" }),
  H({ name: "Link", kind: "response", category: "Redirect", summary: "Relations to other resources: preload, preconnect, canonical, pagination. Works like <link> in HTML.", spec: "RFC 8288", example: '</style.css>; rel=preload; as=style' }),
  H({ name: "Retry-After", kind: "response", category: "Rate limits", summary: "How long the client should wait before trying again, in seconds or as a date. Sent with 429, 503 and 3xx.", spec: "RFC 9110 §10.2.3", example: "120" }),
  H({ name: "Sunset", kind: "response", category: "Info", summary: "The date after which the resource or API is expected to stop working.", spec: "RFC 8594", example: "Sat, 31 Dec 2026 23:59:59 GMT" }),
  H({ name: "Deprecation", kind: "response", category: "Info", summary: "Marks an API resource as deprecated, optionally since a date.", spec: "RFC 9745", example: "@1688169599" }),

  // ----- Negotiation
  H({ name: "Accept", kind: "request", category: "Negotiation", summary: "The media types the client can handle, with q-values for preference.", spec: "RFC 9110 §12.5.1", example: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8" }),
  H({ name: "Accept-Encoding", kind: "request", category: "Negotiation", summary: "The compression algorithms the client supports.", spec: "RFC 9110 §12.5.3", example: "gzip, deflate, br, zstd" }),
  H({ name: "Accept-Language", kind: "request", category: "Negotiation", summary: "The languages the user prefers, with q-values.", spec: "RFC 9110 §12.5.4", example: "en-GB,en;q=0.9,hi;q=0.6" }),
  H({ name: "Accept-Charset", kind: "request", category: "Negotiation", summary: "Character sets the client accepts. Obsolete: everything is UTF-8 now.", spec: "RFC 9110 (obsolete)", deprecated: true }),
  H({ name: "Accept-Ranges", kind: "response", category: "Range", summary: "Whether the server supports byte-range requests (bytes) or not (none).", spec: "RFC 9110 §14.3", example: "bytes" }),
  H({ name: "Accept-Patch", kind: "response", category: "Negotiation", summary: "Patch document formats the server accepts with PATCH.", spec: "RFC 5789", example: "application/merge-patch+json" }),
  H({ name: "Allow", kind: "response", category: "Negotiation", summary: "The methods the resource supports. Required with 405.", spec: "RFC 9110 §10.2.1", example: "GET, HEAD, OPTIONS" }),
  H({ name: "Range", kind: "request", category: "Range", summary: "Ask for part of a resource, e.g. bytes=0-1023, for resumable downloads and video seeking.", spec: "RFC 9110 §14.2", example: "bytes=0-1023" }),
  H({ name: "Prefer", kind: "request", category: "Negotiation", summary: "Optional preferences such as return=minimal or respond-async.", spec: "RFC 7240", example: "return=representation" }),
  H({ name: "Idempotency-Key", kind: "request", category: "Negotiation", summary: "A unique key that lets a server recognise and safely ignore a repeated POST.", spec: "IETF draft", nonStandard: true, example: "8e03978e-40d5-43e8-bc93-6894a57f9324" }),

  // ----- Info
  H({ name: "User-Agent", kind: "request", category: "Info", summary: "Identifies the client software: browser, version, operating system, or the tool making the request.", spec: "RFC 9110 §10.1.5", example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) …" }),
  H({ name: "Referer", kind: "request", category: "Info", summary: "The URL of the page that linked to this request. The misspelling is in the original specification.", spec: "RFC 9110 §10.1.3", example: "https://example.com/page" }),
  H({ name: "From", kind: "request", category: "Info", summary: "An email address for the person or operator of a robot.", spec: "RFC 9110 §10.1.2" }),
  H({ name: "Date", kind: "both", category: "Info", summary: "When the message was created, in HTTP-date format.", spec: "RFC 9110 §6.6.1", example: "Tue, 15 Nov 2026 08:12:31 GMT" }),
  H({ name: "Server", kind: "response", category: "Info", summary: "The software that produced the response. Exposing exact versions helps attackers pick exploits.", spec: "RFC 9110 §10.2.4", example: "nginx" }),
  H({ name: "X-Powered-By", kind: "response", category: "Info", summary: "The framework behind the response (Express, PHP, ASP.NET). Reveals technology and is best removed.", spec: "De-facto", nonStandard: true, example: "Express" }),
  H({ name: "Server-Timing", kind: "response", category: "Info", summary: "Timings from the server (database, cache, render) shown in browser developer tools.", spec: "W3C Server Timing", example: 'db;dur=53, app;dur=47.2' }),
  H({ name: "X-Requested-With", kind: "request", category: "Info", summary: "XMLHttpRequest marks Ajax calls with this so servers can tell them from page loads. Also used as a CSRF hint.", spec: "De-facto", nonStandard: true, example: "XMLHttpRequest" }),
  H({ name: "X-Request-Id", kind: "both", category: "Info", summary: "A unique ID for correlating one request across logs and services.", spec: "De-facto", nonStandard: true }),
  H({ name: "Priority", kind: "request", category: "Info", summary: "The client's hint of how important the resource is, for HTTP/2 and HTTP/3 scheduling.", spec: "RFC 9218", example: "u=1, i" }),
  H({ name: "Save-Data", kind: "request", category: "Client hints", summary: "The user asked to use less data (a data-saver mode).", spec: "W3C Save-Data", example: "on" }),
  H({ name: "Speculation-Rules", kind: "response", category: "Info", summary: "Points to a rules file that tells the browser which pages to prefetch or prerender.", spec: "WICG Speculation Rules" }),

  // ----- Client hints & fetch metadata
  H({ name: "Accept-CH", kind: "response", category: "Client hints", summary: "The client hints the server would like browsers to send on later requests.", spec: "RFC 8942", example: "Sec-CH-UA-Platform, Sec-CH-UA-Mobile" }),
  H({ name: "Critical-CH", kind: "response", category: "Client hints", summary: "Hints the server needs on the first request; the browser retries with them if missing.", spec: "IETF draft" }),
  H({ name: "Sec-CH-UA", kind: "request", category: "Client hints", summary: "The browser brand and version list — the structured replacement for parsing the User-Agent string.", spec: "UA Client Hints", example: '"Chromium";v="124", "Google Chrome";v="124"' }),
  H({ name: "Sec-CH-UA-Mobile", kind: "request", category: "Client hints", summary: "Whether the browser wants a mobile experience (?1) or not (?0).", spec: "UA Client Hints", example: "?0" }),
  H({ name: "Sec-CH-UA-Platform", kind: "request", category: "Client hints", summary: "The operating system name.", spec: "UA Client Hints", example: '"Windows"' }),
  H({ name: "Sec-Fetch-Site", kind: "request", category: "Fetch metadata", summary: "Whether the request is same-origin, same-site, cross-site or user-initiated (none). Servers use it to block cross-site attacks.", spec: "Fetch Metadata", example: "same-origin" }),
  H({ name: "Sec-Fetch-Mode", kind: "request", category: "Fetch metadata", summary: "The request mode: navigate, cors, no-cors, same-origin or websocket.", spec: "Fetch Metadata", example: "cors" }),
  H({ name: "Sec-Fetch-Dest", kind: "request", category: "Fetch metadata", summary: "What the response will be used for: document, script, image, iframe…", spec: "Fetch Metadata", example: "document" }),
  H({ name: "Sec-Fetch-User", kind: "request", category: "Fetch metadata", summary: "Present (?1) when a navigation was triggered by a user action.", spec: "Fetch Metadata", example: "?1" }),

  // ----- Rate limits & reporting
  H({ name: "RateLimit-Limit", kind: "response", category: "Rate limits", summary: "The request quota in the current window (IETF draft; many APIs use X-RateLimit-Limit).", spec: "IETF draft", nonStandard: true, example: "100" }),
  H({ name: "RateLimit-Remaining", kind: "response", category: "Rate limits", summary: "Requests left in the current window.", spec: "IETF draft", nonStandard: true, example: "42" }),
  H({ name: "RateLimit-Reset", kind: "response", category: "Rate limits", summary: "Seconds (or a timestamp) until the window resets.", spec: "IETF draft", nonStandard: true, example: "30" }),
  H({ name: "NEL", kind: "response", category: "Reporting", summary: "Network Error Logging: asks browsers to report failed connections to the site.", spec: "W3C NEL", example: '{"report_to":"default","max_age":86400}' }),
  H({ name: "Report-To", kind: "response", category: "Reporting", summary: "Endpoints for browser reports. Replaced by Reporting-Endpoints.", spec: "Superseded", deprecated: true }),
  H({ name: "Reporting-Endpoints", kind: "response", category: "Reporting", summary: "Named endpoints where the browser sends CSP, crash and deprecation reports.", spec: "W3C Reporting API", example: 'default="https://example.com/reports"' }),
];

const BY_NAME = new Map(HEADER_INFO.map((h) => [h.name.toLowerCase(), h]));

export function getHeaderInfo(name: string): HeaderInfo | undefined {
  return BY_NAME.get(name.trim().toLowerCase());
}

export const HEADER_CATEGORIES: HeaderCategory[] = [
  "Content",
  "Caching",
  "Conditional",
  "Authentication",
  "Cookies",
  "CORS",
  "Security",
  "Connection",
  "Proxy",
  "Redirect",
  "Negotiation",
  "Range",
  "Client hints",
  "Fetch metadata",
  "Info",
  "Rate limits",
  "Reporting",
];
