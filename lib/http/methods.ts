/**
 * HTTP methods with the properties RFC 9110 §9 defines for each, so people
 * can look up whether a method is safe, idempotent and cacheable instead of
 * guessing. `notes` carries the practical advice that trips people up.
 */

export type MethodGroup = "core" | "patch" | "webdav";

export interface HttpMethod {
  name: string;
  group: MethodGroup;
  purpose: string;
  /** Read-only: does not change server state. */
  safe: boolean;
  /** Sending it N times leaves the same state as sending it once. */
  idempotent: boolean;
  cacheable: "yes" | "conditional" | "no";
  requestBody: "none" | "optional" | "expected";
  responseBody: "yes" | "no" | "optional";
  /** Success codes you would normally expect back. */
  success: number[];
  /** What it maps to in a REST API, if anything. */
  rest?: string;
  spec: string;
  notes: string[];
  /** Example request line and headers. */
  example: string;
}

export const HTTP_METHODS: HttpMethod[] = [
  {
    name: "GET",
    group: "core",
    purpose: "Retrieve a representation of a resource.",
    safe: true,
    idempotent: true,
    cacheable: "yes",
    requestBody: "none",
    responseBody: "yes",
    success: [200, 206, 304],
    rest: "Read one item or a list",
    spec: "RFC 9110 §9.3.1",
    notes: [
      "Must not change server state — search engines, prefetchers and link checkers call GET freely, so a GET that deletes something will eventually be triggered by a crawler.",
      "A body on a GET request has no defined meaning and is dropped by many servers and proxies. Use query parameters, or POST (or QUERY where supported) for large searches.",
      "Keep secrets out of the URL: it ends up in logs, history and Referer headers.",
    ],
    example: "GET /api/users/42 HTTP/1.1\nHost: api.example.com\nAccept: application/json",
  },
  {
    name: "HEAD",
    group: "core",
    purpose: "Same as GET but the server sends headers only, with no body.",
    safe: true,
    idempotent: true,
    cacheable: "yes",
    requestBody: "none",
    responseBody: "no",
    success: [200, 304],
    rest: "Check that something exists, or read its size and ETag",
    spec: "RFC 9110 §9.3.2",
    notes: [
      "The headers must match what GET would return, including Content-Length, so it is the cheap way to check a file's size or freshness before downloading.",
      "Link checkers use HEAD to test URLs without transferring pages; a few servers mishandle it and answer 405.",
    ],
    example: "HEAD /files/report.pdf HTTP/1.1\nHost: cdn.example.com",
  },
  {
    name: "POST",
    group: "core",
    purpose: "Submit data for the resource to process; often creates something.",
    safe: false,
    idempotent: false,
    cacheable: "conditional",
    requestBody: "expected",
    responseBody: "yes",
    success: [200, 201, 202, 204, 303],
    rest: "Create an item, or run an action that fits no other method",
    spec: "RFC 9110 §9.3.3",
    notes: [
      "Not idempotent: a retry can create a duplicate. APIs that must survive retries accept an Idempotency-Key header and remember it.",
      "Answer 201 with a Location header when a resource is created, or 303 to redirect the browser to a result page (Post/Redirect/Get).",
      "Responses are only cacheable when they carry explicit freshness information and a Content-Location, so in practice they are not cached.",
    ],
    example: "POST /api/users HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\n\n{\"name\":\"Ada\"}",
  },
  {
    name: "PUT",
    group: "core",
    purpose: "Replace the resource at this URL with the request body, or create it there.",
    safe: false,
    idempotent: true,
    cacheable: "no",
    requestBody: "expected",
    responseBody: "optional",
    success: [200, 201, 204],
    rest: "Replace an item completely",
    spec: "RFC 9110 §9.3.4",
    notes: [
      "The body is the complete new state. Fields you leave out are removed, which is why partial changes should use PATCH.",
      "Idempotent: sending the same PUT twice leaves the same result, so it is safe to retry after a timeout.",
      "Answer 201 if it created the resource, 200 or 204 if it replaced one. Send If-Match to avoid overwriting someone else's change.",
    ],
    example: "PUT /api/users/42 HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\nIf-Match: \"v7\"\n\n{\"name\":\"Ada\",\"role\":\"admin\"}",
  },
  {
    name: "PATCH",
    group: "patch",
    purpose: "Apply a partial modification to a resource.",
    safe: false,
    idempotent: false,
    cacheable: "conditional",
    requestBody: "expected",
    responseBody: "optional",
    success: [200, 204],
    rest: "Update some fields of an item",
    spec: "RFC 5789",
    notes: [
      "Not guaranteed idempotent: \"add 1 to the counter\" changes the result each time, while \"set status to shipped\" does not. The patch format decides.",
      "The body is a patch document, not a full resource. Use a defined format: JSON Merge Patch (application/merge-patch+json, RFC 7396) or JSON Patch (application/json-patch+json, RFC 6902).",
      "Some clients and proxies still reject PATCH; check before relying on it from older environments.",
    ],
    example: "PATCH /api/users/42 HTTP/1.1\nHost: api.example.com\nContent-Type: application/merge-patch+json\n\n{\"role\":\"admin\"}",
  },
  {
    name: "DELETE",
    group: "core",
    purpose: "Remove the resource.",
    safe: false,
    idempotent: true,
    cacheable: "no",
    requestBody: "none",
    responseBody: "optional",
    success: [200, 202, 204],
    rest: "Delete an item",
    spec: "RFC 9110 §9.3.5",
    notes: [
      "Idempotent: deleting twice ends in the same state. The second call may answer 404 — that is fine, the state is unchanged.",
      "Answer 204 when done, 202 if the removal is queued, or 200 with a body describing what happened.",
      "A body on DELETE has no defined meaning; put identifiers in the URL or query string.",
    ],
    example: "DELETE /api/users/42 HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer <token>",
  },
  {
    name: "OPTIONS",
    group: "core",
    purpose: "Ask which methods and options a resource supports.",
    safe: true,
    idempotent: true,
    cacheable: "no",
    requestBody: "optional",
    responseBody: "optional",
    success: [200, 204],
    rest: "Discover capabilities; used for CORS preflight",
    spec: "RFC 9110 §9.3.7",
    notes: [
      "Browsers send it automatically as a CORS preflight before a cross-origin request that uses a non-simple method or headers. The server answers with Access-Control-Allow-Methods and Access-Control-Allow-Headers.",
      "A plain OPTIONS reply lists the supported methods in the Allow header.",
      "If preflights fail, check that your server or CDN answers OPTIONS with 2xx and never requires authentication for it.",
    ],
    example: "OPTIONS /api/users HTTP/1.1\nHost: api.example.com\nOrigin: https://app.example.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type",
  },
  {
    name: "TRACE",
    group: "core",
    purpose: "Echo the request back so the client can see what intermediaries changed.",
    safe: true,
    idempotent: true,
    cacheable: "no",
    requestBody: "none",
    responseBody: "yes",
    success: [200],
    spec: "RFC 9110 §9.3.8",
    notes: [
      "A diagnostic method. Servers should disable it: combined with cross-site scripting it once let attackers read HttpOnly cookies (cross-site tracing).",
      "Security scanners flag an enabled TRACE. In nginx it is off by default; in Apache use TraceEnable off.",
    ],
    example: "TRACE /path HTTP/1.1\nHost: example.com\nMax-Forwards: 3",
  },
  {
    name: "CONNECT",
    group: "core",
    purpose: "Open a tunnel to the destination through a proxy.",
    safe: false,
    idempotent: false,
    cacheable: "no",
    requestBody: "none",
    responseBody: "no",
    success: [200],
    spec: "RFC 9110 §9.3.6",
    notes: [
      "How HTTPS works through an HTTP proxy: the client asks the proxy to CONNECT to host:443, then runs TLS through the tunnel, so the proxy cannot read the traffic.",
      "Web APIs do not use it. Proxies should limit it to expected ports (usually 443).",
    ],
    example: "CONNECT api.example.com:443 HTTP/1.1\nHost: api.example.com:443",
  },
  {
    name: "PROPFIND",
    group: "webdav",
    purpose: "Fetch properties of a resource or collection (WebDAV).",
    safe: true,
    idempotent: true,
    cacheable: "no",
    requestBody: "optional",
    responseBody: "yes",
    success: [207],
    spec: "RFC 4918 §9.1",
    notes: ["Answers 207 Multi-Status with an XML body. The Depth header (0, 1 or infinity) controls how deep it looks."],
    example: "PROPFIND /files/ HTTP/1.1\nDepth: 1",
  },
  {
    name: "PROPPATCH",
    group: "webdav",
    purpose: "Change properties of a resource (WebDAV).",
    safe: false,
    idempotent: true,
    cacheable: "no",
    requestBody: "expected",
    responseBody: "yes",
    success: [207],
    spec: "RFC 4918 §9.2",
    notes: ["All requested changes are applied atomically or none are."],
    example: "PROPPATCH /files/report.doc HTTP/1.1",
  },
  {
    name: "MKCOL",
    group: "webdav",
    purpose: "Create a collection, like a folder (WebDAV).",
    safe: false,
    idempotent: true,
    cacheable: "no",
    requestBody: "optional",
    responseBody: "optional",
    success: [201],
    spec: "RFC 4918 §9.3",
    notes: ["405 if the collection already exists, 409 if a parent is missing."],
    example: "MKCOL /files/new-folder/ HTTP/1.1",
  },
  {
    name: "COPY",
    group: "webdav",
    purpose: "Copy a resource to the URL in the Destination header (WebDAV).",
    safe: false,
    idempotent: true,
    cacheable: "no",
    requestBody: "optional",
    responseBody: "optional",
    success: [201, 204],
    spec: "RFC 4918 §9.8",
    notes: ["Overwrite: F stops it replacing an existing target."],
    example: "COPY /files/a.txt HTTP/1.1\nDestination: /files/b.txt",
  },
  {
    name: "MOVE",
    group: "webdav",
    purpose: "Move or rename a resource to the Destination URL (WebDAV).",
    safe: false,
    idempotent: true,
    cacheable: "no",
    requestBody: "optional",
    responseBody: "optional",
    success: [201, 204],
    spec: "RFC 4918 §9.9",
    notes: ["Equivalent to COPY followed by DELETE of the source, done as one operation."],
    example: "MOVE /files/a.txt HTTP/1.1\nDestination: /files/archive/a.txt",
  },
  {
    name: "LOCK",
    group: "webdav",
    purpose: "Lock a resource so others cannot change it (WebDAV).",
    safe: false,
    idempotent: false,
    cacheable: "no",
    requestBody: "expected",
    responseBody: "yes",
    success: [200, 201],
    spec: "RFC 4918 §9.10",
    notes: ["Returns a lock token in the Lock-Token header, which later requests must present."],
    example: "LOCK /files/report.doc HTTP/1.1\nTimeout: Second-600",
  },
  {
    name: "UNLOCK",
    group: "webdav",
    purpose: "Release a lock (WebDAV).",
    safe: false,
    idempotent: true,
    cacheable: "no",
    requestBody: "none",
    responseBody: "no",
    success: [204],
    spec: "RFC 4918 §9.11",
    notes: ["Send the token you received in Lock-Token."],
    example: "UNLOCK /files/report.doc HTTP/1.1\nLock-Token: <opaquelocktoken:…>",
  },
];

