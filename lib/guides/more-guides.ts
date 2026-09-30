import type { Guide } from "./content";

/**
 * Guides for the API & HTTP, random and time tools. Each one answers a
 * concrete question end to end and links to the tool that does the job.
 */
export const MORE_GUIDES: Guide[] = [
  {
    slug: "http-status-codes-explained",
    title: "HTTP status codes explained: what 200, 301, 404 and 500 mean",
    metaTitle: "HTTP Status Codes Explained: 200, 301, 404, 500",
    metaDescription:
      "Understand HTTP status codes in minutes: the five classes, the codes you meet most, what causes each error and how to fix 4xx and 5xx responses.",
    keywords: [
      "http status codes explained",
      "what does 404 mean",
      "301 vs 302 redirect",
      "401 vs 403",
      "502 bad gateway meaning",
      "http response codes list",
      "rest api status codes",
    ],
    toolSlug: "http-status-code-lookup",
    toolLabel: "HTTP Status Code Lookup",
    published: "2026-09-30",
    updated: "2026-09-30",
    intro: [
      "Every HTTP response begins with a three-digit status code. It is the server's one-word answer to your request: it worked, it moved, you did something wrong, or we did. Once you know the five classes, most codes can be read at a glance, and the few that cause confusion (401 against 403, 301 against 302, 502 against 504) are easy to tell apart.",
      "This guide walks through the classes, the codes you will actually meet, what usually causes each error, and how to choose the right code when you build your own API. Use the lookup tool for any code not covered here, including the non-standard ones you find in nginx and Cloudflare logs.",
    ],
    steps: [
      {
        title: "Learn the five classes",
        body: "The first digit tells you the family. 1xx is informational (the request is still being processed), 2xx means success, 3xx means you need to go somewhere else, 4xx means the request was wrong, and 5xx means the server failed. A client error (4xx) needs a change to the request before it can succeed; a server error (5xx) might succeed if you simply try again later.",
      },
      {
        title: "Recognise the success codes",
        body: "200 OK is the default success. 201 Created follows a successful creation and should carry a Location header with the new resource's URL. 202 Accepted means the work was queued and is not finished. 204 No Content means success with nothing to return, common after DELETE. 206 Partial Content answers a Range request, which is how video seeking and resumable downloads work.",
      },
      {
        title: "Handle redirects correctly",
        body: "301 Moved Permanently and 308 Permanent Redirect say a resource has a new address for good; search engines transfer ranking signals and browsers cache the redirect. 302 Found and 307 Temporary Redirect mean the move is temporary. The difference within each pair is the method: 307 and 308 keep it (a POST stays a POST), while 301 and 302 may turn a POST into a GET. 303 See Other sends the browser to a result page after a form submit. 304 Not Modified is not a redirect at all: it tells the browser its cached copy is still good.",
      },
      {
        title: "Diagnose client errors (4xx)",
        body: "400 Bad Request means the request is malformed: invalid JSON, a missing field or a corrupt cookie. 401 Unauthorized really means unauthenticated: send valid credentials. 403 Forbidden means the server knows who you are and refuses anyway: check permissions, IP rules and any firewall. 404 Not Found means there is nothing at that URL; 410 Gone says it was removed on purpose. 405 Method Not Allowed lists the allowed methods in an Allow header. 409 Conflict and 422 Unprocessable Content report a clash with the current state or a validation failure. 429 Too Many Requests means you hit a rate limit: wait for Retry-After.",
      },
      {
        title: "Diagnose server errors (5xx)",
        body: "500 Internal Server Error is the catch-all for an unhandled failure; read the application's error log. 502 Bad Gateway, 503 Service Unavailable and 504 Gateway Timeout usually come from a proxy, load balancer or CDN in front of your application: 502 means it got an invalid answer, 503 means the service is overloaded or down for maintenance, and 504 means the application took too long. Check whether the application is running and reachable from the proxy before touching proxy settings.",
      },
      {
        title: "Return the right code from your own API",
        body: "Use the most specific code that is true. 201 after creating, 204 after deleting, 400 for malformed input, 401 when credentials are missing, 403 when they are not enough, 404 for unknown resources, 409 for conflicts, 422 for validation errors and 429 when rate limiting. Always include a helpful body with the reason. Avoid returning 200 with an error message inside: generic clients, caches and monitoring tools rely on the code.",
      },
    ],
    notes: [
      "A 5xx error may succeed on retry, but only retry idempotent requests automatically: GET, PUT, DELETE and HEAD are safe, POST usually is not.",
      "Honour the Retry-After header on 429 and 503 responses instead of retrying immediately.",
      "Status codes from proxies such as nginx and Cloudflare (499, 520 to 530) are not part of the HTTP standard but are common in logs.",
      "A soft 404, a page that says “not found” but returns 200, confuses search engines. Return a real 404.",
    ],
    faqs: [
      {
        question: "What is the difference between 401 and 403?",
        answer:
          "401 means the server does not know who you are: credentials are missing or invalid. 403 means it knows who you are, or does not care, and refuses the request anyway. Logging in fixes a 401; it does not fix a 403.",
      },
      {
        question: "Should I use a 301 or a 302 redirect for SEO?",
        answer:
          "Use 301 (or 308) for permanent moves, such as a changed URL or http to https, so ranking signals transfer to the new address. Use 302 (or 307) only when the move is temporary and you want the original URL to stay indexed.",
      },
      {
        question: "What does a 502 Bad Gateway mean?",
        answer:
          "A proxy or gateway got an invalid or no response from the server behind it. The cause is almost always the upstream application: it crashed, is restarting, listens on a different port, or returned something malformed.",
      },
      {
        question: "Is 418 I'm a teapot a real status code?",
        answer:
          "It comes from an April Fools' RFC about coffee-pot control. It is reserved in the registry and a few servers return it as a joke or to reject bots, but it is not meant for real use.",
      },
    ],
  },

  {
    slug: "convert-curl-to-fetch-javascript",
    title: "How to convert a curl command to JavaScript fetch",
    metaTitle: "Convert curl to JavaScript fetch: Step by Step",
    metaDescription:
      "Turn a curl command into working fetch code: copy it from DevTools, convert headers, JSON bodies and auth, and avoid the CORS and cookie traps.",
    keywords: [
      "convert curl to fetch",
      "curl to fetch javascript",
      "copy as curl devtools",
      "curl to javascript",
      "fetch post json headers",
      "curl -d to fetch",
    ],
    toolSlug: "curl-to-fetch",
    toolLabel: "cURL to Fetch Converter",
    published: "2026-09-30",
    updated: "2026-09-30",
    intro: [
      "API documentation and bug reports almost always show requests as curl commands, but the code you write in a web app or Node.js script uses fetch. Translating by hand is easy to get wrong: -d sends form data unless you add a header, -u becomes a Base64 header, -F builds a multipart body, and a few headers that curl sends freely are forbidden in a browser.",
      "This guide shows the workflow from the browser's Network tab to working fetch code, what each curl flag turns into, and the differences between curl and fetch that make a correct translation fail anyway.",
    ],
    steps: [
      {
        title: "Copy the request as cURL",
        body: "In Chrome, Edge or Firefox, open the developer tools, go to the Network tab, find the request, right-click it and choose Copy, then Copy as cURL (bash). Paste the command into the converter. The same converter also understands Windows cmd and PowerShell formats and commands written by hand.",
      },
      {
        title: "Map the flags to fetch options",
        body: "-X sets the method option, -H adds an entry to headers, and -d or --data-raw becomes the body. -u user:pass becomes an Authorization: Basic header. -F fields become a FormData object. -L lets fetch follow redirects, which it does by default anyway. --max-time becomes AbortSignal.timeout in milliseconds. The converter does all of this and writes the body as JSON.stringify of an object when the content type is JSON.",
      },
      {
        title: "Choose async/await or promises",
        body: "async/await reads top to bottom and works at the top level of ES modules and in DevTools. The .then() chain works anywhere, including older bundlers. Either form should check response.ok, because fetch only rejects on network failures, not on HTTP errors such as 404 or 500.",
      },
      {
        title: "Check what a browser will not send",
        body: "Browsers refuse to set some headers from script, including Cookie, Host, Referer and Origin, and ignore User-Agent. A request copied from DevTools usually contains these, so they are dropped. To send cookies with a cross-origin request use credentials: 'include' and make sure the server allows it. From Node.js, none of these limits apply.",
      },
      {
        title: "Test it and fix CORS if needed",
        body: "curl is not a browser, so it never hits CORS rules. If the same request fails from your page with a CORS error, the server must allow your origin with Access-Control-Allow-Origin, and answer the OPTIONS preflight for JSON bodies or custom headers. Test the request first in a terminal or in the API Request Builder to separate a server problem from a browser restriction.",
      },
    ],
    notes: [
      "Do not set Content-Type yourself when the body is FormData: the browser adds the multipart boundary.",
      "curl does not follow redirects unless you pass -L, while fetch does. Set redirect: 'manual' if the difference matters.",
      "Never commit tokens copied from DevTools. Replace them with environment variables before sharing code.",
      "Node.js 18 and later include fetch. Older versions need node-fetch or undici.",
    ],
    faqs: [
      {
        question: "Why does my curl command work but the fetch version fails?",
        answer:
          "Usually CORS: a browser enforces cross-origin rules that curl ignores. The server must send Access-Control-Allow-Origin for your site. Other causes are forbidden headers being dropped, cookies not being sent without credentials: 'include', or a redirect curl did not follow.",
      },
      {
        question: "How do I send JSON with fetch?",
        answer:
          "Set the header Content-Type: application/json and pass body: JSON.stringify(object). The converter does this automatically when the curl command has a JSON content type.",
      },
      {
        question: "What replaces curl -u for Basic auth?",
        answer:
          "An Authorization header with the value Basic followed by the Base64 of user:password, built with btoa. The converter writes it for you.",
      },
    ],
  },

  {
    slug: "convert-curl-to-python-requests",
    title: "How to convert a curl command to Python requests",
    metaTitle: "Convert curl to Python requests: Step by Step",
    metaDescription:
      "Translate a curl command to Python: headers, JSON and form bodies, file uploads, auth, timeouts and redirects, with requests, httpx or urllib.",
    keywords: [
      "convert curl to python",
      "curl to python requests",
      "curl to httpx",
      "python requests post json",
      "python requests file upload",
      "curl -F python",
    ],
    toolSlug: "curl-to-python",
    toolLabel: "cURL to Python Converter",
    published: "2026-09-30",
    updated: "2026-09-30",
    intro: [
      "A curl command in the documentation is easy to run but hard to build on. To call the same API from a script, a notebook or a service, you need Python code, and each curl flag maps to a different part of the requests library: headers become a dictionary, a JSON body becomes json=, a file upload becomes files=, and a timeout has to be added explicitly.",
      "This guide explains each translation, the defaults where Python and curl differ, and how to choose between requests, httpx and the standard-library urllib.",
    ],
    steps: [
      {
        title: "Paste the command and pick a library",
        body: "Copy the curl command (from API docs, or from DevTools with Copy as cURL) and paste it into the converter. requests is the everyday choice and is installed with pip install requests. httpx has the same shape with async support and HTTP/2. urllib ships with Python and is the right choice only when nothing can be installed.",
      },
      {
        title: "Translate headers and bodies",
        body: "-H entries become a headers dictionary. A JSON body is passed as json=payload, where payload is a Python dict; requests serialises it and sets the Content-Type. A form body from -d or --data-urlencode becomes data={...}. Multipart uploads from -F become files={...} with the file name and content type, plus data={...} for ordinary fields.",
      },
      {
        title: "Carry over authentication",
        body: "-u user:password becomes auth=('user', 'password'), which requests turns into a Basic Authorization header. Bearer tokens stay as a header. Keep tokens in environment variables with os.environ rather than in source files.",
      },
      {
        title: "Add what curl did implicitly",
        body: "requests has no default timeout, so a stalled server can block your script forever: always pass timeout=. curl does not follow redirects without -L, whereas requests follows them for GET requests, so use allow_redirects=False to match. -k becomes verify=False, which should stay out of production. Call response.raise_for_status() so that 4xx and 5xx responses raise an exception instead of passing silently.",
      },
      {
        title: "Run it and read the response",
        body: "response.status_code holds the status, response.json() parses a JSON body and response.text returns the body as a string. For many calls to the same host, create a requests.Session so connections are reused, which is much faster than a new connection for each call.",
      },
    ],
    notes: [
      "Use json= for JSON and data= for forms. Passing a dict to data= sends form encoding, not JSON.",
      "httpx times out after five seconds by default and does not follow redirects unless follow_redirects=True.",
      "urllib raises HTTPError for 4xx and 5xx responses, unlike requests, and has no multipart helper.",
      "Be careful scraping: only call endpoints you are allowed to use, and respect rate limits and robots rules.",
    ],
    faqs: [
      {
        question: "How do I upload a file from Python?",
        answer:
          "Pass files={'file': open('photo.jpg', 'rb')} to requests.post, optionally as a tuple of file name, file object and content type. Other form fields go in data=. The converter builds this from curl -F.",
      },
      {
        question: "What is the difference between data= and json= in requests?",
        answer:
          "data= sends form-encoded fields (or raw text or bytes). json= serialises a Python object to JSON and sets Content-Type: application/json. Use json= for JSON APIs.",
      },
      {
        question: "Should I use requests or httpx?",
        answer:
          "requests is simple and ubiquitous. Choose httpx if you need async code, HTTP/2 or a stricter default for redirects and timeouts. Their APIs are very similar, so switching later is easy.",
      },
    ],
  },

  {
    slug: "cors-errors-explained-and-how-to-fix-them",
    title: "CORS errors explained, and how to fix them",
    metaTitle: "CORS Errors Explained and How to Fix Them",
    metaDescription:
      "Why browsers block cross-origin requests, how preflights work, and the exact headers that fix 'No Access-Control-Allow-Origin' errors, step by step.",
    keywords: [
      "cors error fix",
      "no access-control-allow-origin header",
      "what is cors",
      "cors preflight options",
      "access-control-allow-credentials wildcard",
      "cors nginx header",
    ],
    toolSlug: "http-header-generator",
    toolLabel: "HTTP Header Generator",
    published: "2026-09-30",
    updated: "2026-09-30",
    intro: [
      "“Access to fetch at … has been blocked by CORS policy” is one of the most searched error messages in web development, and one of the most misunderstood. The request usually reached the server and got an answer; the browser then refused to hand that answer to your JavaScript because the server did not say your site was allowed to read it.",
      "CORS is a browser rule, enforced on the client but fixed on the server. This guide explains what triggers it, how to read the error, and exactly which headers to send, including the traps with credentials, preflight requests and caching.",
    ],
    steps: [
      {
        title: "Understand the same-origin policy",
        body: "An origin is the combination of scheme, host and port. By default, a page on https://app.example.com may not read responses from https://api.example.com, because they are different origins. Cross-Origin Resource Sharing is the opt-in mechanism: the other server names the origins that may read its responses using Access-Control-Allow-Origin.",
      },
      {
        title: "Tell simple requests from preflighted ones",
        body: "A GET, HEAD or plain form POST with only basic headers is sent straight away, and the browser checks the response headers afterwards. Anything else (PUT, PATCH, DELETE, a JSON Content-Type, or a custom header such as Authorization) makes the browser send an OPTIONS preflight first, asking whether the real request is allowed. If the preflight fails, the real request is never sent.",
      },
      {
        title: "Read the error message",
        body: "“No Access-Control-Allow-Origin header is present” means the response did not include the header. “The value of the Access-Control-Allow-Origin header must not be the wildcard * when credentials mode is include” means you send cookies, so the server must name the exact origin. “Request header field … is not allowed by Access-Control-Allow-Headers” and “Method … is not allowed” refer to the preflight answer. “Response to preflight request doesn't pass access control check” often means the OPTIONS request was redirected, needed authentication or returned an error status.",
      },
      {
        title: "Send the right headers from the server",
        body: "On the real response add Access-Control-Allow-Origin with your exact origin, and Vary: Origin if the value depends on the request. For preflights, answer OPTIONS with a 204 status and Access-Control-Allow-Methods, Access-Control-Allow-Headers and optionally Access-Control-Max-Age. If the page sends cookies or an Authorization header with credentials, add Access-Control-Allow-Credentials: true. The HTTP Header Generator builds these and outputs them for nginx, Apache, Express and other servers.",
      },
      {
        title: "Test with the response in front of you",
        body: "Open the Network tab and look at both the OPTIONS request and the real one. Paste the response headers into the HTTP Header Viewer, which checks for the wildcard-with-credentials mistake and a missing Vary: Origin. Retest after every change, and clear the browser's cached preflight if needed.",
      },
    ],
    notes: [
      "Do not fix CORS with a public “CORS proxy” or by disabling web security in your browser. Both hide the problem and expose your users.",
      "CORS does not protect your server from other clients: curl and other servers ignore it. It protects users' browsers.",
      "The wildcard * cannot be combined with credentials, and * in Access-Control-Allow-Headers is treated literally when credentials are used.",
      "If the allowed origin is chosen dynamically, check it against a fixed allow-list and always add Vary: Origin.",
    ],
    faqs: [
      {
        question: "Why does my request work in Postman but not in the browser?",
        answer:
          "Postman is not a browser and does not apply the same-origin policy. The browser will only let your page read the response if the server sends the right CORS headers, so the request can succeed on the network and still be blocked in JavaScript.",
      },
      {
        question: "Why is there an OPTIONS request I never made?",
        answer:
          "It is the preflight. The browser sends it automatically before a cross-origin request that uses a non-simple method, a JSON content type or custom headers, to ask the server for permission first.",
      },
      {
        question: "Can I set Access-Control-Allow-Origin to *?",
        answer:
          "For public, non-credentialed data, yes. For anything tied to a user, or whenever the page sends cookies, you must name the specific origin instead. Browsers reject * together with credentials.",
      },
      {
        question: "Do I need CORS for localhost development?",
        answer:
          "Yes if the front end and the API run on different ports, because a different port is a different origin. Either allow the development origin on the API or use your dev server's proxy so both appear on one origin.",
      },
    ],
  },

  {
    slug: "what-internet-speed-do-you-need",
    title: "What internet speed do you need? Mbps explained",
    metaTitle: "What Internet Speed Do You Need? Mbps Explained",
    metaDescription:
      "How many Mbps you need for streaming, video calls, gaming and a busy household, what ping and jitter mean, and how to test your speed properly.",
    keywords: [
      "what internet speed do i need",
      "how many mbps do i need",
      "good internet speed",
      "mbps vs mb/s",
      "what is a good ping",
      "bufferbloat",
      "how to test internet speed accurately",
    ],
    toolSlug: "internet-speed-test",
    toolLabel: "Internet Speed Test",
    published: "2026-09-30",
    updated: "2026-09-30",
    intro: [
      "Internet plans are sold in megabits per second, and it is surprisingly hard to know whether 50, 100 or 500 Mbps is enough. The honest answer depends on what you do, how many people share the connection, and often on latency and Wi-Fi quality more than on the headline number.",
      "This guide translates Mbps into real activities, explains the difference between speed, ping and jitter, and shows how to run a speed test that tells you something useful.",
    ],
    steps: [
      {
        title: "Know Mbps from MB/s",
        body: "Plans and speed tests use megabits per second (Mbps). File downloads and many apps show megabytes per second (MB/s). A byte is eight bits, so divide by eight: a 100 Mbps connection tops out around 12.5 MB/s, which downloads a 1 GB file in roughly 80 seconds.",
      },
      {
        title: "Match speed to what you do",
        body: "Browsing and email need 1 to 5 Mbps. HD video streaming uses about 5 to 8 Mbps per stream, and 4K uses about 15 to 25. A video call uses 3 to 6 Mbps in each direction. Cloud backups and large uploads benefit from 10 Mbps or more of upload. Most online games use little bandwidth but are very sensitive to latency.",
      },
      {
        title: "Add up the household",
        body: "Count simultaneous activities, not people. A household with one 4K stream (25 Mbps), two video calls (12 Mbps), a game download and background updates is comfortable at around 100 Mbps. Two people browsing and streaming HD are fine on 50 Mbps. Fibre and cable plans are often symmetrical or strongly asymmetrical: check the upload figure if you work from home.",
      },
      {
        title: "Watch latency and jitter, not just speed",
        body: "Latency (ping) is how long a message takes to make a round trip; under 50 ms is good for gaming and calls. Jitter is how much that time varies, and high jitter makes calls choppy even on a fast line. Bufferbloat is the extra delay that appears when the connection is busy, caused by oversized queues in the router. A test that measures latency under load reveals it.",
      },
      {
        title: "Test properly",
        body: "Use a cable to the router, or stand near it on Wi-Fi. Close other downloads and streams, turn off any VPN, and run the test two or three times at different times of day. Compare Wi-Fi with wired results to see whether the line or the wireless network is the limit. Expect results slightly under your plan's advertised maximum.",
      },
    ],
    notes: [
      "5 GHz Wi-Fi is faster but has shorter range than 2.4 GHz. Mesh systems and moving the router to a central spot often help more than a faster plan.",
      "Speed tests in a browser are limited by the device and browser; very fast lines can read lower than a native app reports.",
      "Mobile connections vary a lot with signal and congestion. Measure in the place you will use it.",
      "If bufferbloat is the problem, enabling SQM or smart queue management on your router is often a free fix.",
    ],
    faqs: [
      {
        question: "Is 100 Mbps fast enough?",
        answer:
          "For most households, yes: it supports several HD streams, video calls and downloads at once. Heavy use by many people, frequent large uploads or 4K streams on several screens benefit from 300 Mbps or more.",
      },
      {
        question: "What is a good ping for gaming?",
        answer:
          "Under 30 ms is excellent and under 50 ms is good. Above 100 ms most fast-paced online games feel laggy. Stable jitter matters as much as the average.",
      },
      {
        question: "Why is my Wi-Fi slower than my wired speed?",
        answer:
          "Wi-Fi speed falls with distance, walls, interference from neighbours and the number of devices. The wired figure is the line's speed. If they differ greatly, improve the wireless setup rather than upgrading the plan.",
      },
    ],
  },

  {
    slug: "dice-probability-chart-2d6-3d6-d20",
    title: "Dice probability: the odds for 2d6, 3d6 and d20 rolls",
    metaTitle: "Dice Probability Chart: 2d6, 3d6 and d20 Odds",
    metaDescription:
      "Exact odds for rolling two or three dice, advantage and disadvantage on a d20, and why 7 is the most common roll. With tables you can trust.",
    keywords: [
      "dice probability",
      "2d6 probability chart",
      "3d6 probability",
      "d20 advantage probability",
      "4d6 drop lowest average",
      "odds of rolling a 7 with two dice",
    ],
    toolSlug: "dice-roller",
    toolLabel: "Dice Roller",
    published: "2026-09-30",
    updated: "2026-09-30",
    intro: [
      "A single fair die is easy: every face is equally likely. The moment you add dice together, the odds change shape, and the middle totals become far more common than the ends. That is why 7 dominates board games with two dice, why ability scores cluster around 10 and 11, and why advantage on a d20 is worth so much.",
      "This guide gives the exact probabilities for the most common rolls. Each figure is computed by counting every possible outcome, so you can use them to plan a game, set a difficulty or simply settle an argument.",
    ],
    steps: [
      {
        title: "Two six-sided dice (2d6)",
        body: "There are 36 equally likely outcomes. A total of 7 can be made six ways (1+6, 2+5, 3+4 and their reverses), so it comes up 6 in 36 (16.7%). 6 and 8 each come up 5 in 36 (13.9%), 5 and 9 four in 36 (11.1%), 4 and 10 three in 36 (8.3%), 3 and 11 two in 36 (5.6%), and 2 and 12 only once in 36 (2.8%). The chance of rolling doubles is 1 in 6, and of at least one six is 11 in 36 (30.6%).",
      },
      {
        title: "Three six-sided dice (3d6)",
        body: "There are 216 outcomes. The most likely totals are 10 and 11, each 27 in 216 (12.5%). The extremes, 3 and 18, are 1 in 216 (0.46%). Rolling 15 or higher happens in 20 of 216 rolls (9.3%), and 16 or higher in 10 of 216 (4.6%). The curve is close to a bell shape centred on 10.5.",
      },
      {
        title: "A single d20 and advantage",
        body: "With one d20 each number has a 5% chance, so a target of 11 or higher succeeds half the time. Rolling two d20 and keeping the higher (advantage) gives 1 − (1 − p)² where p is the single-roll chance: 50% becomes 75%, 30% becomes 51%, and 5% becomes 9.75%. Disadvantage keeps the lower and gives p²: 50% becomes 25%, 30% becomes 9%, and 5% becomes 0.25%. The biggest swing, 25 percentage points either way, is for a target of 11.",
      },
      {
        title: "Rolling ability scores: 4d6 drop the lowest",
        body: "Rolling four six-sided dice and discarding the lowest raises the average of the three kept dice from 10.5 to about 12.24. The chance that such a score is 15 or higher is about 23.1%, compared with 9.3% for straight 3d6.",
      },
      {
        title: "Use the roller to check your own odds",
        body: "In the Dice Roller, roll any combination and the chart shows the exact probability of each total for ordinary dice rolls. For notation with keep-highest, keep-lowest or exploding dice, roll it many times and watch how the results cluster, or work the odds out with the same counting approach: list the equally likely outcomes and count the ones you care about.",
      },
    ],
    notes: [
      "Dice have no memory: a number that has not come up for ten rolls is no more likely next time.",
      "Adding dice narrows the spread. The standard deviation of nd6 grows with the square root of n, so the average is more predictable than a single die.",
      "A modifier shifts every outcome equally. It does not change the shape of the distribution.",
      "Exploding dice have no maximum: a six is rolled again and added, so totals above the nominal range are possible.",
    ],
    faqs: [
      {
        question: "Why is 7 the most common roll with two dice?",
        answer:
          "More combinations add up to 7 than to any other total: six of the 36 equally likely pairs. Totals near the ends have few combinations, so they are rare.",
      },
      {
        question: "What is the probability of rolling a 6 on at least one of two dice?",
        answer:
          "11 in 36, about 30.6%. It is easier to count the complement: 25 of 36 outcomes have no six, so 1 − 25/36 = 11/36.",
      },
      {
        question: "Is advantage or +5 better on a d20?",
        answer:
          "It depends on the target. Advantage is worth up to about +5 on the die at the midpoint and much less near the ends. A flat +5 is worth exactly 25 percentage points until the target leaves the die's range.",
      },
    ],
  },
];
