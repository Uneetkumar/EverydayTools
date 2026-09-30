/**
 * HTTP status codes: the IANA registry (RFC 9110 and friends) plus the
 * non-standard codes people meet in real logs (nginx 499, Cloudflare 52x).
 * Wording follows RFC 9110's current names — "Content Too Large" rather than
 * "Payload Too Large", "Unprocessable Content" rather than "Unprocessable
 * Entity" — and lists the old names as `aka` so searches for either work.
 */

export type StatusClass = "1xx" | "2xx" | "3xx" | "4xx" | "5xx";

export interface StatusCode {
  code: number;
  name: string;
  /** Older or informal names people still search for. */
  aka?: string[];
  /** One plain sentence. */
  summary: string;
  /** When a server sends it and what the client should do. */
  when: string;
  /** For 4xx/5xx: what usually causes it and how to fix it. */
  fix?: string;
  /** Where it is defined. */
  spec: string;
  /** Not in the IANA registry (nginx, Cloudflare, frameworks). */
  unofficial?: boolean;
  /** Headers that normally go with this status. */
  headers?: string[];
  /** Whether a cache may store the response without explicit freshness information. */
  cacheable?: boolean;
  /** Whether repeating the same request is generally reasonable. */
  retry?: "yes" | "no" | "after";
  /** Related codes, for the "see also" row. */
  see?: number[];
  /** Deprecated or effectively unused. */
  obsolete?: boolean;
}

export const STATUS_CLASSES: Record<StatusClass, { name: string; blurb: string }> = {
  "1xx": { name: "Informational", blurb: "The request was received and the process continues. Interim responses that come before the final one." },
  "2xx": { name: "Success", blurb: "The request was received, understood and accepted." },
  "3xx": { name: "Redirection", blurb: "The client needs to take further action, usually to another URL, to complete the request." },
  "4xx": { name: "Client error", blurb: "The request is wrong in some way: bad syntax, missing credentials, or something that does not exist." },
  "5xx": { name: "Server error", blurb: "The request looked valid, but the server failed to handle it." },
};

export const statusClassOf = (code: number): StatusClass => `${Math.floor(code / 100)}xx` as StatusClass;

const S = (s: StatusCode): StatusCode => s;

