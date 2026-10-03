import type { ToolContent } from "../content";

export const NEW_OFFLINE_CONTENT: Record<string, ToolContent> = {
  "subnet-calculator": {
    intro:
      "IPv4 subnetting is fundamental to network architecture, whether you are planning an on-premise office LAN, configuring Kubernetes pod CIDR ranges, or provisioning virtual private clouds (VPCs) in AWS or GCP. This calculator computes network boundaries, broadcast addresses, and usable host pools in real time, displaying both decimal addresses and a color-coded binary bit breakdown. Everything is evaluated locally in your browser with zero latency.",
    howTo: {
      title: "How to calculate IPv4 subnets",
      steps: [
        "Enter any IPv4 address (e.g. 192.168.1.1 or 10.0.0.1) or pick one of the network presets.",
        "Select the CIDR prefix (/0 to /32) from the dropdown list to adjust the subnet mask.",
        "Review the calculated network address, broadcast address, and first/last usable host addresses.",
        "Inspect the binary bit diagram to see which bits represent the network prefix versus host endpoints.",
        "Click any row in the quick CIDR reference table to jump to a specific subnet mask or copy the full summary.",
      ],
    },
    useCases: [
      {
        title: "Cloud VPC and Subnet Allocation",
        body: "When designing AWS VPCs or Google Cloud subnets, finding the right CIDR block prevents overlapping IP spaces between staging, production, and VPN interconnects.",
      },
      {
        title: "Router and Firewall Configuration",
        body: "Network engineers configuring Cisco or Juniper firewalls need exact wildcard masks and broadcast boundaries to write precise access control lists (ACLs).",
      },
      {
        title: "Point-to-Point WAN Connections",
        body: "Easily verify RFC 3021 /31 subnets for point-to-point router links that save precious IPv4 address space without dedicating broadcast addresses.",
      },
    ],
    tips: [
      "Remember that usable hosts equal 2^(32 - CIDR) - 2 for standard subnets (reserving network and broadcast).",
      "Use /24 (255.255.255.0) for standard 254-host office networks and /20 or /16 for cloud VPCs.",
      "The wildcard mask is simply the bitwise inverse of the subnet mask: 255.255.255.255 minus the netmask.",
    ],
    extraFaqs: [
      {
        question: "Can two overlapping subnets exist in the same routing table?",
        answer: "Routers use longest prefix match (LPM) routing, directing packets to the most specific matching prefix (e.g. /28 over /24). However, having overlapping subnets across different VPCs without NAT causes severe routing conflicts.",
      },
      {
        question: "What are the RFC 1918 private address ranges?",
        answer: "10.0.0.0/8 (10.0.0.0 - 10.255.255.255), 172.16.0.0/12 (172.16.0.0 - 172.31.255.255), and 192.168.0.0/16 (192.168.0.0 - 192.168.255.255).",
      },
    ],
  },

  "mac-address-lookup": {
    intro:
      "A MAC address (Media Access Control) uniquely identifies every physical network interface card (NIC), Wi-Fi chip, and virtual ethernet controller on a local network. This tool allows network administrators, sysadmins, and security analysts to look up device manufacturers using an offline database of over 150 top IEEE OUI records, normalize inconsistent MAC notations, and inspect individual transmission bits.",
    howTo: {
      title: "How to look up and format MAC addresses",
      steps: [
        "Paste any MAC address formatted with colons, hyphens, dots, or as a raw 12-character hex string.",
        "View the identified manufacturer, OUI prefix, and device vendor details instantly.",
        "Check the transmission mode (Unicast vs Multicast) and administration type (Burned-in vs Locally Administered).",
        "Copy normalized notation formatted specifically for Linux (colon), Windows (hyphen), or Cisco switches (quad-dot).",
        "Click Random MAC to generate valid synthetic MAC addresses for network lab simulations.",
      ],
    },
    useCases: [
      {
        title: "DHCP and Network Inventory Management",
        body: "Quickly identify rogue devices on your corporate Wi-Fi or home router by matching unknown MAC addresses against known hardware manufacturers.",
      },
      {
        title: "Switch Port Security & Static Leases",
        body: "Format MAC addresses to match the exact syntax required by Cisco IOS (0011.2233.4455) or Linux dnsmasq configurations without manual string manipulation.",
      },
      {
        title: "Detecting Randomized Private Wi-Fi MACs",
        body: "Inspect the U/L bit to determine whether a smartphone is connecting with its real factory hardware address or using randomized private addresses (iOS/Android privacy feature).",
      },
    ],
    tips: [
      "The first 6 hexadecimal digits represent the IEEE Organizationally Unique Identifier (OUI).",
      "Locally Administered Addresses (LAAs) have their second hex digit set to 2, 6, A, or E.",
      "Multicast addresses always have an odd number as their first octet (the lowest bit is 1).",
    ],
    extraFaqs: [
      {
        question: "Can two devices share the same MAC address?",
        answer: "Globally burned-in MAC addresses from certified vendors should never collide. However, virtual machines and software drivers can spoof or override MAC addresses, creating duplicate MAC conflicts on a local layer-2 collision domain.",
      },
      {
        question: "Does MAC address lookup work without internet?",
        answer: "Yes. TabBench bundles a comprehensive offline dictionary of common hardware vendors directly in JavaScript, so lookups execute instantly offline.",
      },
    ],
  },

  "ipv4-to-ipv6": {
    intro:
      "As networks transition from IPv4 exhaustion to global IPv6 adoption, engineers frequently encounter dual-stack protocols, tunneling mechanisms, and hybrid socket communications. This tool translates IPv4 addresses into standard IPv6 formats, including IPv4-mapped addresses (RFC 4291) and 6to4 prefixes (RFC 3056), and provides an IPv6 expander/compressor with reverse DNS zone computation.",
    howTo: {
      title: "How to convert and expand IP addresses",
      steps: [
        "Select IPv4 to IPv6 Converter or IPv6 Expander & Compressor mode.",
        "For IPv4, enter any decimal dotted-quad address to generate mapped and 6to4 prefixes.",
        "For IPv6, enter any compressed or mixed address to expand it to the full 32-digit canonical format.",
        "Inspect integer and hexadecimal conversions alongside reverse DNS pointer records.",
        "Copy any generated format directly to your clipboard for firewall or DNS zone files.",
      ],
    },
    useCases: [
      {
        title: "Dual-Stack Socket Programming",
        body: "Software developers writing networking code in Node.js, Go, or Python use IPv4-mapped IPv6 addresses (::ffff:192.0.2.1) to support both IPv4 and IPv6 clients through a single IPv6 listening socket.",
      },
      {
        title: "Reverse DNS (PTR) Record Deployment",
        body: "Generating PTR records in ip6.arpa requires reversing all 32 hex nibbles separated by dots. This tool computes the exact reverse string automatically.",
      },
      {
        title: "Firewall Rule Normalization",
        body: "Expanding compressed IPv6 addresses to 32 digits eliminates ambiguities when auditing access control lists and security group rules.",
      },
    ],
    tips: [
      "RFC 5952 dictates that only the longest consecutive sequence of zero 16-bit blocks should be replaced by '::'.",
      "IPv4-mapped addresses start with ::ffff: followed by the IPv4 address in decimal or hex.",
      "6to4 uses the 2002::/16 prefix, embedding the 32-bit IPv4 address into the next 32 bits.",
    ],
    extraFaqs: [
      {
        question: "What happened to IPv4-compatible IPv6 addresses?",
        answer: "IPv4-compatible addresses (::192.0.2.1 without ffff) were deprecated by RFC 4291 because they caused routing ambiguities. IPv4-mapped addresses (::ffff:192.0.2.1) should always be used instead.",
      },
      {
        question: "Why does IPv6 use colons instead of dots?",
        answer: "IPv6 addresses are 128 bits long (represented as 8 groups of 4 hexadecimal digits). Dots are reserved for IPv4 and domain names, whereas colons provide a clean delimiter for 16-bit hex blocks.",
      },
    ],
  },

  "ssl-cert-decoder": {
    intro:
      "Transport Layer Security (TLS) certificates secure web applications, APIs, and enterprise communication. Inspecting certificate parameters before deploying or debugging handshake failures is critical. This client-side decoder parses PEM-encoded X.509 certificates and CSRs, calculating expiration countdowns, subject alternative names (SANs), serial numbers, and cryptographic fingerprints without uploading your credentials to any third-party server.",
    howTo: {
      title: "How to decode an SSL certificate or CSR",
      steps: [
        "Paste the raw PEM certificate starting with '-----BEGIN CERTIFICATE-----' or choose a sample certificate.",
        "Review the Days Remaining status badge to verify whether the certificate is active or expired.",
        "Inspect the Subject (Issued To) and Issuer (Certificate Authority) distinguished names.",
        "Check all secured domains under the Subject Alternative Names (SAN) list.",
        "Verify public key algorithms, key lengths, signature algorithms, and copy the SHA-256 fingerprint.",
      ],
    },
    useCases: [
      {
        title: "Certificate Expiration & Renewal Audits",
        body: "Prevent catastrophic production outages by checking exact expiration timestamps and remaining days before certificates expire.",
      },
      {
        title: "Verifying Multi-Domain SAN Coverage",
        body: "Confirm that wildcard certificates (*.domain.com) and additional subdomains are correctly included in the certificate extension before binding to a reverse proxy.",
      },
      {
        title: "CSR Validation Before CA Signing",
        body: "Inspect Certificate Signing Requests (CSRs) to verify that country codes, common names, and key algorithms match requirements prior to purchasing an expensive certificate.",
      },
    ],
    tips: [
      "Never paste your private key anywhere. This tool only requires the public certificate or CSR.",
      "Most modern CAs issue 90-day to 398-day certificates to maintain strict cryptographic freshness.",
      "The SHA-256 fingerprint can be compared directly against browser security indicators to verify certificate pinning.",
    ],
    extraFaqs: [
      {
        question: "Can an SSL certificate be decoded without the private key?",
        answer: "Yes. Certificates are public documents distributed freely to any client that connects. They contain public keys and identity metadata; the private key remains confidential on the origin server.",
      },
      {
        question: "What is an intermediate certificate?",
        answer: "Intermediate certificates link the leaf certificate on your server to a trusted Root CA pre-installed in operating system and browser trust stores, establishing an unbroken chain of trust.",
      },
    ],
  },

  "sql-formatter": {
    intro:
      "Raw SQL queries produced by ORMs or extracted from server logs often lack indentation, newlines, and structure, making debugging tedious and error-prone. This offline SQL formatter parses query structures, uppercases standard keywords, aligns clauses like JOIN, WHERE, and GROUP BY, and optionally minifies statements for production database migrations.",
    howTo: {
      title: "How to format and beautify SQL",
      steps: [
        "Paste your unformatted SQL query into the input editor or click one of the preloaded query presets.",
        "Choose your keyword casing preference: UPPERCASE (standard), lowercase, or preserve original.",
        "Select your indentation depth (2 spaces, 4 spaces, or 1 tab).",
        "Enable Minify SQL if you need to strip comments and collapse query text for one-line deployment scripts.",
        "Copy the formatted result or download it as a ready-to-use .sql file.",
      ],
    },
    useCases: [
      {
        title: "Debugging Complex Multi-Join Queries",
        body: "Quickly break down massive multi-table joins and subqueries into clearly indented clauses to pinpoint syntax and logical errors.",
      },
      {
        title: "Standardizing Code Reviews and Style Guides",
        body: "Enforce consistent SQL styling across database engineering teams before committing migration files to version control.",
      },
      {
        title: "Minifying SQL for Automated Migrations",
        body: "Strip line comments and reduce payload sizes for automated deployment pipelines and embedded database scripts.",
      },
    ],
    tips: [
      "Using UPPERCASE for SQL keywords makes query logic stand out visually against table and column names.",
      "Aligning JOIN conditions (ON clause) directly under the joined table simplifies visual join dependency tracking.",
      "All formatting executes locally in your browser, keeping sensitive table names and query data confidential.",
    ],
    extraFaqs: [
      {
        question: "Does formatting alter the query execution plan?",
        answer: "No. SQL query compilers and query planners ignore whitespace, indentation, and keyword casing. Formatting only improves human readability.",
      },
      {
        question: "Does this formatter support Common Table Expressions (WITH clauses)?",
        answer: "Yes. The parser recognizes CTE definitions, subqueries, unions, and analytical window functions.",
      },
    ],
  },

  "json-to-yaml": {
    intro:
      "Modern DevOps and cloud engineering frequently require translating configurations between JSON (the universal API standard) and YAML (the standard for Kubernetes, Docker Compose, and CI/CD pipelines). This tool provides bidirectional conversion with synchronized side-by-side editing, syntax checking, and preloaded deployment presets.",
    howTo: {
      title: "How to convert JSON to YAML and YAML to JSON",
      steps: [
        "Select your desired conversion direction: JSON to YAML or YAML to JSON.",
        "Paste your configuration snippet or pick from Docker, Kubernetes, or GitHub Actions presets.",
        "Adjust the indentation spacing (2 spaces or 4 spaces) to match your team's style guide.",
        "Click Swap Direction to reverse the flow and convert the output back immediately.",
        "Copy the converted output or download it as a clean .yaml or .json file.",
      ],
    },
    useCases: [
      {
        title: "Kubernetes Manifest Authoring",
        body: "Convert raw JSON API resources from kubectl get pod -o json into clean, human-editable YAML manifests for Helm charts or GitOps.",
      },
      {
        title: "Docker Compose Configuration",
        body: "Transform microservice configurations into standard YAML compose specifications with concise array and map representations.",
      },
      {
        title: "CI/CD Pipeline Migration",
        body: "Quickly convert GitHub Actions, GitLab CI, or OpenAPI Swagger definitions between formats without indentation errors.",
      },
    ],
    tips: [
      "YAML is whitespace-sensitive: always use spaces instead of tab characters to avoid parser errors.",
      "Strings containing colons or special characters are automatically quoted for safe serialization.",
      "The conversion runs 100% offline, keeping API tokens and secrets in your config files secure.",
    ],
    extraFaqs: [
      {
        question: "Can YAML contain comments that JSON does not support?",
        answer: "Yes. YAML supports single-line comments (#). When converting YAML to JSON, comments are stripped because standard JSON does not support comment syntax.",
      },
      {
        question: "What is the best indentation standard for YAML?",
        answer: "Two spaces is the de-facto industry standard across Kubernetes, Ansible, Docker Compose, and GitHub Actions.",
      },
    ],
  },

  "chmod-calculator": {
    intro:
      "Unix and Linux file permissions determine who can read, modify, or execute files and directories on a server. Remembering octal numbers, symbolic representations, and special bits (SUID, SGID, Sticky) can be error-prone. This interactive calculator synchronizes a 3x3 permission grid with octal codes and generates exact chmod commands.",
    howTo: {
      title: "How to calculate chmod permissions",
      steps: [
        "Toggle Read (4), Write (2), and Execute (1) checkboxes for Owner, Group, and Others.",
        "Enable SUID, SGID, or Sticky Bit if configuring shared directories or special binaries.",
        "Watch the Octal number (e.g. 755 or 644) and Symbolic string (-rwxr-xr-x) update in real time.",
        "Select from common server presets like SSH keys (600), web directories (755), or scripts.",
        "Copy the ready-to-run chmod command or recursive directory fix script.",
      ],
    },
    useCases: [
      {
        title: "Securing SSH Key Files",
        body: "OpenSSH strictly refuses private keys with loose permissions. Use chmod 600 (read/write for owner only) to fix 'WARNING: UNPROTECTED PRIVATE KEY FILE!'.",
      },
      {
        title: "Web Server File and Directory Security",
        body: "Fix web server permission issues by setting directories to 755 (drwxr-xr-x) and files to 644 (-rw-r--r--) with the provided find command.",
      },
      {
        title: "Shared Directory Collaboration with Sticky Bit",
        body: "Configure /tmp or team folders with chmod 1777 (drwxrwxrwt) so team members can create files without deleting each other's work.",
      },
    ],
    tips: [
      "Directories always require the execute bit (x) for users to cd into them or list their contents.",
      "Avoid chmod 777 on production servers; it gives every local user write access to critical files.",
      "SUID (4000) causes an executable to run with the privileges of the file owner rather than the calling user.",
    ],
    extraFaqs: [
      {
        question: "How do octal permissions add up?",
        answer: "Read = 4, Write = 2, Execute = 1. Add the numbers for each role: Read + Write = 6, Read + Execute = 5, Read + Write + Execute = 7.",
      },
      {
        question: "What is SGID on a directory?",
        answer: "When SGID (2000) is set on a directory, all newly created files inherit the directory's group ownership rather than the primary group of the user who created them.",
      },
    ],
  },

  "docker-to-compose": {
    intro:
      "Running containers using long docker run commands is convenient for quick tests, but difficult to maintain, document, and replicate in production. This tool converts complex docker run CLI invocations into standardized, version-controlled docker-compose.yml files, parsing ports, volumes, environment variables, restart policies, and resource limits automatically.",
    howTo: {
      title: "How to convert docker run to Docker Compose",
      steps: [
        "Paste your full 'docker run ...' command into the editor or pick one of the application presets.",
        "The parser extracts flags including -p, -v, -e, --restart, -d, --network, and --name.",
        "Review the generated docker-compose.yml structure with dedicated services, ports, and environment blocks.",
        "Named volumes and external networks are automatically identified and declared at the bottom.",
        "Copy the YAML directly or download it as docker-compose.yml for your project repository.",
      ],
    },
    useCases: [
      {
        title: "Migrating from Ad-Hoc Scripts to Docker Compose",
        body: "Convert chaotic bash deployment scripts with 12-line docker run commands into clean, declarative Compose files that can be run with docker compose up.",
      },
      {
        title: "Documenting Application Infrastructure",
        body: "Check container port bindings, mounted host volumes, and restart policies into Git repositories for reproducible developer onboarding.",
      },
      {
        title: "Standardizing Microservice Stacks",
        body: "Consolidate separate database, web, and cache containers into a unified multi-container docker-compose.yml stack.",
      },
    ],
    tips: [
      "Use --restart unless-stopped to keep containers running after server reboots without restarting manually.",
      "Relative volume mounts (./data:/data) are kept as bind mounts; non-path volumes become named volumes.",
      "The tool runs entirely in your browser: environment variables and secrets are never sent to external servers.",
    ],
    extraFaqs: [
      {
        question: "Does this support multi-line docker run commands with backslashes?",
        answer: "Yes. Backslashes and newline breaks are automatically normalized before parsing flags.",
      },
      {
        question: "What version of Docker Compose is generated?",
        answer: "It generates the modern Compose Specification standard, supported by all current versions of Docker and Docker Compose v2.",
      },
    ],
  },

  "box-shadow-gen": {
    intro:
      "High-quality digital UI design relies on subtle, multi-layered shadows to convey realistic depth, elevation, and tactile hierarchy. Single-layer box shadows often look harsh or artificial. This generator allows designers and frontend developers to layer up to 5 box shadows, test them on light and dark canvases, and export pure CSS or Tailwind arbitrary classes.",
    howTo: {
      title: "How to generate multi-layer box shadows",
      steps: [
        "Select a starting preset (Subtle Card, Floating Elevation, Neon Glow) or build from scratch.",
        "Add or remove shadow layers and toggle individual layer visibility with the eye icon.",
        "Fine-tune X offset, Y offset, blur radius, spread radius, and opacity for the active layer.",
        "Switch between light and dark canvas backgrounds to verify contrast across color themes.",
        "Copy the resulting CSS box-shadow property or Tailwind arbitrary class (shadow-[...]).",
      ],
    },
    useCases: [
      {
        title: "Modern Design System Elevation Tokens",
        body: "Build layered elevation scales (elevation-1 through elevation-5) for design systems with smooth ambient occlusion and key light shadows.",
      },
      {
        title: "Cyberpunk and Dark Mode Neon Glows",
        body: "Stack multiple colored blur layers with zero offset to create radiant glowing buttons and illuminated borders.",
      },
      {
        title: "Inset Card and Bevel Styling",
        body: "Enable the inset toggle on a top layer to create subtle inner rim highlights or recessed neumorphic form inputs.",
      },
    ],
    tips: [
      "For natural lighting, make layer 1 small with low blur (sharp contact shadow) and layer 2 large with high blur (ambient light).",
      "Keep opacity low (between 5% and 15%) for clean, professional cards that don't overwhelm content.",
      "Tailwind's arbitrary syntax replaces spaces with underscores: shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)].",
    ],
    extraFaqs: [
      {
        question: "What does the spread radius do in box-shadow?",
        answer: "Spread expands or contracts the shadow shape before blurring. A negative spread shrinks the shadow so it doesn't spill over card edges, creating a tighter, cleaner elevation look.",
      },
      {
        question: "Can box-shadow affect performance?",
        answer: "Heavy shadows with massive blur radii (over 100px) on frequently animated elements can trigger GPU paint overhead. For static cards and modals, modern hardware renders them with zero lag.",
      },
    ],
  },

  "glassmorphism-gen": {
    intro:
      "Frosted glass UI elements bring depth and visual elegance to modern web and mobile applications, creating a sense of physical layering. This generator lets you customize backdrop-filter blur, tint opacity, and refraction border highlights with live previews over vibrant gradient meshes, geometric shapes, and neon scenes.",
    howTo: {
      title: "How to create glassmorphism effects",
      steps: [
        "Pick a preset (Frosted Glass, Dark HUD, Minimal Rim) or customize sliders manually.",
        "Adjust backdrop blur and saturation boost to control how strongly background colors pop through.",
        "Tune background color, opacity, and the subtle light-refraction border highlight.",
        "Toggle between Gradient Scene, Geometric Shapes, and Neon Glow backgrounds to test transparency.",
        "Copy the CSS code (including WebKit prefixes) or the combined Tailwind CSS utility classes.",
      ],
    },
    useCases: [
      {
        title: "Floating Navigation Bars and Headers",
        body: "Create semi-transparent sticky headers that blur the underlying page content as the user scrolls, maintaining readability.",
      },
      {
        title: "Modern Dashboard HUD Panels",
        body: "Build sleek analytics cards and sidebars over dynamic charts or dark mode background wallpaper.",
      },
      {
        title: "Interactive Modal Dialogs",
        body: "Display frosted glass modal backdrops that focus user attention on the dialog while keeping background context visible.",
      },
    ],
    tips: [
      "Always include a 1px border with 20-40% white opacity to simulate the physical edge refraction of glass.",
      "A saturation boost (140-180%) makes blurred background colors vibrant instead of dull or muddy.",
      "Ensure text contrast remains WCAG AA compliant by pairing dark text with light tint or white text with dark tint.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between filter: blur() and backdrop-filter: blur()?",
        answer: "filter: blur() blurs the element itself and its children. backdrop-filter: blur() blurs whatever content is positioned behind the element, keeping the element's text crystal clear.",
      },
      {
        question: "Why do I need -webkit-backdrop-filter?",
        answer: "Safari and iOS browsers require the -webkit- prefix to activate hardware-accelerated background blurring.",
      },
    ],
  },

  "px-to-rem": {
    intro:
      "Web accessibility guidelines strongly recommend using relative units (REM and EM) instead of static pixels (PX) so typography respects user browser magnification preferences. This tool provides bidirectional conversion between pixels, rems, ems, percentages, and points, alongside an interactive CSS clamp() fluid typography calculator with a live viewport resizer.",
    howTo: {
      title: "How to convert PX to REM and calculate fluid clamp()",
      steps: [
        "Set your root font size base (default is 16px, or switch to 14px, 12px, or 10px).",
        "Enter any pixel or rem value; the other fields update bidirectionally in real time.",
        "In the Fluid Typography section, set your minimum/maximum viewport and font sizes.",
        "Drag the Simulate Viewport slider to watch the responsive text scale smoothly across screen sizes.",
        "Copy the generated clamp() formula or reference the Tailwind CSS font size cheat sheet.",
      ],
    },
    useCases: [
      {
        title: "Figma to Code Implementation",
        body: "Quickly convert pixel values from Figma design specifications into accessible rem units for production CSS.",
      },
      {
        title: "Fluid Responsive Headlines",
        body: "Use CSS clamp() to make hero titles seamlessly scale from mobile screens (375px) to ultra-wide displays (1440px) without jagged media query breakpoints.",
      },
      {
        title: "Accessible Theme Development",
        body: "Audit component libraries to ensure padding, margins, and typography scale appropriately with browser zoom.",
      },
    ],
    tips: [
      "1rem equals the root html font-size (16px in default browser configurations).",
      "CSS clamp(min, preferred, max) eliminates the need for 4 different media queries to resize a single headline.",
      "Use REM for font sizes and layout spacing, and PX for 1px borders and hairline dividers.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between REM and EM?",
        answer: "REM (Root EM) is always relative to the root <html> element font size. EM is relative to the font size of the immediate parent element, which can cause compounding size issues when nested.",
      },
      {
        question: "How does the viewport unit (vw) in clamp() prevent layout shift?",
        answer: "The linear slope formula combines viewport width (vw) with a fixed rem offset, allowing the browser to recalculate font size continuously without triggering layout recalculations.",
      },
    ],
  },

  "svg-to-data-uri": {
    intro:
      "Inlining SVGs into CSS stylesheets or HTML eliminates external HTTP network requests and prevents icon flickering. However, raw SVGs must be cleaned and encoded properly to avoid broken rendering across browsers. This tool strips unneeded XML metadata and encodes SVGs into modern UTF-8 Data URIs (up to 25% smaller than Base64) with live canvas previews.",
    howTo: {
      title: "How to encode SVG into Data URIs",
      steps: [
        "Paste your raw <svg> markup or drag-and-drop an .svg file from your computer.",
        "The tool cleans XML headers, doctypes, comments, and redundant line breaks automatically.",
        "Inspect the live rendered icon on checkered, light, or dark canvas backgrounds.",
        "Choose your target format: CSS background-image, UTF-8 Data URI, Base64 Data URI, or HTML img tag.",
        "Click Copy on the desired format to paste directly into your code.",
      ],
    },
    useCases: [
      {
        title: "CSS Background Icons & Checkboxes",
        body: "Embed custom select dropdown arrows, checkbox checkmarks, and radio indicators directly into CSS background-image rules without asset dependencies.",
      },
      {
        title: "Zero-Latency Icon Delivery",
        body: "Prevent flash of unstyled content (FOUC) by embedding critical above-the-fold brand logos and hero icons directly into the document head.",
      },
      {
        title: "Standalone Single-File HTML Bundles",
        body: "Create fully self-contained HTML documents or email templates where external image assets cannot be loaded over HTTP.",
      },
    ],
    tips: [
      "UTF-8 Data URIs only escape necessary characters ('#', '\"', '%') and compress far better than Base64 in Gzip/Brotli.",
      "Ensure your SVG includes a viewBox attribute so it scales cleanly when used in CSS backgrounds.",
      "Always set width and height or background-size when using SVG data URIs in CSS.",
    ],
    extraFaqs: [
      {
        question: "Why do unescaped '#' characters break SVG Data URIs?",
        answer: "In web URLs, '#' denotes an anchor fragment identifier. Browsers treat unescaped '#' as the end of the URI, breaking the SVG stroke or fill colors unless escaped as '%23'.",
      },
      {
        question: "Is there a file size limit for Data URIs?",
        answer: "While modern browsers support multi-megabyte Data URIs, inlining is best suited for icons and graphics under 20 KB to avoid inflating initial stylesheet parse times.",
      },
    ],
  },

  "color-palette-gen": {
    intro:
      "Creating a unified design system requires a comprehensive scale of color tints and shades from subtle backgrounds (50) to deep text accents (950). This generator calculates a complete 11-step Tailwind CSS shade scale from any base color, computes real-time WCAG 2.1 accessibility contrast scores, generates harmonious palettes, and exports ready-to-use config snippets.",
    howTo: {
      title: "How to generate Tailwind color palettes",
      steps: [
        "Pick a base brand color using the color picker, type a HEX code, or click Random Color.",
        "View the 11-step shade palette (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950).",
        "Inspect the WCAG accessibility contrast score badges displayed on each shade card.",
        "Explore harmonious color pairings: Complementary, Analogous, and Triadic.",
        "Copy individual shade HEX codes or export the full tailwind.config.js / CSS Custom Properties snippet.",
      ],
    },
    useCases: [
      {
        title: "Building New Tailwind CSS Design Systems",
        body: "Generate matching primary, secondary, and neutral color scales that seamlessly integrate with Tailwind's default naming convention.",
      },
      {
        title: "Auditing UI Accessibility & WCAG Contrast",
        body: "Verify that body text and buttons meet strict WCAG AA (4.5:1) and AAA (7:1) contrast requirements before launching.",
      },
      {
        title: "Harmonious Brand Color Selection",
        body: "Find mathematically balanced complementary and analogous accent colors to pair with primary brand logos.",
      },
    ],
    tips: [
      "Shade 500 is typically used for primary buttons, 50-100 for subtle card backgrounds, and 700-900 for high-contrast text.",
      "Click any shade card to copy its exact HEX code directly to your clipboard.",
      "Ensure button text uses the recommended high-contrast text color indicated on the shade swatch.",
    ],
    extraFaqs: [
      {
        question: "How does the generator calculate shades 50 through 950?",
        answer: "The algorithm converts your base color into HSL (Hue, Saturation, Lightness), adjusts the lightness curve along a perceptual gradient from 96% down to 6%, and preserves hue harmony.",
      },
      {
        question: "What does a 4.5:1 contrast ratio signify?",
        answer: "WCAG 2.1 Level AA mandates a minimum 4.5:1 contrast ratio between text and its background to ensure readability for users with moderate visual impairments.",
      },
    ],
  },

  "llm-token-counter": {
    intro:
      "Language models do not process text in words or characters; they operate on tokens generated by Byte Pair Encoding (BPE) tokenizers. Calculating tokens before making API calls prevents context window truncation and unexpected cloud API charges. This tool estimates tokens, character counts, and exact prompt/completion pricing across OpenAI, Anthropic, Google, and Meta models.",
    howTo: {
      title: "How to count LLM tokens and estimate API costs",
      steps: [
        "Select your target model (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, Llama 3) from the dropdown.",
        "Paste your prompt, code snippet, system prompt, or RAG context into the editor.",
        "Review estimated tokens, total words, character count, and tokens-per-word metrics.",
        "Inspect the Context Window Capacity progress bar to ensure you are well within model limits.",
        "Compare prompt (input) vs completion (output) costs across all top models in the comparison table.",
      ],
    },
    useCases: [
      {
        title: "Optimizing System Prompts and Agent Instructions",
        body: "Trim verbose phrasing from agent system prompts that run on every API interaction to reduce monthly recurring inference costs.",
      },
      {
        title: "Context Window Capacity Verification",
        body: "Verify that large codebases, PDFs, or conversational histories fit within model boundaries (e.g. 128k for GPT-4o, 200k for Claude 3.5).",
      },
      {
        title: "API Budgeting & Production Cost Projections",
        body: "Accurately project operational expenses before deploying AI features across thousands of daily active users.",
      },
    ],
    tips: [
      "In general English text, 1 token is approximately 4 characters or ~0.75 words.",
      "Code, JSON payloads, and specialized punctuation typically consume significantly more tokens per word than standard prose.",
      "Everything runs locally in your browser: proprietary prompts and confidential documents are never sent anywhere.",
    ],
    extraFaqs: [
      {
        question: "Why do different models produce different token counts?",
        answer: "Each model provider trains its own tokenizer vocabulary (e.g., OpenAI's tiktoken o200k_base vs Anthropic's Claude tokenizer). Different vocabularies split words and subwords into different numbers of tokens.",
      },
      {
        question: "Why are completion tokens more expensive than prompt tokens?",
        answer: "Generating output tokens requires autoregressive computation (predicting one token at a time), which consumes significantly more GPU compute than parallelized input prompt processing.",
      },
    ],
  },

  "ai-prompt-opt": {
    intro:
      "Modern frontier language models perform drastically better when prompts use structured XML hierarchy rather than messy walls of plain text. XML tagging establishes strict boundaries that isolate instructions, domain context, negative constraints, and few-shot examples. This builder helps AI engineers and developers construct production-grade system prompts for ChatGPT, Claude, and autonomous agents.",
    howTo: {
      title: "How to build structured XML prompts",
      steps: [
        "Choose an agent template (Senior Code Reviewer, Data Extraction, Docs Writer) or start blank.",
        "Define the <role> persona, domain expertise, and communication tone.",
        "Enter the <context> background scenario and specific <objective> outcome.",
        "List strict <rules> and negative constraints ('Do NOT...') to prevent hallucinations.",
        "Add <thinking_process> instructions and <examples> for few-shot in-context learning.",
        "Copy the generated XML prompt directly into your LLM API code or system prompt settings.",
      ],
    },
    useCases: [
      {
        title: "Building Autonomous AI Agents & Workflows",
        body: "Isolate tool execution logic and planning frameworks using strict XML hierarchies that frontier models adhere to with high fidelity.",
      },
      {
        title: "Preventing Hallucinations with Negative Constraints",
        body: "Clearly state negative rules (e.g. 'Never fabricate information outside the supplied text') to prevent unwarranted assumptions.",
      },
      {
        title: "Creating Standardized Team Prompts",
        body: "Share reproducible prompt templates across engineering teams for code reviews, documentation writing, and customer support.",
      },
    ],
    tips: [
      "Anthropic Claude models specifically excel when instructions are divided with XML tags like <role> and <rules>.",
      "Always provide at least 1-2 few-shot examples in <examples> to enforce exact output formatting.",
      "Place dynamic user input inside an <input_data> tag at the very end of the prompt to mitigate prompt injection.",
    ],
    extraFaqs: [
      {
        question: "Why are XML tags better than markdown headers in prompts?",
        answer: "Markdown headers (# Header) can blend into user-supplied markdown content. XML tags provide unambiguous opening and closing delimiters that models consistently recognize as structural boundaries.",
      },
      {
        question: "What is Chain of Thought (CoT) prompting?",
        answer: "CoT instructs the model to reason step-by-step in a scratchpad or <thinking> tag before providing its final answer, dramatically increasing problem-solving accuracy on complex logic and coding tasks.",
      },
    ],
  },

  "json-schema-for-ai": {
    intro:
      "Function calling and tool use allow AI models to interact with databases, web APIs, and local code by emitting structured JSON arguments. Building compliant schemas manually is tedious and error-prone. This tool builds strict OpenAI Structured Outputs (additionalProperties: false) and Anthropic Claude Tool schemas with instant TypeScript interface export.",
    howTo: {
      title: "How to build AI function calling schemas",
      steps: [
        "Enter the tool name in snake_case (e.g. get_current_weather) and provide a clear description.",
        "Add parameters with their name, type (string, number, boolean, array, object), and description.",
        "Specify optional enum choices (e.g. celsius, fahrenheit) for restricted parameter options.",
        "Toggle OpenAI Strict Mode to enforce 'additionalProperties: false' for guaranteed schema compliance.",
        "Switch between OpenAI Tools, Anthropic Claude, and TypeScript tabs to copy or download your schema.",
      ],
    },
    useCases: [
      {
        title: "OpenAI Structured Outputs & Function Calling",
        body: "Build reliable tool definitions for gpt-4o and gpt-4o-mini that guarantee JSON payloads match your exact API parameters 100% of the time.",
      },
      {
        title: "Anthropic Claude Tool Use",
        body: "Generate clean input_schema definitions for Claude 3.5 Sonnet to invoke external search engines, calculators, and databases.",
      },
      {
        title: "Full-Stack TypeScript End-to-End Typing",
        body: "Export matching TypeScript interfaces to strongly type function call handler arguments on your backend server.",
      },
    ],
    tips: [
      "Parameter descriptions are critical: the model reads them to determine what values to extract and format.",
      "In OpenAI Strict Mode, every single property defined in the schema must also be listed in the required array.",
      "Use enum constraints whenever a parameter accepts a fixed set of choices to prevent invalid inputs.",
    ],
    extraFaqs: [
      {
        question: "What does 'additionalProperties: false' mean in JSON Schema?",
        answer: "It tells the schema validator (and the model's constrained decoding engine) that no undeclared keys are permitted in the generated JSON object, ensuring strict data hygiene.",
      },
      {
        question: "How do tools differ from standard JSON mode?",
        answer: "Standard JSON mode only ensures valid JSON syntax. Function calling and tool definitions constrain the model to output a specific schema chosen dynamically from multiple available tools.",
      },
    ],
  },

  "clean-prompt-strip": {
    intro:
      "Raw text copied from web scrapes, documentation, and code repositories is packed with markdown syntax, HTML tags, line comments, and excessive whitespace that waste context tokens and inflate API costs. Worse, pasting logs can accidentally leak sensitive PII, emails, or AWS credentials. This tool cleans markup, collapses whitespace, and masks PII locally before you send prompts to LLMs.",
    howTo: {
      title: "How to clean and sanitize prompts",
      steps: [
        "Paste your raw document, code snippet, log file, or web scrape into the input box.",
        "Toggle cleaning options: Strip HTML, Strip Comments, Strip Markdown, and Collapse Blank Lines.",
        "Enable Mask PII to automatically redact email addresses, phone numbers, IP addresses, and AWS access keys.",
        "Review the Savings & Efficiency stats to see exact tokens and characters saved.",
        "Copy the sanitized, optimized context directly for your ChatGPT prompt or RAG vector pipeline.",
      ],
    },
    useCases: [
      {
        title: "RAG Document Chunk Pre-Processing",
        body: "Clean raw HTML and documentation before generating vector embeddings, maximizing semantic density and reducing vector database storage costs.",
      },
      {
        title: "Redacting Sensitive Data and Secrets",
        body: "Protect customer privacy and infrastructure secrets by masking emails, phone numbers, server IPs, and AWS keys before sending logs to cloud LLMs.",
      },
      {
        title: "Optimizing Long Code Contexts",
        body: "Strip bulky comment blocks and licensing boilerplate from source code files before asking an AI model to refactor or audit functions.",
      },
    ],
    tips: [
      "Stripping comments and empty lines can reduce code context payload sizes by up to 30-40%.",
      "PII redactions replace sensitive data with clean markers like [EMAIL_REDACTED] that LLMs understand seamlessly.",
      "All processing happens client-side using JavaScript regex: zero data is uploaded to any server.",
    ],
    extraFaqs: [
      {
        question: "Does stripping markdown hurt LLM comprehension?",
        answer: "For pure data retrieval and context lookup tasks, stripping decorative markdown (bolding, headers, list formatting) reduces token counts without affecting the semantic meaning.",
      },
      {
        question: "What PII formats are recognized?",
        answer: "The redaction engine detects standard email addresses, international phone numbers, IPv4 addresses, major credit card patterns, and AWS access key IDs.",
      },
    ],
  },

  "tip-calculator": {
    intro:
      "Splitting restaurant bills, bar tabs, and service expenses among friends should be effortless and transparent. This calculator works out tip amounts with standard percentage chips or custom rates, divides costs across groups, applies optional per-person rounding, and generates a ready-to-paste WhatsApp or SMS summary message with one click.",
    howTo: {
      title: "How to calculate tips and split bills",
      steps: [
        "Select your currency symbol ($ , ₹ , € , £ , ¥) and enter the total bill amount.",
        "Choose a tip percentage (10%, 15%, 18%, 20%, 25%) or enter a custom rate.",
        "Set the number of people splitting the expense.",
        "Choose rounding preferences: Exact Cent, Round Total Up, or Round Per Person Up.",
        "Click Copy WhatsApp / SMS Text to share the breakdown directly with your dining group.",
      ],
    },
    useCases: [
      {
        title: "Dining Out with Friends",
        body: "Quickly work out everyone's exact share at the restaurant table without pulling out scratch paper or arguing over cents.",
      },
      {
        title: "Travel and Vacation Group Expenses",
        body: "Split shared taxi rides, group dinners, and tour guide gratuities during group vacations in multiple currencies.",
      },
      {
        title: "Fair Service Tipping",
        body: "Easily calculate appropriate tips for delivery drivers, salon services, and rideshare drivers based on service quality.",
      },
    ],
    tips: [
      "Rounding per person up avoids fractional cent confusion when collecting Venmo or UPI payments.",
      "Standard restaurant tipping in North America is 15-20%; for exceptional service, 20-25% is customary.",
      "The shareable summary makes it easy to post totals in group chats so everyone knows what to transfer.",
    ],
    extraFaqs: [
      {
        question: "Is tip calculated before or after tax?",
        answer: "Traditionally, tips are calculated on the pre-tax subtotal of food and drinks. However, calculating on the post-tax total is also common and slightly more generous to service staff.",
      },
      {
        question: "What if people ordered different amounts?",
        answer: "This calculator divides the bill and tip evenly. For itemized bills with large discrepancies, calculating individual food totals first and applying the tip percentage to each subtotal is fairest.",
      },
    ],
  },

  "fuel-cost-calc": {
    intro:
      "Planning a road trip or budgeting daily vehicle commutes requires knowing how much gasoline or diesel you will burn and what it will cost. This calculator computes fuel volume, total journey cost, and per-passenger splits in either Metric (km, L/100km, $/L) or Imperial (miles, MPG, $/gal) with preloaded vehicle efficiency presets.",
    howTo: {
      title: "How to calculate fuel and road trip costs",
      steps: [
        "Select your measurement system: Metric (km, Liters) or Imperial (miles, Gallons).",
        "Enter the one-way distance, or toggle Round Trip to automatically double the mileage.",
        "Input your vehicle's fuel efficiency, or select a preset (Hybrid, Sedan, SUV, Truck, Motorcycle).",
        "Enter the local price per liter or gallon of fuel.",
        "Set the number of passengers to split the cost, and copy the full travel expense summary.",
      ],
    },
    useCases: [
      {
        title: "Road Trip Travel Planning & Expense Sharing",
        body: "Work out total gas costs before departing on holiday and split fuel expenses fairly among carpool passengers.",
      },
      {
        title: "Daily Commute Budgeting",
        body: "Calculate your monthly fuel expenditure for work commutes to evaluate the financial benefits of public transit or electric vehicles.",
      },
      {
        title: "Business Mileage Reimbursement",
        body: "Generate clear fuel consumption and cost-per-mile figures for freelance or business expense reporting.",
      },
    ],
    tips: [
      "Highway driving typically yields 15-25% better fuel efficiency than stop-and-go city traffic.",
      "Maintaining proper tire pressure and steady highway speeds significantly improves vehicle gas mileage.",
      "Toggle Round Trip to avoid forgetting the return journey when estimating weekend road trip budgets.",
    ],
    extraFaqs: [
      {
        question: "How do I convert MPG to L/100km?",
        answer: "Divide 235.215 by the US MPG value (e.g. 235.215 / 30 MPG ≈ 7.84 L/100km). Lower L/100km numbers indicate higher fuel efficiency.",
      },
      {
        question: "Does vehicle air conditioning increase fuel consumption?",
        answer: "Yes. Running air conditioning at high settings can increase fuel consumption by roughly 5% to 10%, especially during city driving.",
      },
    ],
  },

  "work-hours-calc": {
    intro:
      "Tracking daily work hours, deducting unpaid meal breaks, and converting hours and minutes into decimal fractions is essential for accurate timesheets and payroll. This calculator features both a single-shift calculator and a full 7-day weekly timesheet, handling overnight shifts across midnight, overtime thresholds, and gross pay calculations with CSV export.",
    howTo: {
      title: "How to calculate work hours and timesheets",
      steps: [
        "Choose between 7-Day Weekly Timesheet and Single Shift Calculator.",
        "Set your regular hourly pay rate, overtime rate, and weekly overtime threshold (e.g. 40 hours).",
        "Enter shift start and end times; overnight shifts across midnight are detected automatically.",
        "Specify unpaid lunch and break minutes (e.g. 30m or 45m) to calculate net work duration.",
        "Review total hours, decimal hours for payroll entry, and export your timesheet as a CSV file.",
      ],
    },
    useCases: [
      {
        title: "Freelance & Contractor Billing",
        body: "Log daily billable hours accurately, calculate gross pay at agreed hourly rates, and generate timesheets for client invoices.",
      },
      {
        title: "Employee Payroll Timesheet Submission",
        body: "Convert standard clock-in/out times into decimal hours (e.g. 8h 45m = 8.75 hrs) required by payroll software like QuickBooks and ADP.",
      },
      {
        title: "Overnight & Night Shift Tracking",
        body: "Easily compute shifts that start in the evening (10:00 PM) and end the following morning (6:30 AM) without manual calculation errors.",
      },
    ],
    tips: [
      "Click 'Fill 9-to-5' to instantly populate a standard Monday-through-Friday 40-hour work week schedule.",
      "Payroll systems require decimal hours: 15 minutes is 0.25 hrs, 30 minutes is 0.50 hrs, 45 minutes is 0.75 hrs.",
      "Always deduct unpaid meal breaks to ensure compliance with local labor regulations and accurate payroll.",
    ],
    extraFaqs: [
      {
        question: "How is overtime pay calculated?",
        answer: "Hours worked beyond the weekly threshold (typically 40 hours) are classified as overtime and multiplied by the overtime rate (standard is 1.5x regular pay, known as 'time and a half').",
      },
      {
        question: "Are timesheet entries saved when I close the browser?",
        answer: "Calculations run locally in memory. Use the 'Export CSV' button to save a permanent copy of your completed timesheet to your computer.",
      },
    ],
  },
};