export const METHOD_BY_NAME = new Map(HTTP_METHODS.map((m) => [m.name, m]));

/** Comparison rows for the "safe, idempotent, cacheable" table. */
export const METHOD_FACTS = [
  { label: "Safe", help: "Read-only: does not change state on the server." },
  { label: "Idempotent", help: "Repeating the request has the same effect as sending it once, so it can be retried." },
  { label: "Cacheable", help: "A cache may store and reuse the response." },
] as const;

/** Rough guidance for choosing between the methods people mix up. */
export const METHOD_ADVICE: { question: string; answer: string }[] = [
  { question: "PUT or PATCH?", answer: "PUT replaces the whole resource, so missing fields are cleared. PATCH changes only the fields you send. Use PUT when the client holds the complete object; PATCH for small changes." },
  { question: "PUT or POST to create?", answer: "Use PUT when the client chooses the URL (PUT /files/report.pdf). Use POST when the server assigns it (POST /users answers 201 with Location: /users/42)." },
  { question: "POST or GET for a search?", answer: "GET while the query fits comfortably in a URL and has no secrets; it can be cached and bookmarked. POST when the criteria are large or sensitive — you lose caching but avoid URL length limits." },
  { question: "Which method is safe to retry?", answer: "Safe and idempotent ones: GET, HEAD, OPTIONS, PUT and DELETE. Retrying POST or PATCH can repeat the effect unless the API supports an idempotency key." },
];