export const STATUS_CODES: StatusCode[] = [
  // ---------------------------------------------------------------- 1xx
  S({ code: 100, name: "Continue", summary: "The headers were accepted; the client may send the request body.", when: "Sent in reply to a request carrying Expect: 100-continue, so a large upload is not sent if the server would reject it. Most clients and servers handle it without you noticing.", spec: "RFC 9110 §15.2.1", see: [417] }),
  S({ code: 101, name: "Switching Protocols", summary: "The server agrees to switch to the protocol the client asked for.", when: "The reply to a request with Upgrade, most often when a WebSocket connection opens (Upgrade: websocket) or a connection moves to HTTP/2 cleartext.", spec: "RFC 9110 §15.2.2", headers: ["Upgrade", "Connection"], see: [426] }),
  S({ code: 102, name: "Processing", summary: "The server has the request and is still working on it.", when: "A WebDAV interim response that stops a client giving up on a slow operation. It was dropped from the current WebDAV RFC and is rarely seen.", spec: "RFC 2518 (WebDAV)", obsolete: true }),
  S({ code: 103, name: "Early Hints", summary: "Preload hints sent before the final response is ready.", when: "The server sends Link headers early so the browser can start fetching CSS, fonts or scripts while the server is still building the page. Browser and CDN support varies, so treat it as an optimisation, never a requirement.", spec: "RFC 8297", headers: ["Link"] }),

  // ---------------------------------------------------------------- 2xx
  S({ code: 200, name: "OK", summary: "The request succeeded.", when: "The default success. For GET the body is the resource; for POST it describes the result of the action. If nothing meaningful comes back, 204 is more precise.", spec: "RFC 9110 §15.3.1", cacheable: true, see: [201, 204] }),
  S({ code: 201, name: "Created", summary: "The request succeeded and a new resource now exists.", when: "The right answer to a POST (or PUT) that creates something. Put the new resource's URL in the Location header and, usually, a representation of it in the body.", spec: "RFC 9110 §15.3.2", headers: ["Location", "ETag"], see: [200, 202] }),
  S({ code: 202, name: "Accepted", summary: "The request was accepted for processing, but is not finished.", when: "For asynchronous work: queue the job, answer 202 straight away, and give the client a status URL to poll (often in Location or Content-Location). The server makes no promise the work will succeed.", spec: "RFC 9110 §15.3.3", headers: ["Location", "Retry-After"], see: [201, 303] }),
  S({ code: 203, name: "Non-Authoritative Information", summary: "The response comes from a transforming proxy, not the origin server.", when: "A proxy changed the origin's 200 response (for example, rewrote content) and says so. Rare in practice.", spec: "RFC 9110 §15.3.4", cacheable: true }),
  S({ code: 204, name: "No Content", summary: "The request succeeded and there is nothing to send back.", when: "Common for DELETE and for PUT/PATCH when the client already has the state. The response must not have a body. A browser stays on the current page after a form gets a 204.", spec: "RFC 9110 §15.3.5", cacheable: true, see: [200, 205] }),
  S({ code: 205, name: "Reset Content", summary: "Succeeded; the client should reset the view that sent the request.", when: "Tells a browser to clear a form after a successful submit so new data can be typed. Seldom used.", spec: "RFC 9110 §15.3.6", see: [204] }),
  S({ code: 206, name: "Partial Content", summary: "Only part of the resource is in this response, as the Range header asked.", when: "Video seeking, resumed downloads and PDF viewers request byte ranges (Range: bytes=0-1023). The server answers 206 with Content-Range, or 416 when the range cannot be satisfied.", spec: "RFC 9110 §15.3.7", headers: ["Content-Range", "Accept-Ranges"], cacheable: true, see: [416] }),
  S({ code: 207, name: "Multi-Status", summary: "One response carrying separate status codes for several operations.", when: "A WebDAV reply (and some batch APIs) where the body is an XML document listing the status of each sub-request.", spec: "RFC 4918 §11.1", see: [208] }),
  S({ code: 208, name: "Already Reported", summary: "Members of a WebDAV binding were already listed earlier in the reply.", when: "Avoids listing the same resource twice inside a 207 response.", spec: "RFC 5842 §7.1", see: [207] }),
  S({ code: 226, name: "IM Used", summary: "The response is the result of instance manipulations applied to the current instance.", when: "Delta encoding (RFC 3229). Practically unused on the modern web.", spec: "RFC 3229 §10.4.1", obsolete: true }),

  // ---------------------------------------------------------------- 3xx
  S({ code: 300, name: "Multiple Choices", summary: "There are several possible responses; the client should choose one.", when: "The server offers a list of representations (different formats or languages). Almost no site uses it, because there is no standard way to present the choice.", spec: "RFC 9110 §15.4.1", cacheable: true, headers: ["Location"] }),
  S({ code: 301, name: "Moved Permanently", summary: "The resource has a new permanent URL; use it from now on.", when: "The SEO-friendly redirect for moved pages and http→https or www canonicalisation. Browsers and search engines cache it and transfer ranking signals. Old clients may change POST to GET, so use 308 to keep the method.", spec: "RFC 9110 §15.4.2", headers: ["Location"], cacheable: true, see: [308, 302] }),
  S({ code: 302, name: "Found", aka: ["Moved Temporarily"], summary: "The resource is temporarily at another URL; keep using the original.", when: "A temporary redirect, such as sending a signed-out visitor to a login page. Historically clients rewrote POST to GET; 303 and 307 exist to make each behaviour explicit.", spec: "RFC 9110 §15.4.3", headers: ["Location"], see: [303, 307, 301] }),
  S({ code: 303, name: "See Other", summary: "The result is at another URL; fetch it with GET.", when: "Used after a POST to redirect the browser to a result page so a refresh does not resubmit the form (the Post/Redirect/Get pattern). Also points to a status resource after a 202.", spec: "RFC 9110 §15.4.4", headers: ["Location"], see: [302, 307] }),
  S({ code: 304, name: "Not Modified", summary: "The cached copy is still valid; no body is sent.", when: "The answer to a conditional request (If-None-Match with an ETag, or If-Modified-Since). It saves bandwidth: the browser reuses what it stored. No body, and the headers refresh the cache entry.", spec: "RFC 9110 §15.4.5", headers: ["ETag", "Cache-Control", "Last-Modified"], cacheable: true }),
  S({ code: 305, name: "Use Proxy", summary: "The resource must be accessed through a given proxy.", when: "Deprecated for security reasons and ignored by modern clients.", spec: "RFC 7231 (deprecated)", obsolete: true }),
  S({ code: 306, name: "(Unused)", summary: "Reserved. It was once \"Switch Proxy\".", when: "No longer used; the number stays reserved.", spec: "RFC 9110 §15.4.7", obsolete: true }),
  S({ code: 307, name: "Temporary Redirect", summary: "Repeat the same request, same method and body, at another URL.", when: "The strict version of 302: the client must not change the method, so a POST stays a POST. Used for temporary maintenance redirects and by HSTS-internal redirects in browsers.", spec: "RFC 9110 §15.4.8", headers: ["Location"], see: [302, 308] }),
  S({ code: 308, name: "Permanent Redirect", summary: "Permanently moved; repeat the same method and body at the new URL.", when: "The strict version of 301. Use it when the redirect covers POST or PUT endpoints, for example an API that moved host. Search engines treat it like 301.", spec: "RFC 9110 §15.4.9", headers: ["Location"], cacheable: true, see: [301, 307] }),

  // ---------------------------------------------------------------- 4xx
  S({ code: 400, name: "Bad Request", summary: "The server cannot process the request because it is malformed.", when: "Malformed JSON, a missing required field, an invalid query parameter, an oversized cookie or a broken request line. Return an error body that says which field is wrong.", fix: "Check the request against the API docs: valid JSON, correct Content-Type, required fields present, no stray characters in the URL. In a browser, clear the site's cookies — a corrupt or oversized cookie is a common cause.", spec: "RFC 9110 §15.5.1", retry: "no", see: [422, 415] }),
  S({ code: 401, name: "Unauthorized", summary: "The request has no valid credentials.", when: "Despite the name it means unauthenticated: the credentials are missing, expired or wrong. The response must include WWW-Authenticate naming the scheme (Basic, Bearer…). Authenticated but not allowed is 403.", fix: "Send an Authorization header with a valid token or credentials, refresh an expired token, and check you're using the right scheme (Bearer vs Basic) and environment.", spec: "RFC 9110 §15.5.2", headers: ["WWW-Authenticate"], retry: "no", see: [403, 407] }),
  S({ code: 402, name: "Payment Required", summary: "Reserved for future use; some APIs use it for billing problems.", when: "The standard never defined it, so behaviour is up to the service. Stripe and other APIs return it when a payment or plan limit blocks the call.", fix: "Read the response body: it usually names the missing payment method, unpaid invoice or exhausted plan.", spec: "RFC 9110 §15.5.3", retry: "no" }),
  S({ code: 403, name: "Forbidden", summary: "The server understood the request but refuses to allow it.", when: "You are known (or the resource does not care who you are) but you lack permission: wrong role, IP block, disabled directory listing, a WAF rule or a missing CSRF token. Repeating the request with the same credentials will not help.", fix: "Check the account's permissions or scopes, IP allow-lists, CORS/CSRF settings and file permissions on the server. A WAF or CDN rule is a frequent culprit — look at its logs.", spec: "RFC 9110 §15.5.4", retry: "no", see: [401, 404] }),
  S({ code: 404, name: "Not Found", summary: "The server cannot find the requested resource.", when: "The URL does not map to anything. Servers also return 404 instead of 403 to hide that a private resource exists. A URL that is gone for good should be 410; a moved one should redirect.", fix: "Check the URL for typos and case, the route or file exists on the deployed version, the base path and trailing-slash handling, and that the resource was not deleted or renamed.", spec: "RFC 9110 §15.5.5", cacheable: true, retry: "no", see: [410, 301] }),
  S({ code: 405, name: "Method Not Allowed", summary: "The method is not supported for this resource.", when: "For example POST to a read-only URL. The response must include an Allow header listing the methods that work.", fix: "Use one of the methods in the Allow header. If it looks right, check for a redirect that turned POST into GET, a route that only registers GET, or a proxy that blocks PUT and DELETE.", spec: "RFC 9110 §15.5.6", headers: ["Allow"], cacheable: true, retry: "no", see: [501] }),
  S({ code: 406, name: "Not Acceptable", summary: "The server cannot produce a response matching the Accept headers.", when: "The client asked for a representation (Accept, Accept-Language, Accept-Encoding) the server cannot generate. Many servers ignore Accept and send what they have instead.", fix: "Loosen the Accept header (for example */*) or request a format the API supports.", spec: "RFC 9110 §15.5.7", retry: "no", see: [415] }),
  S({ code: 407, name: "Proxy Authentication Required", summary: "The proxy needs credentials before it will forward the request.", when: "Like 401 but for a proxy: the reply carries Proxy-Authenticate.", fix: "Provide proxy credentials (Proxy-Authorization) or configure the proxy settings of your client or system.", spec: "RFC 9110 §15.5.8", headers: ["Proxy-Authenticate"], retry: "no", see: [401] }),
  S({ code: 408, name: "Request Timeout", summary: "The server gave up waiting for the client to finish sending the request.", when: "The connection was open but the request did not arrive in time (slow uplink, stalled upload). The server may close the connection.", fix: "Retry, check the client's network, and raise the server's client-read timeouts if legitimate uploads are slow.", spec: "RFC 9110 §15.5.9", retry: "yes", see: [504] }),
  S({ code: 409, name: "Conflict", summary: "The request conflicts with the current state of the resource.", when: "Editing conflicts, creating something that already exists (duplicate username), or a version mismatch. The body should explain how to resolve it.", fix: "Fetch the latest state, resolve the difference (merge, pick another value) and try again.", spec: "RFC 9110 §15.5.10", retry: "no", see: [412] }),
  S({ code: 410, name: "Gone", summary: "The resource existed but has been permanently removed.", when: "Stronger than 404: the server knows it is gone for good and has no forwarding address. Search engines drop 410 pages a little faster than 404.", fix: "Stop requesting it and update links. Servers use 410 for deliberately deleted content.", spec: "RFC 9110 §15.5.11", cacheable: true, retry: "no", see: [404] }),
  S({ code: 411, name: "Length Required", summary: "The server requires a Content-Length header.", when: "The request has a body but no Content-Length, and the server will not accept chunked encoding.", fix: "Send Content-Length with the exact body size.", spec: "RFC 9110 §15.5.12", retry: "no" }),
  S({ code: 412, name: "Precondition Failed", summary: "A condition in the request headers was not met.", when: "An If-Match or If-Unmodified-Since header did not match the resource's current state — the standard way to detect a lost update (optimistic concurrency).", fix: "Re-fetch the resource to get the current ETag, re-apply your change and resend.", spec: "RFC 9110 §15.5.13", headers: ["ETag"], retry: "no", see: [409, 428] }),
  S({ code: 413, name: "Content Too Large", aka: ["Payload Too Large", "Request Entity Too Large"], summary: "The request body is larger than the server will accept.", when: "An upload exceeds a limit. Nginx (client_max_body_size, default 1 MB), Apache, PHP (upload_max_filesize), Express body parsers and CDNs all set their own limits.", fix: "Send less data, or raise the limit at every layer between client and application — the smallest one wins.", spec: "RFC 9110 §15.5.14", headers: ["Retry-After"], retry: "no" }),
  S({ code: 414, name: "URI Too Long", aka: ["Request-URI Too Long"], summary: "The URL is longer than the server will process.", when: "Usually a form or search that put far too much data in the query string, or a redirect loop that keeps appending parameters. Practical limits are about 8 KB on most servers.", fix: "Send the data in a POST body instead, and check for a redirect loop that grows the URL.", spec: "RFC 9110 §15.5.15", retry: "no" }),
  S({ code: 415, name: "Unsupported Media Type", summary: "The server does not accept the request body's format.", when: "The Content-Type is wrong or unsupported: sending form data to a JSON-only endpoint, or JSON without the Content-Type header.", fix: "Set Content-Type to what the endpoint expects (usually application/json) and make sure the body really is in that format.", spec: "RFC 9110 §15.5.16", headers: ["Accept", "Accept-Encoding"], retry: "no", see: [406, 400] }),
  S({ code: 416, name: "Range Not Satisfiable", aka: ["Requested Range Not Satisfiable"], summary: "None of the requested byte ranges overlap the resource.", when: "A Range request starts past the end of the file, often a resumed download of a file that has since changed. The reply has Content-Range: bytes */length.", fix: "Drop the Range header and download again from the start.", spec: "RFC 9110 §15.5.17", headers: ["Content-Range"], retry: "no", see: [206] }),
  S({ code: 417, name: "Expectation Failed", summary: "The server cannot meet the requirement in the Expect header.", when: "The client sent Expect (usually 100-continue) and the server or a proxy cannot honour it.", fix: "Remove the Expect header. Some HTTP libraries add Expect: 100-continue to large POSTs; turn that off.", spec: "RFC 9110 §15.5.18", retry: "no", see: [100] }),
  S({ code: 418, name: "I'm a teapot", summary: "An April Fools' joke code that servers still use.", when: "Defined in the Hyper Text Coffee Pot Control Protocol (RFC 2324) and kept reserved in the registry. Some servers return it to reject bot traffic or as an Easter egg.", spec: "RFC 2324, RFC 9110 §15.5.19", unofficial: true }),
  S({ code: 419, name: "Page Expired", summary: "A Laravel-specific code for an expired session or CSRF token.", when: "Laravel returns it when the CSRF token in a form is missing or stale — for example after the page sat open past the session lifetime.", fix: "Reload the page to get a fresh token, make sure the form includes @csrf, and check that session cookies are being saved.", spec: "Laravel framework", unofficial: true, retry: "no" }),
  S({ code: 421, name: "Misdirected Request", summary: "The request was sent to a server that cannot produce a response for it.", when: "HTTP/2 connection reuse: the client sent a request for one host over a connection whose certificate or configuration only covers another.", fix: "Open a new connection for that host. If it persists, check the TLS certificate covers the hostname and the virtual host configuration.", spec: "RFC 9110 §15.5.20", retry: "yes" }),
  S({ code: 422, name: "Unprocessable Content", aka: ["Unprocessable Entity"], summary: "The syntax is valid but the content cannot be processed.", when: "The most common REST validation error: the JSON parsed fine, but a value fails business rules (email format, a required field is empty, an out-of-range number). Frameworks such as Rails, Laravel and FastAPI use it. Return the list of field errors.", fix: "Read the response body for per-field messages and correct the values.", spec: "RFC 9110 §15.5.21", retry: "no", see: [400] }),
  S({ code: 423, name: "Locked", summary: "The resource is locked.", when: "A WebDAV lock prevents the operation, for instance someone else has the document checked out.", fix: "Wait until the lock is released or unlock it if you own it.", spec: "RFC 4918 §11.3", retry: "after" }),
  S({ code: 424, name: "Failed Dependency", summary: "The request failed because an earlier one it depended on failed.", when: "Inside a WebDAV multi-status: one action failed, so the ones that relied on it were skipped.", spec: "RFC 4918 §11.4", retry: "no" }),
  S({ code: 425, name: "Too Early", summary: "The server will not risk processing a request that could be replayed.", when: "TLS 1.3 early data (0-RTT) can be replayed by an attacker; a server declines non-idempotent requests sent that way.", fix: "The client should retry after the TLS handshake completes. Browsers do this automatically.", spec: "RFC 8470", retry: "yes" }),
  S({ code: 426, name: "Upgrade Required", summary: "The client must switch to a different protocol.", when: "The server refuses the current protocol (for example plain HTTP/1.0 or old TLS) and names the required one in Upgrade.", fix: "Use the protocol or TLS version in the Upgrade header, such as TLS 1.2 or higher.", spec: "RFC 9110 §15.5.22", headers: ["Upgrade"], retry: "no", see: [101] }),
  S({ code: 428, name: "Precondition Required", summary: "The server requires the request to be conditional.", when: "Forces clients to send If-Match so two people editing the same resource cannot overwrite each other silently.", fix: "Fetch the resource, then send your update with If-Match: <its ETag>.", spec: "RFC 6585 §3", retry: "no", see: [412] }),
  S({ code: 429, name: "Too Many Requests", summary: "The client has sent too many requests in a given time (rate limiting).", when: "An API quota or rate limit was hit. Good servers add Retry-After (seconds or a date) and often RateLimit-* headers so clients can back off.", fix: "Wait for Retry-After, slow down, add exponential backoff with jitter, cache results, or ask for a higher quota.", spec: "RFC 6585 §4", headers: ["Retry-After", "RateLimit-Limit", "RateLimit-Remaining"], retry: "after", see: [503] }),
  S({ code: 431, name: "Request Header Fields Too Large", summary: "The request headers, individually or together, are too large.", when: "Usually an oversized Cookie header that grew over time, or a huge Authorization token. Node.js defaults to 16 KB, nginx to 8 KB.", fix: "Clear cookies for the site, trim what you store in cookies and tokens, or raise the server's header-size limit.", spec: "RFC 6585 §5", retry: "no", see: [400, 494] }),
  S({ code: 444, name: "No Response", summary: "Nginx closed the connection without sending a response.", when: "A non-standard nginx code, set with `return 444;` to drop unwanted requests such as scanners. The client sees a connection reset; nobody normally sees the number except in logs.", spec: "nginx", unofficial: true }),
  S({ code: 451, name: "Unavailable For Legal Reasons", summary: "Access is denied for legal reasons.", when: "The server blocks the resource because of a court order, government demand or similar. The number is a nod to Fahrenheit 451. The body should say who requires the block.", spec: "RFC 7725", headers: ["Link"], cacheable: true, retry: "no", see: [403] }),
  S({ code: 494, name: "Request Header Too Large", summary: "Nginx rejected the request because its headers are too big.", when: "An nginx-internal code that becomes a 400 for the client. Triggered when large_client_header_buffers is exceeded, often by a giant cookie.", fix: "Clear cookies or increase large_client_header_buffers in nginx.", spec: "nginx", unofficial: true, see: [431] }),
  S({ code: 495, name: "SSL Certificate Error", summary: "Nginx: the client certificate could not be verified.", when: "Set when ssl_verify_client is on and the client presented an invalid certificate. Logged as 495, shown as 400 to the client.", fix: "Send a valid client certificate signed by the CA the server trusts.", spec: "nginx", unofficial: true }),
  S({ code: 496, name: "SSL Certificate Required", summary: "Nginx: a client certificate is required but none was sent.", when: "Mutual TLS is enforced and the client offered no certificate.", fix: "Configure the client with a certificate and private key.", spec: "nginx", unofficial: true }),
  S({ code: 497, name: "HTTP Request Sent to HTTPS Port", summary: "Nginx: a plain HTTP request arrived on an HTTPS port.", when: "Someone opened http://host:443. Nginx normally redirects it to https.", fix: "Use https:// for that port, or add an HTTP listener that redirects.", spec: "nginx", unofficial: true }),
  S({ code: 499, name: "Client Closed Request", summary: "Nginx: the client hung up before the server answered.", when: "Seen only in nginx logs. The user navigated away, cancelled the request, or a client or load-balancer timeout was shorter than the upstream's response time.", fix: "If it is frequent, requests are too slow: speed up the upstream, or raise the client timeout.", spec: "nginx", unofficial: true, see: [504] }),

  // ---------------------------------------------------------------- 5xx
  S({ code: 500, name: "Internal Server Error", summary: "The server hit an unexpected condition and could not complete the request.", when: "The catch-all for unhandled exceptions, bad configuration and crashes. The problem is on the server; the request itself may be fine.", fix: "Read the server or application error log for the stack trace. As a visitor: reload once, then try later or contact the site. As an API client: retry with backoff, and report it if it persists.", spec: "RFC 9110 §15.6.1", retry: "after", see: [502, 503] }),
  S({ code: 501, name: "Not Implemented", summary: "The server does not support the functionality needed for the request.", when: "The server does not recognise the method at all (as opposed to 405, where it knows the method but not for this resource).", fix: "Use a standard method the server supports, or check whether a proxy blocks it.", spec: "RFC 9110 §15.6.2", cacheable: true, retry: "no", see: [405] }),
  S({ code: 502, name: "Bad Gateway", summary: "A gateway or proxy got an invalid response from the upstream server.", when: "A reverse proxy, load balancer or CDN (nginx, Cloudflare, AWS ALB) could not get a proper answer from your application: it crashed, is restarting, listens on another port, or sent garbage.", fix: "Check the upstream app is running and reachable from the proxy (port, socket, firewall), look at its crash log, and check proxy_pass/upstream settings and timeouts.", spec: "RFC 9110 §15.6.3", retry: "after", see: [503, 504] }),
  S({ code: 503, name: "Service Unavailable", summary: "The server is temporarily unable to handle the request.", when: "Overload or planned maintenance. A well-behaved server adds Retry-After. Search engines treat a short 503 as \"come back later\" and do not drop the page, which makes it the right code for maintenance pages.", fix: "Wait and retry. As an operator: scale up, check for a crashed process or exhausted connection pool, and send Retry-After.", spec: "RFC 9110 §15.6.4", headers: ["Retry-After"], retry: "after", see: [502, 429] }),
  S({ code: 504, name: "Gateway Timeout", summary: "A gateway or proxy did not get a response from the upstream in time.", when: "Your application took longer than the proxy allows to answer (nginx proxy_read_timeout, Cloudflare's 100 s, AWS ALB's 60 s). The app may still be working.", fix: "Speed up the slow endpoint, move long jobs to a background queue (answer 202), or raise the proxy timeout for that route.", spec: "RFC 9110 §15.6.5", retry: "after", see: [502, 408, 524] }),
  S({ code: 505, name: "HTTP Version Not Supported", summary: "The server does not support the HTTP version in the request.", when: "The client used a version the server refuses, such as HTTP/0.9 or a future one.", fix: "Use HTTP/1.1 or HTTP/2.", spec: "RFC 9110 §15.6.6", retry: "no" }),
  S({ code: 506, name: "Variant Also Negotiates", summary: "A configuration error in transparent content negotiation.", when: "The chosen variant is itself set up to negotiate, creating a circular reference. Very rare.", spec: "RFC 2295 §8.1", retry: "no" }),
  S({ code: 507, name: "Insufficient Storage", summary: "The server cannot store what is needed to complete the request.", when: "WebDAV: the disk or quota is full. Some object stores return it as well.", fix: "Free space or raise the quota.", spec: "RFC 4918 §11.5", retry: "after" }),
  S({ code: 508, name: "Loop Detected", summary: "The server found an infinite loop while processing the request.", when: "A WebDAV request with Depth: infinity hit a cycle of bindings.", spec: "RFC 5842 §7.2", retry: "no" }),
  S({ code: 509, name: "Bandwidth Limit Exceeded", summary: "The site went over its allowed bandwidth.", when: "A non-standard code from Apache modules and hosting panels such as cPanel when the account's transfer quota is used up.", fix: "Wait for the quota to reset, or upgrade the hosting plan.", spec: "Apache / cPanel", unofficial: true, retry: "after" }),
  S({ code: 510, name: "Not Extended", summary: "The request needs further extensions the server does not have.", when: "Defined for the HTTP Extension Framework, which was never widely adopted. Obsolete.", spec: "RFC 2774 (obsoleted)", obsolete: true }),
  S({ code: 511, name: "Network Authentication Required", summary: "The client must authenticate to gain network access.", when: "Sent by captive portals — hotel, airport or café Wi-Fi that intercepts traffic until you sign in.", fix: "Open any http:// page in a browser and complete the Wi-Fi sign-in.", spec: "RFC 6585 §6", retry: "no" }),
  S({ code: 520, name: "Web Server Returned an Unknown Error", summary: "Cloudflare: the origin sent an empty, oversized or otherwise unexpected response.", when: "Cloudflare's catch-all for an origin that crashed, closed the connection early, or returned headers over its size limit.", fix: "Check the origin's error log, look for oversized headers or cookies, and test the origin directly, bypassing Cloudflare.", spec: "Cloudflare", unofficial: true, retry: "after", see: [502] }),
  S({ code: 521, name: "Web Server Is Down", summary: "Cloudflare: the origin refused the connection.", when: "Cloudflare could reach the network but the web server on it is off or blocking Cloudflare's IP ranges.", fix: "Start the web server, and allow Cloudflare's IP ranges through the firewall.", spec: "Cloudflare", unofficial: true, retry: "after" }),
  S({ code: 522, name: "Connection Timed Out", summary: "Cloudflare could not open a TCP connection to the origin in time.", when: "The origin is overloaded, unreachable, or Cloudflare's IPs are being dropped by a firewall or rate limiter.", fix: "Check origin availability and firewall rules, and that the origin IP set in Cloudflare DNS is right.", spec: "Cloudflare", unofficial: true, retry: "after" }),
  S({ code: 523, name: "Origin Is Unreachable", summary: "Cloudflare could not find a route to the origin server.", when: "DNS points at the wrong IP or the origin network is down.", fix: "Verify the A/AAAA records Cloudflare uses and the origin's network status.", spec: "Cloudflare", unofficial: true, retry: "after" }),
  S({ code: 524, name: "A Timeout Occurred", summary: "Cloudflare connected to the origin but got no response within 100 seconds.", when: "A long-running request. Cloudflare's default limit is 100 s on most plans.", fix: "Return 202 and finish the job in the background, or split the work into smaller requests.", spec: "Cloudflare", unofficial: true, retry: "after", see: [504] }),
  S({ code: 525, name: "SSL Handshake Failed", summary: "Cloudflare could not complete a TLS handshake with the origin.", when: "The origin has no valid TLS setup for the mode chosen in Cloudflare, or supports no protocol version and cipher Cloudflare offers.", fix: "Enable HTTPS on the origin with a valid certificate, or lower Cloudflare's SSL mode to match it.", spec: "Cloudflare", unofficial: true }),
  S({ code: 526, name: "Invalid SSL Certificate", summary: "Cloudflare could not validate the origin's TLS certificate.", when: "The origin certificate is expired, self-signed or for another hostname while Cloudflare's SSL mode is Full (strict).", fix: "Install a valid certificate (or a free Cloudflare Origin CA certificate) on the origin.", spec: "Cloudflare", unofficial: true }),
  S({ code: 530, name: "Origin Error (1xxx)", summary: "Cloudflare: returned together with a 1xxx error page, often a DNS problem.", when: "Usually accompanies error 1016 (origin DNS error) or another 1xxx code shown on the page.", fix: "Read the 1xxx code on the error page; it names the real problem, most often a wrong or missing DNS record for the origin.", spec: "Cloudflare", unofficial: true }),
];

