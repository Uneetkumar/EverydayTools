import type { ToolContent } from "../content";

/** Long-form copy for the API & HTTP tools. Merged into TOOL_CONTENT. */
export const API_HTTP_CONTENT: Record<string, ToolContent> = {
  "http-status-code-lookup": {
    intro:
      "Every HTTP response starts with a three-digit status code, and knowing what it means is the fastest way to debug a failing page or API call. This lookup covers every code in the official registry, from 100 Continue to 511 Network Authentication Required, plus the non-standard codes that show up in real logs, such as nginx's 499 and Cloudflare's 520 to 530. Each entry says what the code means, when a server sends it, how to fix it if it is an error, and whether the request is safe to retry.",
    howTo: {
      title: "How to look up an HTTP status code",
      steps: [
        "Type the code (for example 404) or a word that describes the problem, such as “timeout”, “redirect” or “rate limit”.",
        "Filter by class (1xx to 5xx) to browse one family of codes, or use the quick buttons for the codes people look up most.",
        "Select a code to open its details: when it appears, how to fix it, related headers and similar codes.",
        "Follow a “See also” link to compare neighbours, for example 301 against 308.",
        "Use “Copy link to this code” to share a direct link to an entry with a colleague.",
      ],
    },
    useCases: [
      {
        title: "Debugging a failing API call",
        body: "A 401, 403 and 404 look similar in a log but mean different things: missing credentials, refused access and a wrong URL. The fix section tells you what to check first for each.",
      },
      {
        title: "Choosing the right code for your own API",
        body: "Returning 200 for everything hides problems from clients. Use the details to pick precisely: 201 after creating, 204 after deleting, 409 for conflicts, 422 for validation errors and 429 when rate limiting.",
      },
      {
        title: "Fixing redirects for SEO",
        body: "301 and 308 tell search engines a page moved for good; 302 and 307 say it is temporary. Picking the wrong pair can leave old URLs ranking or lose link value.",
      },
    ],
    tips: [
      "4xx means the client needs to change something; 5xx means the server failed. Retrying a 4xx unchanged will not help; retrying a 502, 503 or 504 after a delay often does.",
      "A 429 or 503 should come with Retry-After. Honour it instead of retrying immediately.",
      "404 and 410 both mean “not here”, but 410 tells search engines the page is gone for good and is dropped a little faster.",
      "A 502 or 504 from nginx, Cloudflare or a load balancer usually means your application is down or slow, not the proxy itself.",
      "Status codes are sent by servers and are not always honest. Some sites return 200 with an error page. Check the body too.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between 500, 502, 503 and 504?",
        answer: "500 is an unexpected error inside the application. 502 means a proxy or gateway received an invalid answer from the application behind it. 503 means the service is temporarily unavailable, for example overloaded or in maintenance. 504 means the proxy waited too long for an answer.",
      },
      {
        question: "What does 418 I'm a teapot mean?",
        answer: "It comes from an April Fools' RFC for a coffee-pot control protocol. It is reserved in the registry, and a few servers return it to reject automated traffic or as a joke. You are unlikely to see it on a normal site.",
      },
      {
        question: "Which codes can a cache store automatically?",
        answer: "By default 200, 203, 204, 206, 300, 301, 308, 404, 405, 410, 414 and 501 can be cached without extra headers. Most other codes need explicit freshness information such as Cache-Control.",
      },
    ],
  },

  "http-header-viewer": {
    intro:
      "HTTP headers carry the instructions that decide how a page is cached, secured and shared across sites, yet they are hard to read in a wall of text. Paste the headers from curl, your browser's Network tab or a server log, and this viewer explains each one, groups the problems it finds, and shows how long a response can be cached. It is a quick way to check a site's security headers, debug a caching problem or understand why a cross-origin request is blocked, without sending your headers to anyone.",
    howTo: {
      title: "How to check HTTP headers",
      steps: [
        "Get the headers: run curl -I https://example.com in a terminal, or open your browser's developer tools, choose the Network tab, select a request and copy its headers.",
        "Paste them into the box. A status line (HTTP/2 200) or a request line (GET /path HTTP/1.1) is optional.",
        "Read the summary: the number of headers, problems and, for responses, how many of the six key security headers are set.",
        "Open the findings to see each problem with an explanation, then select a header in the list for its meaning and a breakdown of its value.",
        "Fix the issues on your server with the HTTP Header Generator, then paste the new headers to confirm.",
      ],
    },
    useCases: [
      {
        title: "Checking a site's security headers",
        body: "After a deploy, confirm that HSTS, Content-Security-Policy, X-Content-Type-Options and framing protection are really being sent, and that values such as unsafe-inline or a short HSTS lifetime have not crept in.",
      },
      {
        title: "Debugging caching",
        body: "If a CDN keeps serving an old file or never caches a new one, the Cache-Control, Vary and ETag headers usually explain why. The viewer translates them into what a browser and a CDN will actually do.",
      },
      {
        title: "Understanding a CORS error",
        body: "Paste the response headers of the failing request and the viewer shows whether Access-Control-Allow-Origin is present, whether it conflicts with credentials and whether Vary: Origin is missing.",
      },
    ],
    tips: [
      "curl -sIL https://example.com shows the headers of every hop in a redirect chain; paste the whole output and switch between responses.",
      "Header names are case-insensitive. HTTP/2 requires lower case, which is why Chrome shows them that way.",
      "Set-Cookie can appear several times in one response. Each cookie is checked on its own.",
      "Remove Authorization and Cookie values before pasting into a bug report or screenshot.",
      "A missing header is not always a problem: Strict-Transport-Security only matters on HTTPS.",
    ],
    extraFaqs: [
      {
        question: "Which security headers matter most?",
        answer: "Strict-Transport-Security to force HTTPS, Content-Security-Policy against cross-site scripting, X-Content-Type-Options: nosniff, a framing policy (frame-ancestors or X-Frame-Options) against clickjacking, a Referrer-Policy and a Permissions-Policy. These are the six in the checklist.",
      },
      {
        question: "Why does the viewer say X-XSS-Protection is obsolete?",
        answer: "The browser XSS filter it controlled has been removed from current browsers, and in some older ones it could create vulnerabilities. The recommended value is 0 or no header at all, with a Content-Security-Policy doing the real work.",
      },
      {
        question: "What does Vary: Cookie do to caching?",
        answer: "It tells caches to keep a separate copy for every cookie value, so almost every visitor gets a different copy and the hit rate collapses. Avoid it on pages that should be shared.",
      },
    ],
  },

  "http-header-generator": {
    intro:
      "Correct HTTP headers protect a site and speed it up, but each server wants them in a different format and a single wrong value can break a page. This generator asks for what you want in plain terms (security protections, which site may call your API, how long files may be cached, where scripts may load from) and writes the headers with warnings where an option is risky. It then outputs them as configuration for nginx, Apache, Caddy, Express, Next.js, Netlify, Vercel, Firebase Hosting or IIS, ready to paste.",
    howTo: {
      title: "How to generate HTTP headers for your server",
      steps: [
        "Choose the kind of header: Security, CORS, Caching, CSP or Downloads.",
        "Set the options. Start from a preset where one is offered, such as “Versioned static files” for caching or “Same origin only” for CSP.",
        "Read the warnings under the result. They flag options that commonly break sites, such as includeSubDomains on HSTS or unsafe-inline in a CSP.",
        "Pick your server or host in the format menu and copy the configuration into the file named above the code.",
        "Reload your server, then check the live response with the HTTP Header Viewer.",
      ],
    },
    useCases: [
      {
        title: "Hardening a new site",
        body: "Generate HSTS, nosniff, framing, referrer and permissions policies in one block and add it to your server configuration before launch, instead of discovering the gaps in a security scan afterwards.",
      },
      {
        title: "Fixing CORS for an API",
        body: "Enter the exact origin of your front end, the methods and headers it needs and whether it sends cookies. The generator writes the matching headers, including Vary: Origin, and warns about the wildcard-with-credentials mistake.",
      },
      {
        title: "Making static assets cache for a year",
        body: "Use the versioned-files preset to produce Cache-Control: public, max-age=31536000, immutable, so returning visitors never re-download files whose names change with their content.",
      },
    ],
    tips: [
      "Roll out a Content-Security-Policy in report-only mode first and watch for violations before enforcing it.",
      "Never cache HTML for a year. Give the HTML no-cache and only the versioned files a long lifetime.",
      "HSTS preload is very hard to undo. Test with a short max-age and only preload when every subdomain supports HTTPS.",
      "Send CORS headers on the OPTIONS preflight response as well as on the real response.",
      "Static-export hosts such as Firebase, Netlify and Vercel read headers from their own config files, not from your application code.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between no-cache and no-store?",
        answer: "no-cache lets a cache keep the response but forces it to check with the server before each reuse, which is cheap when the file has not changed (a 304). no-store forbids keeping it at all, which is the right choice for private or sensitive pages.",
      },
      {
        question: "Why does nginx need the word always?",
        answer: "Without it nginx adds add_header lines only to successful responses (2xx and 3xx), so your security headers would be missing from 404 and 500 pages. always adds them to every response.",
      },
      {
        question: "Does a wildcard in Access-Control-Allow-Origin work with cookies?",
        answer: "No. Browsers reject a response that allows credentials and uses * as the origin. You must name the exact origin and send Vary: Origin.",
      },
    ],
  },

  "user-agent-parser": {
    intro:
      "A User-Agent string is a fossil record of the web: it begins with “Mozilla/5.0” in every browser, names engines the browser only resembles, and is being deliberately frozen by Chrome and Safari to reduce tracking. This parser untangles it. Paste one string to see the browser and version, rendering engine, operating system, processor and device, and whether it belongs to a search crawler, an AI bot or a command-line tool. Paste a whole column from a server log to count what is visiting your site.",
    howTo: {
      title: "How to parse a User-Agent string",
      steps: [
        "Your own browser's User-Agent is filled in to begin with. Replace it with any string you want to check, or choose an example such as Googlebot or Safari on iPhone.",
        "Read the result tiles: browser, engine, operating system, device and processor.",
        "Check the notes underneath for caveats such as a frozen macOS version or a reduced Android device name.",
        "Open “Reading the string, piece by piece” to see why each token is there.",
        "To analyse traffic, switch to “Many at once”, paste up to 500 lines from a log and copy the parsed table as CSV.",
      ],
    },
    useCases: [
      {
        title: "Identifying bots in your server logs",
        body: "Googlebot, Bingbot, GPTBot, ClaudeBot and SEO crawlers all identify themselves in the User-Agent. Parse a log column to see how much of your traffic is automated and which operator it comes from.",
      },
      {
        title: "Debugging a browser-specific bug",
        body: "When a customer reports a problem, their User-Agent tells you the exact browser, version and operating system, which is usually the first thing you need to reproduce it.",
      },
      {
        title: "Checking what an HTTP client sends",
        body: "Libraries such as python-requests, curl, Go's net/http and OkHttp announce themselves. Some APIs block or rate limit those defaults, so it helps to know what you are sending.",
      },
    ],
    tips: [
      "Do not use the User-Agent alone for security decisions. It is trivially forged.",
      "To verify Googlebot, reverse-resolve the IP address and check it belongs to googlebot.com or google.com, then resolve forward again.",
      "Brave, Arc and other Chromium browsers intentionally send the same string as Chrome.",
      "On iPhone and iPad, every browser uses Apple's WebKit engine, so Chrome for iOS reports WebKit.",
      "Prefer feature detection in your code over sniffing the User-Agent.",
    ],
    extraFaqs: [
      {
        question: "What are User-Agent Client Hints?",
        answer: "A newer, structured way for browsers to share details such as platform, architecture and model, only when a site asks for them. They are more accurate than the string, which is being frozen. Chromium browsers support them; your own values are shown when you parse your own browser.",
      },
      {
        question: "Why does my Windows 11 PC say Windows NT 10.0?",
        answer: "Windows 10 and 11 both report NT 10.0 in the User-Agent, so the string cannot tell them apart. Client Hints can: the tool uses them to label your own machine correctly when they are available.",
      },
      {
        question: "Is GPTBot or ClaudeBot a real person?",
        answer: "No. They are automated crawlers run by AI companies. The parser labels them as AI crawlers, and you can allow or block them in robots.txt by their names.",
      },
    ],
  },

  "url-parser": {
    intro:
      "A URL looks like one string but carries up to eight separate parts: a scheme, optional credentials, a host, a port, a path, a query string and a fragment. Paste any web address here and the parser splits it apart using your browser's own URL engine, so you see exactly what a real request would send. It also warns about the mistakes that cause subtle bugs: unencoded spaces, broken percent-escapes, passwords in the address and API tokens hiding in the query string.",
    howTo: {
      title: "How to parse a URL",
      steps: [
        "Paste a URL, or choose one of the examples, into the box. A missing https:// is added for you.",
        "Read the colour-coded anatomy to see which part is the host, the path, the query and the fragment.",
        "Check the Parts table and the list of decoded query parameters and path segments.",
        "Review “Things to check” for warnings about encoding, credentials or secrets.",
        "To change something, choose “Edit the parts of this URL”, adjust a field and copy the rebuilt URL.",
      ],
    },
    useCases: [
      {
        title: "Debugging redirects and broken links",
        body: "Comparing the parts of the URL that should have matched, such as the host, the trailing slash or a stray double slash, is often faster than staring at the whole address.",
      },
      {
        title: "Inspecting an OAuth redirect",
        body: "OAuth and single-page apps often return results in the fragment (#access_token=…) or in the query. The parser lists them separately and warns when a token sits in a place that is logged.",
      },
      {
        title: "Cleaning tracking links",
        body: "See every parameter a marketing link carries, then use the Query Parameter Parser to strip the tracking ones before sharing.",
      },
    ],
    tips: [
      "Host names are case-insensitive; paths and query strings are case-sensitive.",
      "The fragment is never sent to the server, so you cannot read it in server logs.",
      "Put secrets in headers or request bodies, not in URLs. URLs are stored in logs, history and Referer headers.",
      "Spaces in a URL should be %20 (or + in a query string).",
      "An internationalised domain is sent as Punycode (xn--…). Check look-alike characters in links you receive.",
    ],
    extraFaqs: [
      {
        question: "What is the origin of a URL?",
        answer: "The scheme, host and port together, such as https://example.com:8443. Browsers use the origin for security rules, including CORS, cookies and the same-origin policy.",
      },
      {
        question: "Is a trailing slash significant?",
        answer: "To a server it can be: /docs and /docs/ are different paths and may return different things or redirect. Pick one form and stay consistent, for SEO as well as for caching.",
      },
      {
        question: "Why is the port missing from my URL?",
        answer: "Default ports (80 for http, 443 for https) are dropped when a URL is normalised because they are implied by the scheme. A non-default port such as :8443 is always kept.",
      },
    ],
  },

  "query-parameter-parser": {
    intro:
      "Query strings are how links and APIs pass small pieces of data, and reading a long one by eye is error-prone: percent-encoded characters, plus signs that may or may not be spaces, repeated names and framework-specific array syntax. Paste a query string or a whole URL and this tool decodes every parameter into a table or JSON, shows exactly how repeats and brackets are interpreted, and points out the tracking parameters that can be removed without changing the page.",
    howTo: {
      title: "How to parse a query string",
      steps: [
        "Paste the query string (with or without the leading ?) or the whole URL.",
        "Choose how it should be read: whether + means a space and whether a[b]=1 and a[]=1 should build nested data.",
        "Switch between the Table, JSON and Code views. JSON shows repeated names as arrays.",
        "If tracking parameters are found, copy the cleaned query string, or replace the input with it.",
        "Use the Code view to read the same parameters in JavaScript, Python, PHP or curl.",
      ],
    },
    useCases: [
      {
        title: "Reading an analytics or ad link",
        body: "UTM tags, fbclid and gclid are easy to spot in the table, and you can see what is left once they are removed.",
      },
      {
        title: "Checking what an API expects",
        body: "Turn the query string from API documentation or a network trace into JSON so you can compare it with the structure your code builds.",
      },
      {
        title: "Decoding form submissions",
        body: "A GET form produces a query string full of %20 and + escapes. The decoded table shows what the user actually typed.",
      },
    ],
    tips: [
      "Repeated names are legal. How they are combined is up to the server, so check your framework.",
      "A parameter with no equals sign (?debug) is valid and is treated as having an empty value.",
      "%2B is a literal plus sign; a bare + is usually a space.",
      "Very long query strings can be cut off by proxies. Move large data into a POST body.",
      "JSON output keeps values as strings, because a query string has no types.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between a query string and a fragment?",
        answer: "The query string (after ?) is sent to the server. The fragment (after #) stays in the browser. Only the query string appears in server logs.",
      },
      {
        question: "What does color[]=red&color[]=blue mean?",
        answer: "It is the PHP and Rails convention for sending an array: the server reads color as the list [red, blue]. Other frameworks read the name color[] literally, so use the format your backend documents.",
      },
      {
        question: "Why do some values look double-encoded?",
        answer: "A value that was already percent-encoded gets encoded again when it is put into another URL, turning %20 into %2520. Decode it once more to see the original.",
      },
    ],
  },

  "query-string-builder": {
    intro:
      "Writing a query string by hand goes wrong in familiar ways: a forgotten encoding of & or #, spaces written three different ways, arrays in the wrong format for the backend. Enter your parameters as rows, paste a JSON object or import an existing query string, and this builder encodes everything correctly, lets you choose the array format, and shows the equivalent code for JavaScript, Python, PHP and curl.",
    howTo: {
      title: "How to build a query string",
      steps: [
        "Choose where the parameters come from: rows, a JSON object or an existing query string.",
        "Add each name and value. Repeat a name on several rows to send several values. Switch a row off to leave it out.",
        "Pick the array format your backend expects, how spaces are written, and whether to sort and skip empty values.",
        "Optionally add a base URL to get the complete address.",
        "Copy the query string, the full URL or the code for your language.",
      ],
    },
    useCases: [
      {
        title: "Calling a search or filter API",
        body: "Build a request with several filter values, sort order and paging without worrying about which characters need encoding.",
      },
      {
        title: "Converting between formats",
        body: "Import a query string that uses tag=a&tag=b and re-export it as tag[]=a&tag[]=b for a PHP backend.",
      },
      {
        title: "Generating test URLs",
        body: "Produce consistent, sorted query strings for tests, cache keys and request signing.",
      },
    ],
    tips: [
      "Encode values, not the whole URL, or the :// and / will be mangled.",
      "Sort parameters when you need a stable string for signing or caching.",
      "For nested data, bracket syntax such as filter[status]=open is widely understood, but not universal.",
      "An empty value (name=) is different from a missing parameter. Use “skip empty values” deliberately.",
      "Keep secrets out of query strings.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between encodeURIComponent and this?",
        answer: "encodeURIComponent leaves ! ' ( ) * unescaped. This builder escapes them too, which matches RFC 3986 and what strict APIs such as OAuth 1.0 signatures require.",
      },
      {
        question: "Can I build a query string from JSON with nested objects?",
        answer: "Yes. Nested objects become name[key]=value and arrays follow the format you choose, for example filter[tags][]=new.",
      },
      {
        question: "Why does my value contain + in the JavaScript output?",
        answer: "URLSearchParams always writes spaces as +, which is valid in a query string. If a server insists on %20, build the string with this tool's “%20” option instead.",
      },
    ],
  },

  "api-request-builder": {
    intro:
      "An API request is more than a URL: a method, headers, a body in the right format and credentials all have to be correct before the server will answer. This builder lets you assemble a request with a form instead of remembering syntax, send it straight from your browser and read the response, then take it with you as a curl command or as code. When a request fails it tells you why, separating a server that cannot be reached from one that answered but does not allow this page to read the reply.",
    howTo: {
      title: "How to build and send an API request",
      steps: [
        "Choose the method and type the URL. Try one of the public test APIs if you want to see it work first.",
        "Add query parameters and headers, then set the body type (JSON, form, multipart, text or a file) and, if needed, authentication.",
        "Press Send request. The response shows its status, time, size, headers and body, with JSON pretty-printed and images displayed.",
        "If the request fails, read the explanation: it says whether the server could not be reached or whether the browser blocked the response because of CORS.",
        "Copy the request as curl, fetch, Axios or Python from the section at the bottom, or import an existing curl command to start from it.",
      ],
    },
    useCases: [
      {
        title: "Trying an endpoint before writing code",
        body: "Check that an API key works, see the exact shape of a response and confirm the status codes before you write a single line of integration code.",
      },
      {
        title: "Reproducing a bug report",
        body: "Import the curl command from a bug report, run it, change one header and see what changes, then copy the fixed request back out.",
      },
      {
        title: "Generating the code for a request",
        body: "Build the request visually and export it as fetch, Axios or Python, with headers and body already correct.",
      },
    ],
    tips: [
      "Browsers will not send certain headers, such as Cookie, Host and Referer. The tool tells you which were dropped. curl does not have this limit.",
      "A request that needs a CORS preflight (non-simple methods, custom headers such as Authorization, or JSON bodies) fails if the API does not answer OPTIONS with the right headers.",
      "Use test or sandbox credentials when you can. Anything you type is sent to the server you name.",
      "Bodies of GET and HEAD requests are not sent by browsers.",
      "If you only see a generic error, try the same request with curl in a terminal, which is not subject to CORS.",
    ],
    extraFaqs: [
      {
        question: "Why can't I read some response headers?",
        answer: "For cross-origin requests the browser only exposes a short list of safe headers plus those the server names in Access-Control-Expose-Headers. Others are hidden from web pages. curl -i shows all of them.",
      },
      {
        question: "Does this replace Postman?",
        answer: "For quick requests, yes: it needs no install or account. Postman and similar desktop apps are not limited by CORS and offer collections, environments and automation, so they suit larger workflows.",
      },
      {
        question: "What happens with file uploads?",
        answer: "Choose Multipart and set a field to File to pick a file from your device. It is sent straight from your browser to the server you entered. It is never uploaded to TabBench.",
      },
    ],
  },

  "curl-generator": {
    intro:
      "curl can do almost anything over HTTP, which also means its flags are easy to forget: -d or --data-raw, -H for every header, -F for files, -u for passwords, and different quoting rules for Bash, PowerShell and Windows cmd. Fill in the request here and get a correctly quoted command for your shell, with plain-language warnings when an option is risky. It also works in reverse: paste an existing command to edit it in the form.",
    howTo: {
      title: "How to generate a curl command",
      steps: [
        "Choose the method and enter the URL. Add query parameters in the Params section.",
        "Add headers, and pick the body type: JSON, text, form, multipart or a file.",
        "Set authentication and any options, such as following redirects or a timeout.",
        "Choose your shell and whether to put each option on its own line.",
        "Copy the command. The same request is shown below as fetch, Axios or Python if you need code instead.",
      ],
    },
    useCases: [
      {
        title: "Documenting an API",
        body: "A curl example is the clearest way to show how an endpoint is called. Build it once with correct quoting and paste it into your README.",
      },
      {
        title: "Testing from a terminal or server",
        body: "Run the generated command on a server or in CI, where a browser is not available and CORS does not apply.",
      },
      {
        title: "Moving from Linux to Windows",
        body: "Switch the shell to PowerShell or cmd and get the same request with the quoting those shells require.",
      },
    ],
    tips: [
      "Use --data-raw or a file for JSON so that a leading @ is not treated as a file name.",
      "Add -i to see response headers, and -v to see the whole exchange.",
      "Passwords in a command are visible in shell history. Prefer environment variables or --netrc.",
      "-L follows redirects; without it curl prints the redirect response and stops.",
      "-k disables certificate checks. Use it only against servers you control.",
    ],
    extraFaqs: [
      {
        question: "What does -X POST do, and do I need it?",
        answer: "It sets the method explicitly. You do not need it when you use -d, -F or --json, because curl switches to POST by itself. The generator leaves it out when it is implied.",
      },
      {
        question: "How do I send JSON with curl?",
        answer: "Add -H 'Content-Type: application/json' and pass the body with -d. Without the header curl labels the body as form data, which most JSON APIs reject. Newer curl versions also have --json, which sets both headers for you.",
      },
      {
        question: "Why do quotes look different on Windows?",
        answer: "cmd.exe only understands double quotes and treats % specially, while PowerShell uses single quotes and doubles them to escape. The generator quotes for the shell you choose.",
      },
    ],
  },

  "curl-to-fetch": {
    intro:
      "API documentation, Stack Overflow answers and your browser's “Copy as cURL” all speak curl, but your front-end code needs fetch. This converter reads the curl command the way curl itself does (clustered flags like -sSL, $'…' strings, several -d parts, the Windows format) and writes idiomatic fetch code: JSON bodies as JSON.stringify of an object, form data as URLSearchParams, uploads as FormData and credentials as headers. It also tells you what cannot carry over to a browser.",
    howTo: {
      title: "How to convert curl to fetch",
      steps: [
        "Paste the curl command. In Chrome, right-click a request in the Network tab and choose Copy, then Copy as cURL.",
        "Choose async/await or a .then() chain.",
        "Decide whether fetch should mimic curl's redirect behaviour and whether to include the response.ok error check.",
        "Copy the generated code. Read the notes underneath for anything that will behave differently in a browser.",
        "If the request needs credentials or cookies across sites, add credentials: 'include' and make sure the server allows it with CORS.",
      ],
    },
    useCases: [
      {
        title: "Turning API docs into front-end code",
        body: "Most API references show curl. Convert the example and adapt it to your app without translating flags by hand.",
      },
      {
        title: "Reproducing a network request",
        body: "Copy a request from DevTools as curl, convert it to fetch and replay it from a script or test.",
      },
      {
        title: "Moving a shell script to Node.js",
        body: "Node.js 18 and later run fetch natively, so a curl-based script can become a short JavaScript file without dependencies.",
      },
    ],
    tips: [
      "fetch does not reject on HTTP errors such as 404. Check response.ok, as the generated code does.",
      "Do not set Content-Type by hand for FormData. The browser adds the boundary itself.",
      "Forbidden headers (Cookie, Host, Referer, User-Agent) are ignored in a browser but work in Node.js.",
      "Use AbortSignal.timeout(ms) for a timeout, as the generated code does for --max-time.",
      "Parse JSON with response.json() only when the server sends JSON; otherwise use response.text().",
    ],
    extraFaqs: [
      {
        question: "Why does my converted request fail in the browser with a CORS error?",
        answer: "curl is not a browser, so it ignores CORS. A cross-origin request from a web page only succeeds if the server allows your site with Access-Control-Allow-Origin. Test the request in a terminal first, then ask the API owner to allow your origin.",
      },
      {
        question: "What happens to -u user:pass?",
        answer: "Basic authentication is an Authorization header holding the Base64 of user:password. The converter writes that header for you, using btoa, which is available in browsers and Node.js 16 and later.",
      },
      {
        question: "What about --compressed?",
        answer: "It has no effect in fetch code: browsers and Node.js ask for compressed responses and decode them automatically.",
      },
    ],
  },

  "curl-to-axios": {
    intro:
      "If your project already uses Axios for HTTP, a curl example from API documentation needs translating: headers into an object, -d into a data property, -u into an auth option, -m into a timeout in milliseconds. This converter does the translation and lets you pick the style you prefer: one config object or the axios.post() shorthand, import or require, with or without a try/catch that handles Axios errors.",
    howTo: {
      title: "How to convert curl to Axios",
      steps: [
        "Paste your curl command into the box.",
        "Choose the call style: axios({ … }) for one config object, or axios.get/post/put/patch/delete for the shorthand.",
        "Choose import or require, and keep the error handling switch on if you want a try/catch with axios.isAxiosError.",
        "Copy the code and install Axios with npm install axios if you have not already.",
        "Replace placeholder tokens such as YOUR_TOKEN with real values from your environment, not from source code.",
      ],
    },
    useCases: [
      {
        title: "Using an example from API docs",
        body: "Paste the curl example from a provider's documentation and get the Axios call for your code base.",
      },
      {
        title: "Porting a shell script",
        body: "Replace a chain of curl commands in a build or deployment script with a small Node.js script that uses Axios.",
      },
      {
        title: "Keeping request style consistent",
        body: "If your code uses axios.post(url, data, config), pick the shorthand style so generated snippets match the code around them.",
      },
    ],
    tips: [
      "Axios serialises plain objects to JSON and sets Content-Type for you, so the converter drops a matching header.",
      "Axios timeouts are in milliseconds; curl's --max-time is in seconds.",
      "axios.delete takes its body in the config object as data.",
      "Reject-on-error is Axios' default: any non-2xx status throws, so handle it in a catch block.",
      "In the browser Axios uses XMLHttpRequest and is bound by CORS like any other script.",
    ],
    extraFaqs: [
      {
        question: "Why is there a FormData in the output?",
        answer: "curl -F sends multipart/form-data, which Axios sends when you pass a FormData object. For files in the browser, append the File from an input. In Node.js append a Blob or a stream.",
      },
      {
        question: "Does Axios follow redirects?",
        answer: "Yes, up to five by default in Node.js, and the browser follows them itself. Set maxRedirects: 0 to mimic curl without -L, or turn on the matching option in the converter.",
      },
      {
        question: "Should I use Axios or fetch?",
        answer: "fetch is built in and enough for most cases. Axios adds conveniences such as automatic JSON handling, interceptors, timeouts and progress events, which some teams prefer.",
      },
    ],
  },

  "curl-to-python": {
    intro:
      "Converting a curl command to Python is mostly bookkeeping: headers become a dictionary, -d becomes json= or data=, -u becomes an auth tuple, -F becomes files=, -m becomes a timeout. This converter does it for you in three flavours. requests is the everyday choice, httpx adds async and HTTP/2, and urllib ships with Python for when nothing else can be installed. It also explains the differences that catch people out, such as requests following redirects by default.",
    howTo: {
      title: "How to convert curl to Python",
      steps: [
        "Paste the curl command.",
        "Pick the library: requests, httpx or urllib.",
        "Keep “Check for errors” on if you want response.raise_for_status() after the call.",
        "Turn on “Match curl's redirect behaviour” if you want redirects ignored as curl does without -L.",
        "Copy the code, install the package (pip install requests) if needed, and replace placeholders.",
      ],
    },
    useCases: [
      {
        title: "Scripting an API from its docs",
        body: "Paste the curl example from a provider and get a runnable Python script for cron jobs, data pipelines and notebooks.",
      },
      {
        title: "Replaying a browser request",
        body: "Use Copy as cURL in DevTools, convert it and reproduce the call from Python to scrape or test an endpoint you are allowed to use.",
      },
      {
        title: "Moving off a fragile shell script",
        body: "Replace a bash script that builds curl commands with Python that can parse JSON and handle errors.",
      },
    ],
    tips: [
      "requests has no default timeout, so a stuck connection can hang forever. Always pass timeout=.",
      "Use json= instead of data= for JSON bodies: it serialises the dict and sets Content-Type.",
      "requests follows redirects by default for GET but not for HEAD.",
      "httpx times out after five seconds unless you set timeout.",
      "For many requests, create a Session (requests) or Client (httpx) so connections are reused.",
    ],
    extraFaqs: [
      {
        question: "How do I send a file upload from Python?",
        answer: "Pass files={'file': open('photo.jpg', 'rb')} to requests.post. The converter builds it from -F, including the file name and content type, and uses data= for ordinary fields in the same form.",
      },
      {
        question: "What does verify=False do?",
        answer: "It turns off TLS certificate verification, like curl -k. Use it only for local testing, because it removes the protection HTTPS gives and Python will print warnings.",
      },
      {
        question: "Why does the urllib output raise an exception on a 404?",
        answer: "urllib raises urllib.error.HTTPError for 4xx and 5xx responses. requests does not until you call raise_for_status().",
      },
    ],
  },

  "curl-to-javascript": {
    intro:
      "“JavaScript” means several different things for HTTP: the modern fetch API, the older XMLHttpRequest, Node.js's built-in https module, jQuery's $.ajax and libraries such as Axios. This converter takes one curl command and writes the version for whichever you use, and explains what differs. Paste a command, pick the style and get code you can drop into a browser script, a Node.js file or a legacy page.",
    howTo: {
      title: "How to convert curl to JavaScript",
      steps: [
        "Paste the curl command.",
        "Choose the library: fetch, XMLHttpRequest, Node.js https, jQuery or Axios.",
        "Adjust the style options (async/await or .then(), error handling, how the response is printed).",
        "Copy the code and read the notes for that runtime.",
        "Run it in the browser console, a script tag or with node file.js, depending on the style.",
      ],
    },
    useCases: [
      {
        title: "Supporting an older browser code base",
        body: "Legacy sites still use XMLHttpRequest or jQuery. Generate code in the same style as the rest of the project.",
      },
      {
        title: "Zero-dependency Node.js scripts",
        body: "The https module needs no install. The output includes a Content-Length header and handles the response stream for you.",
      },
      {
        title: "Comparing approaches",
        body: "Switch between the styles with the same command to see how each one expresses headers, bodies and errors.",
      },
    ],
    tips: [
      "Prefer fetch in new code: it is standard, promise-based and needs no dependency.",
      "XMLHttpRequest reports network errors through onerror and HTTP errors through the status code.",
      "jQuery needs processData: false and contentType: false to send FormData.",
      "The Node.js https module buffers nothing for you: collect the chunks, then parse.",
      "Set a timeout in every style, because HTTP requests can hang.",
    ],
    extraFaqs: [
      {
        question: "Does the Node.js output need any packages?",
        answer: "No. It uses only the built-in https (or http) module. For uploads it switches to fetch, which Node.js 18 and later include.",
      },
      {
        question: "Can I use the XMLHttpRequest output in Node.js?",
        answer: "No. XMLHttpRequest is a browser API. Use the fetch or https versions in Node.js.",
      },
      {
        question: "Why is a header missing from the browser versions?",
        answer: "Browsers refuse to let scripts set certain headers. They are listed in the notes under the code and are left in the output so you can see them, but the browser ignores them.",
      },
    ],
  },

  "http-method-reference": {
    intro:
      "The HTTP method on a request tells the server what you intend to do, and whether it is safe to repeat. Choosing carelessly causes real bugs: a GET that changes data gets triggered by crawlers, a POST retried after a timeout creates duplicates, a PUT that should have been a PATCH wipes fields. This reference, based on RFC 9110, sets out for every method whether it is safe, idempotent and cacheable, what a body means, which status codes to expect and how it maps to a REST API.",
    howTo: {
      title: "How to choose an HTTP method",
      steps: [
        "Start with the comparison table: read across a row to see whether a method is safe, idempotent and cacheable, and whether it carries a body.",
        "Select a method to see its purpose, the success codes to expect, the practical notes and an example request.",
        "If you are designing an API, read “Which one should I use?” for the usual choices: PUT or PATCH, PUT or POST, GET or POST.",
        "Follow a status-code chip to the lookup for the exact meaning of each response.",
        "Switch to the WebDAV tab if you work with file-sharing protocols.",
      ],
    },
    useCases: [
      {
        title: "Designing a REST API",
        body: "Map create, read, update and delete to POST, GET, PUT or PATCH and DELETE, and return the right status code for each.",
      },
      {
        title: "Deciding what to retry",
        body: "Clients and proxies may safely retry idempotent methods after a network failure. The reference shows which methods qualify.",
      },
      {
        title: "Understanding a CORS preflight",
        body: "Browsers send an OPTIONS request before a cross-origin call that uses PUT, PATCH, DELETE or custom headers. The OPTIONS entry explains what the server must answer.",
      },
    ],
    tips: [
      "Never change data in response to a GET: prefetching, crawlers and link checkers will call it.",
      "Make POST safe to retry by accepting an Idempotency-Key header and remembering its result.",
      "Use PATCH with a defined format such as JSON Merge Patch, not an ad hoc body.",
      "Disable TRACE on servers: it is a known security scanner finding.",
      "A 405 response must include an Allow header listing the methods that do work.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between PUT and PATCH?",
        answer: "PUT replaces the whole resource with the body you send, so any field you leave out is removed. PATCH applies a partial change, so only the fields you send are touched.",
      },
      {
        question: "Is DELETE idempotent if the second call returns 404?",
        answer: "Yes. Idempotent refers to the state of the server, not to the response: after the first DELETE the resource is gone, and deleting it again leaves it gone.",
      },
      {
        question: "Is there a QUERY method?",
        answer: "A method for safe requests that carry a body, so large searches need not use POST, has been proposed by the IETF HTTP working group. Support is still limited, so check your server and client before depending on it.",
      },
    ],
  },

  "mime-type-lookup": {
    intro:
      "A MIME type (also called a media type or content type) is the label that tells software what a file is: image/png, application/json, text/css. Servers send it in the Content-Type header, browsers use it to decide whether to display, run or download a file, and upload forms send it to describe each file. Search by file extension to find the type to serve, or search by type to find every extension that uses it, across about 200 common formats.",
    howTo: {
      title: "How to find a MIME type",
      steps: [
        "Type a file extension with or without the dot (pdf), a MIME type (image/webp), or a word such as video or font.",
        "Narrow the results with a category button: Image, Video, Document, Archive and so on.",
        "Read the type, the description and any “unregistered” flag in each row.",
        "Use Copy to put the MIME type on your clipboard.",
        "Type an exact MIME type to see every extension that uses it, and whether it compresses well.",
      ],
    },
    useCases: [
      {
        title: "Configuring a web server",
        body: "Set the correct types for unusual files such as .webmanifest, .wasm or .woff2 so browsers handle them properly.",
      },
      {
        title: "Validating uploads",
        body: "Look up the allowed types for an upload field, for example application/pdf and image/jpeg, to build an allow-list.",
      },
      {
        title: "Setting headers for downloads",
        body: "Find the right Content-Type for a generated file and pair it with Content-Disposition in the Content-Type Lookup or the Header Generator.",
      },
    ],
    tips: [
      "JavaScript is text/javascript (RFC 9239). application/javascript is obsolete.",
      "Always send a charset with text types, for example text/html; charset=utf-8.",
      "Do not compress images, video, archives or fonts such as WOFF2 again: they are already compressed.",
      "Never trust a file extension alone for security. Check the file contents.",
      "application/octet-stream means unknown binary data and triggers a download.",
    ],
    extraFaqs: [
      {
        question: "What is the MIME type for .docx, .xlsx and .pptx?",
        answer: "They are long vendor types: application/vnd.openxmlformats-officedocument.wordprocessingml.document for Word, …spreadsheetml.sheet for Excel and …presentationml.presentation for PowerPoint. They are listed in full in the table, with a copy button.",
      },
      {
        question: "Why do browsers sometimes ignore my Content-Type?",
        answer: "Without X-Content-Type-Options: nosniff, browsers may guess the type from the content (MIME sniffing). Send the correct type and nosniff so the browser trusts your label.",
      },
      {
        question: "Is MIME type the same as file extension?",
        answer: "No. The extension is a naming convention; the MIME type is the label sent over the network. Several extensions can share one type (.jpg and .jpeg), and an extension can be wrong.",
      },
    ],
  },

  "content-type-lookup": {
    intro:
      "The Content-Type header tells the receiver how to read a message body, and getting it wrong is behind a long list of mystery failures: a JSON API that returns 415, an upload that arrives empty because the multipart boundary was set by hand, a script the browser refuses to run because it was served as text/plain. This tool helps three ways: it lists what to send for common jobs, checks a header value for mistakes, and reads a dropped file's first bytes to find out what it really is.",
    howTo: {
      title: "How to choose or check a Content-Type",
      steps: [
        "On “What should I send?”, find your job, such as JSON API, file upload or server-sent events, and copy the header with its explanatory note.",
        "On “Check a header”, paste a Content-Type value to see its type, subtype, parameters and any problems.",
        "On “Identify a file”, drop a file. Only its first few kilobytes are read, in your browser.",
        "Compare the type from the extension, from your browser and from the contents. A mismatch is flagged.",
        "Copy the Content-Type header suggested for serving that file.",
      ],
    },
    useCases: [
      {
        title: "Fixing a 415 Unsupported Media Type",
        body: "If an API rejects your request, the Content-Type is usually missing or wrong. Check the recipe for JSON, forms or multipart and compare it with what you send.",
      },
      {
        title: "Serving user uploads safely",
        body: "Detect the real type of an uploaded file from its bytes rather than trusting the file name, and serve it with a matching header plus nosniff.",
      },
      {
        title: "Debugging a blocked script or stylesheet",
        body: "Browsers refuse module scripts and strict-mode stylesheets with the wrong type. The recipes show the exact header each needs.",
      },
    ],
    tips: [
      "For multipart/form-data let the client set the header. It must include the boundary it actually used.",
      "text/event-stream must not have a charset parameter.",
      "JSON does not need charset=utf-8, but text types do.",
      "Serve SVG as image/svg+xml and enable compression for it.",
      "Combine Content-Type with X-Content-Type-Options: nosniff for files users can upload.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between application/json and text/json?",
        answer: "application/json is the registered type. text/json is not registered and some clients do not treat it as JSON. Always use application/json.",
      },
      {
        question: "What does +json mean in application/vnd.api+json?",
        answer: "It is a structured-syntax suffix: the content is JSON, with extra rules from the vnd.api format. Tools can treat any +json type as JSON.",
      },
      {
        question: "How reliable is file-signature detection?",
        answer: "Very reliable for formats with a fixed header such as PNG, JPEG, PDF, ZIP and MP4. Plain-text formats like CSV have no signature, so they are guessed from the content and labelled as a guess. Office files are ZIP containers, so the tool also uses the extension to tell them apart.",
      },
    ],
  },
};