export const STATUS_BY_CODE = new Map(STATUS_CODES.map((s) => [s.code, s]));

export function getStatus(code: number): StatusCode | undefined {
  return STATUS_BY_CODE.get(code);
}

/**
 * Ranked search over code, name, old names and description. Numbers match a
 * code exactly ("404"), by prefix ("4" lists the 4xx class, "40" lists 40x)
 * and words match names and summaries.
 */
export function searchStatus(query: string, list: StatusCode[] = STATUS_CODES): StatusCode[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  if (/^[1-5]xx$/.test(q)) return list.filter((s) => statusClassOf(s.code) === q);
  if (/^\d{1,3}$/.test(q)) {
    const exact = list.filter((s) => String(s.code) === q);
    const prefix = list.filter((s) => String(s.code).startsWith(q) && String(s.code) !== q);
    return [...exact, ...prefix];
  }
  const words = q.split(/[^a-z0-9']+/).filter(Boolean);
  const scored = list
    .map((s) => {
      const name = s.name.toLowerCase();
      const alt = (s.aka ?? []).join(" ").toLowerCase();
      const text = `${s.summary} ${s.when} ${s.fix ?? ""}`.toLowerCase();
      let score = 0;
      if (name === q || (s.aka ?? []).some((a) => a.toLowerCase() === q)) score += 100;
      else if (name.includes(q) || alt.includes(q)) score += 60;
      for (const w of words) {
        if (name.includes(w)) score += 10;
        else if (alt.includes(w)) score += 8;
        else if (text.includes(w)) score += 2;
        else return { s, score: 0 };
      }
      return { s, score };
    })
    .filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score || a.s.code - b.s.code);
  return scored.map((x) => x.s);
}
