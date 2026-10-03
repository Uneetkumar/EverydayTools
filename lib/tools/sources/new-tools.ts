import type { ToolSource } from "../registry";

/**
 * 20 Brand-New Offline-First Tools
 * 100% Client-Side execution.
 */
export const NEW_OFFLINE_TOOLS: Record<string, ToolSource> = {
  "subnet-calculator": {
    slug: "subnet-calculator",
    name: "Subnet Calculator",
    shortName: "Subnet Calc",
    tagline: "IPv4 & IPv6 CIDR subnet calculator with binary bit breakdown.",
    category: "api-http",
    description: "Calculate IPv4 and CIDR subnets, host ranges, netmasks, broadcast addresses, and binary bit masks.",
    longDescription:
      "A fast client-side IP subnet calculator. Input any IPv4 address with a CIDR prefix to calculate network address, usable host ranges, broadcast address, wildcard mask, and binary breakdown with zero latency.",
    iconName: "Network",
    privacy: "local",
    metaTitle: "Subnet Calculator: IPv4 & CIDR Range",
    metaDescription:
      "Calculate IPv4 and CIDR subnets with usable IP ranges, network masks, broadcast addresses, and binary breakdown. Free and offline.",
    keywords: [
      "subnet calculator",
      "cidr calculator",
      "ipv4 subnet mask",
      "usable ip range",
      "ip subnetting",
      "wildcard mask calculator",
      "network address calculator",
      "cidr table",
      "binary subnet mask",
    ],
    aliases: ["subnet", "cidr", "ip calc", "netmask", "ip range", "ip calculator"],
    features: [
      "Calculate network, broadcast, first and last usable host addresses",
      "Visual binary bit diagram showing network vs host bits",
      "Complete CIDR reference cheat sheet from /0 to /32",
      "RFC 1918 private vs public IP classification",
      "One-click copy for summary reports and configurations",
    ],
    faqs: [
      {
        question: "What is the difference between network address and broadcast address?",
        answer:
          "The network address is the first address in a subnet used to identify the network itself. The broadcast address is the last address in the subnet used to send packets to all devices simultaneously. Neither can be assigned to an individual host.",
      },
      {
        question: "Why do /31 and /32 subnets behave differently?",
        answer:
          "A /32 prefix represents a single host (often used for loopback interfaces). A /31 prefix has 2 addresses and is defined under RFC 3021 for point-to-point links where broadcast and network addresses are not required.",
      },
    ],
    relatedToolSlugs: ["ipv4-to-ipv6", "mac-address-lookup", "ssl-cert-decoder", "api-request-builder"],
    nextSteps: ["ipv4-to-ipv6", "mac-address-lookup"],
  },

  "mac-address-lookup": {
    slug: "mac-address-lookup",
    name: "MAC Address Lookup",
    shortName: "MAC Lookup",
    tagline: "Identify hardware vendors, normalize MAC formats, and decode OUI bits.",
    category: "api-http",
    description: "Search MAC address hardware vendors from an offline OUI database and normalize MAC notation formats.",
    longDescription:
      "Inspect and validate MAC addresses (EUI-48). Look up hardware manufacturers like Apple, Cisco, Intel, and Samsung using a bundled offline OUI database. Analyze multicast (I/G) and local administration (U/L) bits.",
    iconName: "Cpu",
    privacy: "local",
    metaTitle: "MAC Address Lookup & OUI Vendor Finder",
    metaDescription:
      "Lookup MAC address hardware vendors from our offline OUI database. Normalize colon, hyphen, Cisco dot, and hex formats instantly.",
    keywords: [
      "mac address lookup",
      "oui lookup",
      "mac vendor lookup",
      "mac address format",
      "mac normalizer",
      "ethernet address lookup",
      "eui-48",
      "mac address generator",
    ],
    aliases: ["mac vendor", "oui", "mac address", "hardware address", "ethernet mac"],
    features: [
      "Bundled offline database with 150+ common networking and hardware vendors",
      "Instant normalization between colon, hyphen, Cisco dot, and raw hex",
      "Bit breakdown for Unicast/Multicast (I/G) and Universally/Locally Administered (U/L)",
      "Integer and binary bitstream conversion",
      "Random MAC address generator for testing and lab environments",
    ],
    faqs: [
      {
        question: "What is an OUI in a MAC address?",
        answer:
          "An Organizationally Unique Identifier (OUI) is the first 24 bits (3 octets) of a MAC address assigned by the IEEE to hardware manufacturers to uniquely identify their devices.",
      },
      {
        question: "How do I know if a MAC address is randomized or virtual?",
        answer:
          "Look at the second hexadecimal digit of the first octet. If it is 2, 6, A, or E (such as x2, x6, xA, xE), the U/L bit is set to 1, indicating a Locally Administered MAC address commonly used in private Wi-Fi MAC randomization or virtual machines.",
      },
    ],
    relatedToolSlugs: ["subnet-calculator", "ipv4-to-ipv6", "ssl-cert-decoder"],
    nextSteps: ["subnet-calculator", "ipv4-to-ipv6"],
  },

  "ipv4-to-ipv6": {
    slug: "ipv4-to-ipv6",
    name: "IPv4 to IPv6 Converter",
    shortName: "IPv4 to IPv6",
    tagline: "Convert IPv4 to mapped, 6to4, hex, and compress or expand IPv6.",
    category: "api-http",
    description: "Convert IPv4 addresses to IPv6 mapped and 6to4 formats, and compress or expand IPv6 addresses.",
    longDescription:
      "A dual-purpose IP transition utility. Convert standard IPv4 addresses into IPv4-mapped IPv6, 6to4 prefixes (RFC 3056), SIIT, and hexadecimal notations. Also expand and compress IPv6 addresses with reverse DNS pointer computation.",
    iconName: "ArrowRightLeft",
    privacy: "local",
    metaTitle: "IPv4 to IPv6 Converter & Expander",
    metaDescription:
      "Convert IPv4 to IPv6 mapped, 6to4, hex, and binary formats. Expand or compress IPv6 addresses and generate reverse DNS zones.",
    keywords: [
      "ipv4 to ipv6",
      "ipv4 mapped ipv6",
      "6to4 converter",
      "ipv6 expander",
      "ipv6 compressor",
      "ip6 arpa",
      "ipv4 hex conversion",
      "dual stack transition",
    ],
    aliases: ["ipv4 ipv6", "ipv6 expand", "ipv6 compress", "6to4", "mapped ipv6"],
    features: [
      "Generate IPv4-mapped IPv6 (::ffff:192.0.2.1) and 6to4 prefixes (RFC 3056)",
      "Convert IP to raw hexadecimal, integer, and binary notations",
      "Expand compressed IPv6 to 32 hex digits",
      "Canonical IPv6 compression according to RFC 5952",
      "Generate in-addr.arpa and ip6.arpa reverse DNS zones",
    ],
    faqs: [
      {
        question: "What is an IPv4-mapped IPv6 address?",
        answer:
          "An IPv4-mapped IPv6 address (formatted as ::ffff:a.b.c.d) allows dual-stack network applications to handle IPv4 traffic using IPv6 socket APIs transparently.",
      },
      {
        question: "What is the 6to4 prefix standard?",
        answer:
          "RFC 3056 defines 6to4 as an automatic transition mechanism using the 2002::/16 prefix, embedding the 32-bit IPv4 address into the next 32 bits to provide a unique /48 IPv6 routing prefix.",
      },
    ],
    relatedToolSlugs: ["subnet-calculator", "mac-address-lookup", "ssl-cert-decoder"],
    nextSteps: ["subnet-calculator", "mac-address-lookup"],
  },

  "ssl-cert-decoder": {
    slug: "ssl-cert-decoder",
    name: "SSL Certificate Decoder",
    shortName: "SSL Decoder",
    tagline: "Inspect X.509 certificates and CSRs, validity dates, SANs, and keys.",
    category: "api-http",
    description: "Decode X.509 SSL/TLS certificates and CSRs in your browser without uploading private credentials.",
    longDescription:
      "An in-browser ASN.1/DER X.509 certificate and Certificate Signing Request (CSR) inspector. Decode Subject, Issuer, Validity periods with days-remaining countdowns, Subject Alternative Names (SANs), serial numbers, and SHA-256 fingerprints 100% locally.",
    iconName: "ShieldCheck",
    privacy: "local",
    metaTitle: "SSL Certificate Decoder: X.509 & CSR",
    metaDescription:
      "Decode X.509 SSL certificates and CSRs in your browser. Inspect validity dates, SANs, issuer, fingerprints, and public keys securely.",
    keywords: [
      "ssl certificate decoder",
      "x509 decoder",
      "csr decoder",
      "pem certificate viewer",
      "check ssl expiration",
      "certificate san inspector",
      "sha256 fingerprint certificate",
      "decode pem online",
    ],
    aliases: ["ssl decoder", "cert decoder", "x509", "csr viewer", "certificate viewer"],
    features: [
      "Pure client-side ASN.1 and DER parsing with zero server upload",
      "Live expiration badge showing exact days remaining until renewal",
      "Subject Alternative Names (SANs) domain inspection",
      "Subject and Issuer distinguished name attribute breakdown",
      "SHA-256 cryptographic fingerprint generated using Web Cryptography API",
    ],
    faqs: [
      {
        question: "Is it safe to paste certificates into this tool?",
        answer:
          "Yes. TabBench decodes X.509 certificates entirely client-side using JavaScript in your browser tab. No certificate data or domain names are ever transmitted to any server.",
      },
      {
        question: "What does SAN mean in an SSL certificate?",
        answer:
          "Subject Alternative Name (SAN) is an X.509 extension that allows a single SSL certificate to secure multiple domain names, subdomains (like *.example.com), and IP addresses.",
      },
    ],
    relatedToolSlugs: ["subnet-calculator", "http-header-viewer", "jwt-decoder"],
    nextSteps: ["subnet-calculator", "http-header-viewer"],
  },

  "sql-formatter": {
    slug: "sql-formatter",
    name: "SQL Formatter",
    shortName: "SQL Formatter",
    tagline: "Format, beautify, and minify SQL queries for Postgres, MySQL, and SQLite.",
    category: "developer",
    description: "Beautify, indent, format, and minify SQL queries with customizable casing and spacing.",
    longDescription:
      "A fast client-side SQL formatter and beautifier. Indent complex nested queries, format joins and subqueries, uppercase SQL keywords, and minify queries for production database migrations without uploading query payloads.",
    iconName: "Code2",
    privacy: "local",
    metaTitle: "SQL Formatter & Query Beautifier",
    metaDescription:
      "Beautify, format, uppercase keywords, and minify SQL statements for PostgreSQL, MySQL, and SQLite. 100% client-side query tool.",
    keywords: [
      "sql formatter",
      "sql beautifier",
      "format sql online",
      "sql prettifier",
      "sql query formatter",
      "postgres sql formatter",
      "mysql query formatter",
      "minify sql",
    ],
    aliases: ["sql format", "sql prettify", "beautify sql", "clean sql", "format sql query"],
    features: [
      "Compatible with PostgreSQL, MySQL, SQLite, Oracle, and ANSI SQL syntax",
      "Keyword casing control: UPPERCASE, lowercase, or preserve original",
      "Indentation customization: 2 spaces, 4 spaces, or tabs",
      "Minification mode to strip comments and collapse redundant whitespace",
      "Download formatted .sql files or copy to clipboard",
    ],
    faqs: [
      {
        question: "Why should SQL keywords be in uppercase?",
        answer:
          "Capitalizing keywords like SELECT, FROM, and WHERE makes SQL code much easier to distinguish from table and column identifiers, improving readability in code reviews and debugging sessions.",
      },
      {
        question: "Does this tool work offline?",
        answer:
          "Yes. The query formatting logic runs entirely within your browser tab, ensuring sensitive database table names and queries never leave your machine.",
      },
    ],
    relatedToolSlugs: ["json-to-yaml", "docker-to-compose", "json-formatter"],
    nextSteps: ["json-to-yaml", "json-formatter"],
  },

  "json-to-yaml": {
    slug: "json-to-yaml",
    name: "JSON to YAML Converter",
    shortName: "JSON to YAML",
    tagline: "Convert bidirectional JSON to YAML and YAML to JSON with presets.",
    category: "developer",
    description: "Convert JSON to YAML and YAML to JSON with syntax validation, custom indentation, and config presets.",
    longDescription:
      "A bidirectional JSON ↔ YAML converter with instant split editing. Convert Kubernetes manifests, Docker Compose configurations, and GitHub Actions files between JSON and YAML effortlessly and safely in your browser.",
    iconName: "FileCode",
    privacy: "local",
    metaTitle: "JSON to YAML & YAML to JSON Converter",
    metaDescription:
      "Convert JSON to YAML and YAML to JSON instantly in your browser. Supports Docker Compose, Kubernetes manifests, and custom indentation.",
    keywords: [
      "json to yaml",
      "yaml to json",
      "json yaml converter",
      "convert yaml to json online",
      "kubernetes yaml converter",
      "docker compose yaml converter",
      "yaml parser",
    ],
    aliases: ["json yaml", "yaml json", "convert json to yaml", "convert yaml to json"],
    features: [
      "Bidirectional conversion: JSON to YAML and YAML to JSON",
      "Indentation settings for 2-space or 4-space workflows",
      "One-click swap direction with output persistence",
      "Preloaded presets for Docker Compose, Kubernetes, and GitHub Actions",
      "Export directly to .yaml or .json files",
    ],
    faqs: [
      {
        question: "What is the difference between JSON and YAML?",
        answer:
          "JSON is a strict data interchange format based on curly braces and brackets. YAML is a human-readable superset that uses whitespace indentation, supports comments, and omits bulky punctuation.",
      },
      {
        question: "Can all JSON files be converted to YAML?",
        answer:
          "Yes. All valid JSON is structurally valid YAML. YAML allows cleaner configuration without quotation marks or closing tags.",
      },
    ],
    relatedToolSlugs: ["json-formatter", "sql-formatter", "docker-to-compose"],
    nextSteps: ["json-formatter", "sql-formatter"],
  },

  "chmod-calculator": {
    slug: "chmod-calculator",
    name: "Chmod Permissions Calculator",
    shortName: "Chmod Calc",
    tagline: "Interactive 3x3 Linux permissions matrix, octal sync, and command generator.",
    category: "developer",
    description: "Calculate Linux and Unix file permissions with an interactive 3x3 matrix, octal, and symbolic codes.",
    longDescription:
      "An interactive Unix/Linux file permissions calculator. Toggle Read, Write, and Execute checkboxes for Owner, Group, and Others, set SUID, SGID, and Sticky bits, and generate ready-to-run chmod commands.",
    iconName: "Terminal",
    privacy: "local",
    metaTitle: "Chmod Calculator: Linux Permissions",
    metaDescription:
      "Calculate Linux file permissions with an interactive 3x3 matrix. Convert between octal, symbolic, and chmod commands in your browser.",
    keywords: [
      "chmod calculator",
      "linux permissions calculator",
      "chmod 755",
      "chmod 644",
      "unix permissions",
      "octal to symbolic chmod",
      "suid sgid sticky bit",
      "chmod command generator",
    ],
    aliases: ["chmod", "permissions calculator", "chmod calc", "linux permissions", "file permissions"],
    features: [
      "Interactive 3x3 matrix for Owner, Group, and Public permissions",
      "Special attributes: SUID (4000), SGID (2000), and Sticky Bit (1000)",
      "Instant synchronization between Octal, Symbolic (-rwxr-xr-x), and Checkboxes",
      "Recursive and separate directory (755) and file (644) fix commands",
      "Quick presets for SSH keys (600), web servers, and scripts",
    ],
    faqs: [
      {
        question: "What does chmod 755 mean?",
        answer:
          "Chmod 755 gives the Owner full Read, Write, and Execute permissions (7), while Group and Others can only Read and Execute (5). It is the standard permission for directories and executable scripts.",
      },
      {
        question: "What is the Sticky Bit used for?",
        answer:
          "The Sticky bit (octal 1000, symbolic 't') is used on shared directories like /tmp. It allows multiple users to write files, but only the file owner or root can delete or rename them.",
      },
    ],
    relatedToolSlugs: ["docker-to-compose", "sql-formatter", "json-to-yaml"],
    nextSteps: ["docker-to-compose", "sql-formatter"],
  },

  "docker-to-compose": {
    slug: "docker-to-compose",
    name: "Docker Run to Compose",
    shortName: "Docker Compose",
    tagline: "Convert docker run CLI commands into docker-compose.yml files.",
    category: "developer",
    description: "Convert docker run terminal commands into clean, readable docker-compose.yml files.",
    longDescription:
      "Transform long CLI 'docker run' commands into structured docker-compose.yml definitions. Parses port mappings, volume mounts, environment variables, restart policies, networks, and resource limits instantly in your browser.",
    iconName: "Container",
    privacy: "local",
    metaTitle: "Docker Run to Compose Converter",
    metaDescription:
      "Convert docker run commands into clean docker-compose.yml files with ports, environment variables, volumes, and limits. Free and offline.",
    keywords: [
      "docker run to compose",
      "docker compose converter",
      "docker to compose online",
      "convert docker run to docker-compose",
      "docker compose generator",
      "docker compose v3",
    ],
    aliases: ["docker run to compose", "docker compose generator", "docker run converter", "compose generator"],
    features: [
      "Parses ports (-p), volumes (-v), env (-e, --env-file), and restart policies",
      "Handles memory limits, CPU allocations, privileged mode, and working directories",
      "Automatically declares named external networks and volumes",
      "Preloaded templates for Nginx, PostgreSQL, Redis, and Node.js",
      "Download valid docker-compose.yml with one click",
    ],
    faqs: [
      {
        question: "Why should I convert docker run into Docker Compose?",
        answer:
          "Docker Compose files are version-controlled, declarative, and repeatable. Instead of remembering complex 10-line CLI commands, you can manage multi-container setups with a single 'docker compose up -d'.",
      },
      {
        question: "Does this handle named volumes and bind mounts?",
        answer:
          "Yes. It automatically differentiates between local bind mounts (e.g., ./data:/data) and named volumes, declaring named volumes at the bottom of the Compose file.",
      },
    ],
    relatedToolSlugs: ["chmod-calculator", "json-to-yaml", "sql-formatter"],
    nextSteps: ["chmod-calculator", "json-to-yaml"],
  },

  "box-shadow-gen": {
    slug: "box-shadow-gen",
    name: "CSS Box Shadow Generator",
    shortName: "Box Shadow",
    tagline: "Multi-layer CSS box shadows with live preview and Tailwind export.",
    category: "developer",
    description: "Generate multi-layer CSS box shadows with interactive preview, dark mode canvas, and Tailwind classes.",
    longDescription:
      "Create smooth, realistic multi-layer CSS box shadows. Stack up to 5 individual shadow layers with independent X, Y, blur, spread, color, and inset controls. Export clean CSS, Tailwind CSS arbitrary classes, and React style objects.",
    iconName: "Layers",
    privacy: "local",
    metaTitle: "CSS Box Shadow Generator & Tailwind",
    metaDescription:
      "Design multi-layer CSS box shadows with live interactive preview, smooth elevation presets, and Tailwind arbitrary class export.",
    keywords: [
      "box shadow generator",
      "css box shadow",
      "multi layer shadow",
      "tailwind box shadow generator",
      "smooth elevation css",
      "neon shadow generator",
      "inset shadow generator",
    ],
    aliases: ["box shadow", "css shadow", "shadow generator", "elevation", "tailwind shadow"],
    features: [
      "Stack up to 5 multi-layer shadows for ultra-smooth elevation",
      "Interactive preview card with light/dark background and border-radius controls",
      "Export pure CSS, Tailwind arbitrary classes (shadow-[...]), and React style objects",
      "Curated elevation presets: subtle card, floating elevation, neon glow, and neumorphism",
      "Layer toggling, reordering, and independent color opacity sliders",
    ],
    faqs: [
      {
        question: "Why use multi-layer box shadows instead of a single shadow?",
        answer:
          "Real-world light bounces in multiple ways. Stacking two or three subtle shadows with different blurs and spreads produces a much smoother, higher-end elevation effect that avoids harsh, unnatural edges.",
      },
      {
        question: "Can I use the output in Tailwind CSS?",
        answer:
          "Yes. The generator produces exact Tailwind CSS arbitrary values like shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] ready to paste directly into your JSX or HTML.",
      },
    ],
    relatedToolSlugs: ["glassmorphism-gen", "px-to-rem", "color-palette-gen"],
    nextSteps: ["glassmorphism-gen", "color-palette-gen"],
  },

  "glassmorphism-gen": {
    slug: "glassmorphism-gen",
    name: "Glassmorphism Generator",
    shortName: "Glassmorphism",
    tagline: "Create modern CSS frosted glass effects with backdrop blur and border glow.",
    category: "developer",
    description: "Design frosted glass UI cards with CSS backdrop-filter blur, border highlights, and scene previews.",
    longDescription:
      "A modern CSS glassmorphism generator. Adjust background blur, saturation boost, opacity, and border reflection highlights. Preview your frosted glass cards over vibrant gradient meshes, geometric shapes, and neon scenes.",
    iconName: "Sparkles",
    privacy: "local",
    metaTitle: "Glassmorphism CSS Effect Generator",
    metaDescription:
      "Generate frosted glass UI styles with CSS backdrop-filter blur, border highlights, and opacity. Live preview with Tailwind classes.",
    keywords: [
      "glassmorphism generator",
      "frosted glass css",
      "css backdrop-filter blur",
      "glass card generator",
      "tailwind glassmorphism",
      "glass ui design",
    ],
    aliases: ["glassmorphism", "frosted glass", "glass ui", "backdrop blur", "glass effect"],
    features: [
      "Real-time backdrop-filter blur and saturation boost sliders",
      "Border reflection highlight width, color, and opacity controls",
      "Multi-scene canvas preview (Gradient mesh, geometric shapes, neon glow)",
      "Ready-to-copy CSS rules and Tailwind CSS utility combinations",
      "Modern UI presets: frosted card, cyberpunk HUD, and deep obsidian glass",
    ],
    faqs: [
      {
        question: "Which browsers support CSS backdrop-filter?",
        answer:
          "All modern browsers (Chrome, Edge, Safari, Firefox) support backdrop-filter. It is best practice to include -webkit-backdrop-filter for optimal iOS Safari compatibility, which is included in our generator output.",
      },
      {
        question: "What makes frosted glass look realistic?",
        answer:
          "The combination of backdrop-filter blur, a semi-transparent background (10-25% opacity), and a delicate 1px light border highlight that mimics the physical refraction edge of real glass.",
      },
    ],
    relatedToolSlugs: ["box-shadow-gen", "color-palette-gen", "px-to-rem"],
    nextSteps: ["box-shadow-gen", "color-palette-gen"],
  },

  "px-to-rem": {
    slug: "px-to-rem",
    name: "PX to REM Converter",
    shortName: "PX to REM",
    tagline: "Convert PX to REM and calculate responsive fluid clamp() typography.",
    category: "developer",
    description: "Convert pixels to rem and em units, and calculate fluid typography CSS clamp() formulas.",
    longDescription:
      "Convert pixels (px) to relative units (rem, em, %, pt) with adjustable root font sizes. Includes a fluid typography calculator that computes exact CSS clamp() formulas with an interactive live viewport resizer simulator.",
    iconName: "Type",
    privacy: "local",
    metaTitle: "PX to REM Converter & CSS Clamp",
    metaDescription:
      "Convert pixels to rem and em with custom root font sizes. Calculate fluid responsive typography with CSS clamp() and live preview.",
    keywords: [
      "px to rem",
      "rem to px converter",
      "css clamp generator",
      "fluid typography calculator",
      "pixels to em",
      "tailwind font sizes",
      "root font size converter",
    ],
    aliases: ["px to rem", "rem to px", "clamp generator", "fluid typography", "pixels to rem"],
    features: [
      "Real-time bidirectional conversion between px, rem, em, %, and points (pt)",
      "Configurable root base font size (16px, 14px, 12px, 10px)",
      "Fluid typography CSS clamp() formula generator based on min/max viewports",
      "Interactive live viewport slider simulator to test scaling in real time",
      "Tailwind CSS text scale cheat sheet reference table",
    ],
    faqs: [
      {
        question: "Why should web developers use REM instead of PX?",
        answer:
          "REM units scale relative to the root font size set by the user's browser. Using REM ensures your site respects accessibility settings for visually impaired users who increase default font sizes.",
      },
      {
        question: "How does the CSS clamp() formula work?",
        answer:
          "The clamp(min, val, max) function sets a value between an allowable minimum and maximum. In fluid typography, 'val' uses a linear slope equation with viewport units (vw) to scale smoothly as the browser window resizes.",
      },
    ],
    relatedToolSlugs: ["box-shadow-gen", "svg-to-data-uri", "color-palette-gen"],
    nextSteps: ["box-shadow-gen", "color-palette-gen"],
  },

  "svg-to-data-uri": {
    slug: "svg-to-data-uri",
    name: "SVG to Data URI Converter",
    shortName: "SVG Data URI",
    tagline: "Clean and encode SVG markup into UTF-8 and Base64 Data URIs.",
    category: "developer",
    description: "Convert SVG code into optimized UTF-8 and Base64 Data URIs for CSS background-image and HTML img tags.",
    longDescription:
      "An offline SVG optimizer and Data URI encoder. Clean unneeded XML headers, strip comments, and encode SVG markup into compact UTF-8 Data URIs (much smaller than Base64) or standard Base64 URIs with live canvas preview.",
    iconName: "FileCode",
    privacy: "local",
    metaTitle: "SVG to Data URI Converter Online",
    metaDescription:
      "Encode raw SVG markup into UTF-8 and Base64 Data URIs for CSS background-image and HTML img tags. Clean, optimize, and preview SVG.",
    keywords: [
      "svg to data uri",
      "svg to base64",
      "svg data uri generator",
      "svg background image css",
      "encode svg online",
      "inline svg css",
      "svg uri converter",
    ],
    aliases: ["svg to data uri", "svg data uri", "svg base64", "svg to css", "encode svg"],
    features: [
      "Automated SVG cleanup: removes XML declarations, doctypes, and HTML comments",
      "UTF-8 encoded Data URIs that are ~25% smaller than standard Base64 encoding",
      "Base64 Data URI generation for legacy fallback compatibility",
      "Direct code output for CSS background-image and HTML img tags",
      "Interactive render preview with dark mode toggle and file drag-and-drop",
    ],
    faqs: [
      {
        question: "Why use UTF-8 Data URIs instead of Base64 for SVG?",
        answer:
          "Base64 adds roughly 33% bloat to ASCII text files. Because SVGs are plain XML text, UTF-8 percent-encoding only escapes necessary characters (like '#' and '\"'), producing significantly smaller payloads that gzip better.",
      },
      {
        question: "Can I use SVG Data URIs directly in CSS?",
        answer:
          "Yes. Paste the generated CSS snippet directly into your stylesheet: background-image: url('data:image/svg+xml,...'); to render icons without extra HTTP requests.",
      },
    ],
    relatedToolSlugs: ["box-shadow-gen", "color-palette-gen", "px-to-rem"],
    nextSteps: ["box-shadow-gen", "color-palette-gen"],
  },

  "color-palette-gen": {
    slug: "color-palette-gen",
    name: "Color Palette Generator",
    shortName: "Palette Gen",
    tagline: "Generate 11-step Tailwind color shades with WCAG accessibility contrast.",
    category: "developer",
    description: "Generate 11-step Tailwind color shade scales (50 to 950) with WCAG contrast badges and color harmonies.",
    longDescription:
      "A complete design token and color shade generator. Input any brand hex color to calculate an 11-step Tailwind CSS shade scale (50, 100, 200... 950) with real-time WCAG accessibility contrast ratios and color harmonies.",
    iconName: "Palette",
    privacy: "local",
    metaTitle: "Color Palette & Tailwind Shades",
    metaDescription:
      "Generate 11-step Tailwind shade palettes (50 to 950) with WCAG contrast badges and harmonious color schemes. Export CSS and Tailwind.",
    keywords: [
      "color palette generator",
      "tailwind shades generator",
      "tailwind color generator",
      "wcag contrast checker",
      "color scale generator",
      "hex to tailwind shades",
      "color harmonies",
    ],
    aliases: ["palette generator", "color shades", "tailwind shades", "color palette", "tailwind colors"],
    features: [
      "Generates complete 11-step Tailwind shade scale (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)",
      "Live WCAG contrast scores against white and black for every shade step",
      "Harmonious color schemes: Complementary, Analogous, and Triadic",
      "Export to tailwind.config.js and CSS Custom Properties variables",
      "Random color generator and interactive color picker",
    ],
    faqs: [
      {
        question: "What is the standard WCAG contrast ratio for text?",
        answer:
          "WCAG 2.1 Level AA requires a contrast ratio of at least 4.5:1 for normal body text and 3:1 for large text (18pt or 14pt bold). Level AAA requires 7:1 for normal text.",
      },
      {
        question: "How do I add these shades to Tailwind CSS?",
        answer:
          "Copy the generated Tailwind Config snippet into your tailwind.config.js under theme.extend.colors to access classes like bg-brand-500, text-brand-700, etc.",
      },
    ],
    relatedToolSlugs: ["box-shadow-gen", "glassmorphism-gen", "px-to-rem"],
    nextSteps: ["box-shadow-gen", "glassmorphism-gen"],
  },

  "llm-token-counter": {
    slug: "llm-token-counter",
    name: "LLM Token Counter",
    shortName: "Token Counter",
    tagline: "Estimate BPE tokens, context limits, and API costs for GPT-4o, Claude, and Gemini.",
    category: "ai-tools",
    description: "Calculate LLM tokens, context capacity, and estimated prompt API costs across OpenAI, Anthropic, and Google models.",
    longDescription:
      "An offline LLM token counter and API pricing calculator. Accurately estimate BPE tokens, word counts, and character lengths for GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and Llama 3 with real-time prompt and completion cost estimates.",
    iconName: "Cpu",
    privacy: "local",
    metaTitle: "LLM Token Counter & API Cost Calc",
    metaDescription:
      "Count LLM tokens and estimate API prompt and completion costs for GPT-4o, Claude 3.5, Gemini 1.5, and Llama 3. Runs 100% in your browser.",
    keywords: [
      "llm token counter",
      "token counter online",
      "gpt 4o token counter",
      "claude token counter",
      "gemini token counter",
      "openai pricing calculator",
      "prompt cost calculator",
      "bpe tokenizer online",
    ],
    aliases: ["token counter", "llm tokens", "count tokens", "openai tokens", "prompt cost"],
    features: [
      "Accurate BPE token approximation for GPT-4o, Claude 3.5, Gemini 1.5, and Llama 3",
      "Detailed metrics: tokens, words, characters with/without spaces, and tokens per word",
      "Real-time API prompt (input) and completion (output) cost estimation",
      "Visual context window capacity meter (128k, 200k, 1M, 2M limits)",
      "Multi-model price and token comparison matrix",
    ],
    faqs: [
      {
        question: "What is an LLM token?",
        answer:
          "Tokens are the basic units of text processed by language models. In English text, 1 token is roughly equivalent to 4 characters or about 0.75 words. Complex code or non-English scripts often require more tokens per word.",
      },
      {
        question: "Are my prompt texts uploaded anywhere?",
        answer:
          "No. All token estimation and cost calculation happens locally in your browser's JavaScript engine. Your private system prompts and proprietary documents are never transmitted to any server.",
      },
    ],
    relatedToolSlugs: ["ai-prompt-opt", "json-schema-for-ai", "clean-prompt-strip"],
    nextSteps: ["ai-prompt-opt", "json-schema-for-ai"],
  },

  "ai-prompt-opt": {
    slug: "ai-prompt-opt",
    name: "AI Prompt Optimizer",
    shortName: "Prompt Optimizer",
    tagline: "Build structured XML system prompts with role isolation and negative rules.",
    category: "ai-tools",
    description: "Build structured XML system prompts with role isolation, negative constraints, and few-shot examples.",
    longDescription:
      "A structured prompt engineering tool for AI builders. Compose system prompts using industry-standard XML boundary tags (<role>, <objective>, <rules>, <thinking_process>, <examples>) to drastically improve LLM output accuracy.",
    iconName: "Sparkles",
    privacy: "local",
    metaTitle: "AI Prompt Optimizer & XML Builder",
    metaDescription:
      "Construct structured XML prompts with role definition, objective, negative constraints, and few-shot examples for ChatGPT and Claude.",
    keywords: [
      "ai prompt optimizer",
      "xml prompt generator",
      "claude system prompt builder",
      "prompt engineering tool",
      "structured prompt generator",
      "few shot prompt builder",
      "chatgpt system prompt",
    ],
    aliases: ["prompt optimizer", "prompt builder", "xml prompts", "system prompt", "ai prompt"],
    features: [
      "Separates role, context, objective, strict negative rules, and CoT thinking into XML tags",
      "Preloaded agent templates: Senior Code Reviewer, Data Extraction, and Docs Writer",
      "Dynamic {{USER_INPUT}} runtime placeholder variable integration",
      "Prevents prompt injection by isolating instruction hierarchies",
      "Instant copy for ChatGPT Custom GPTs, Claude Projects, and Cursor",
    ],
    faqs: [
      {
        question: "Why use XML tags in AI prompts?",
        answer:
          "Modern LLMs (especially Anthropic Claude and OpenAI models) are heavily fine-tuned to recognize XML tags like <role> and <rules>. Tagging creates clear boundaries that prevent context contamination and improve adherence to negative instructions.",
      },
      {
        question: "What is a negative constraint in prompt engineering?",
        answer:
          "A negative constraint explicitly tells the AI what NOT to do (e.g. 'Do NOT include conversational preamble'). Stating negative rules clearly prevents hallucinations and unwanted verbosity.",
      },
    ],
    relatedToolSlugs: ["llm-token-counter", "json-schema-for-ai", "clean-prompt-strip"],
    nextSteps: ["llm-token-counter", "json-schema-for-ai"],
  },

  "json-schema-for-ai": {
    slug: "json-schema-for-ai",
    name: "AI Function Calling Schema",
    shortName: "AI Tool Schema",
    tagline: "Build OpenAI Structured Output and Anthropic Tool Call JSON schemas.",
    category: "ai-tools",
    description: "Generate strict JSON schemas for OpenAI Function Calling, Structured Outputs, and Anthropic Claude Tools.",
    longDescription:
      "A dedicated AI Function Calling and Tool Definition builder. Define tool names, descriptions, and typed parameters. Generate strict OpenAI Structured Outputs (additionalProperties: false) and Anthropic Claude Tool schemas with TypeScript interfaces.",
    iconName: "Bot",
    privacy: "local",
    metaTitle: "AI Function Calling Schema Builder",
    metaDescription:
      "Build OpenAI function calling and Anthropic Claude tool definition schemas with strict validation and TypeScript export in your browser.",
    keywords: [
      "ai function calling schema",
      "openai structured outputs",
      "json schema for ai",
      "anthropic tool schema",
      "function calling generator",
      "ai tool definition",
      "openai tools generator",
    ],
    aliases: ["function calling", "ai tool schema", "structured outputs", "tool definition", "openai schema"],
    features: [
      "Interactive parameter builder with type validation, descriptions, and enum support",
      "OpenAI Strict Mode toggle enforcing additionalProperties: false and required lists",
      "Dual export: OpenAI tools format and Anthropic Claude input_schema format",
      "Auto-generates clean TypeScript interface definitions",
      "Preloaded templates for weather lookup, database queries, and email alerts",
    ],
    faqs: [
      {
        question: "What are OpenAI Structured Outputs?",
        answer:
          "Structured Outputs ensure the model's generated response strictly matches your supplied JSON Schema 100% of the time. It requires 'strict: true', 'additionalProperties: false', and all properties listed in 'required'.",
      },
      {
        question: "How do Anthropic Claude Tool definitions differ from OpenAI?",
        answer:
          "Anthropic uses an 'input_schema' object at the top level of each tool, whereas OpenAI wraps function definitions inside a 'function' property within a 'type: \"function\"' array object.",
      },
    ],
    relatedToolSlugs: ["llm-token-counter", "ai-prompt-opt", "clean-prompt-strip"],
    nextSteps: ["llm-token-counter", "ai-prompt-opt"],
  },

  "clean-prompt-strip": {
    slug: "clean-prompt-strip",
    name: "Prompt & Context Cleaner",
    shortName: "Prompt Cleaner",
    tagline: "Strip markdown, HTML, comments, and mask PII to reduce token consumption.",
    category: "ai-tools",
    description: "Sanitize prompts, mask PII (emails, cards, IPs), strip HTML and comments, and optimize context sizes.",
    longDescription:
      "Prepare documents, web scrapes, and codebases for LLM prompts and vector database RAG retrieval. Strip unneeded HTML tags, markdown syntax, and code comments, while masking sensitive PII (emails, phone numbers, IPs, AWS keys) entirely in your browser.",
    iconName: "Eraser",
    privacy: "local",
    metaTitle: "Prompt Cleaner & PII Redactor",
    metaDescription:
      "Sanitize prompt text, redact PII, strip HTML and comments, and save token costs before sending context to LLMs. Zero server upload.",
    keywords: [
      "prompt cleaner",
      "pii redactor for llm",
      "strip markdown",
      "strip html for rag",
      "prompt optimizer tokens",
      "clean context for ai",
      "mask sensitive data prompt",
    ],
    aliases: ["prompt cleaner", "pii redactor", "strip markdown", "clean prompt", "rag context cleaner"],
    features: [
      "Redact PII: emails, phone numbers, IPv4 addresses, credit cards, and AWS access keys",
      "Strip HTML/XML markup and unwanted web scraper noise",
      "Remove code comments (//, /* */, <!-- -->, #) to save context tokens",
      "Collapse excessive empty lines and redundant whitespace",
      "Displays estimated tokens saved and reduction percentage in real time",
    ],
    faqs: [
      {
        question: "Why should I clean context before sending it to an LLM?",
        answer:
          "Uncleaned web pages and code files contain comments, markup, and blank lines that waste context window capacity and drive up API token costs. Cleaning also protects sensitive PII and API keys from leaking into LLM logs.",
      },
      {
        question: "Does this tool work completely offline?",
        answer:
          "Yes. All sanitization, regex replacements, and PII redactions happen locally in your browser. No sensitive documents or logs are ever transmitted across the network.",
      },
    ],
    relatedToolSlugs: ["llm-token-counter", "ai-prompt-opt", "json-schema-for-ai"],
    nextSteps: ["llm-token-counter", "ai-prompt-opt"],
  },

  "tip-calculator": {
    slug: "tip-calculator",
    name: "Tip & Bill Split Calculator",
    shortName: "Tip Calculator",
    tagline: "Calculate tips, split group bills, round per person, and copy SMS summary.",
    category: "calculators",
    description: "Calculate restaurant tips, split bills among friends, round per person, and copy a shareable message.",
    longDescription:
      "A fast, everyday tip and bill split calculator. Work out tips with standard percentage chips or custom rates, divide totals across groups, apply round-up rules, and generate a formatted WhatsApp or SMS summary message with one click.",
    iconName: "DollarSign",
    privacy: "local",
    metaTitle: "Tip Calculator: Bill Split & SMS",
    metaDescription:
      "Calculate tips, split expenses evenly among friends, round per person, and generate a shareable WhatsApp or SMS summary in seconds.",
    keywords: [
      "tip calculator",
      "bill split calculator",
      "restaurant tip calculator",
      "split bill with friends",
      "group bill calculator",
      "tip and split",
      "round up tip",
    ],
    aliases: ["tip calculator", "split bill", "tip calc", "restaurant bill", "bill split"],
    features: [
      "Instant tip percentages (10%, 15%, 18%, 20%, 25%) and custom rates",
      "Divide bill and tip evenly across any number of people",
      "Rounding options: exact cent, round total up, or round per person up",
      "Customizable currency symbols and locale formatting",
      "One-click copy formatted WhatsApp and SMS group summary",
    ],
    faqs: [
      {
        question: "How is the tip calculated when rounding per person?",
        answer:
          "When rounding per person up, the individual share is rounded to the nearest whole currency unit (e.g. $28.40 -> $29.00), and the tip is adjusted accordingly so the group covers the exact required amount plus generous rounding.",
      },
      {
        question: "What is standard tipping etiquette?",
        answer:
          "In North America, standard restaurant tipping is generally 15% to 20% for good service. In many European and Asian countries, service is included, with small round-ups or 5-10% left for exceptional service.",
      },
    ],
    relatedToolSlugs: ["fuel-cost-calc", "percentage-calculator", "discount-calculator"],
    nextSteps: ["fuel-cost-calc", "percentage-calculator"],
  },

  "fuel-cost-calc": {
    slug: "fuel-cost-calc",
    name: "Fuel Cost Calculator",
    shortName: "Fuel Calculator",
    tagline: "Calculate road trip gas costs, fuel consumed, and passenger splits.",
    category: "calculators",
    description: "Calculate gas and fuel costs for road trips and daily commutes in Metric or Imperial units.",
    longDescription:
      "A comprehensive road trip fuel cost calculator. Calculate total gasoline or diesel consumed, total trip cost, and cost per passenger in Metric (km, L/100km, $/L) or Imperial (miles, MPG, $/gal) with vehicle presets.",
    iconName: "Fuel",
    privacy: "local",
    metaTitle: "Fuel Cost & Mileage Calculator",
    metaDescription:
      "Calculate road trip gas costs, fuel consumption, and passenger splits in Metric (L/100km) or Imperial (MPG). Includes vehicle presets.",
    keywords: [
      "fuel cost calculator",
      "gas cost calculator",
      "road trip fuel cost",
      "mileage calculator",
      "petrol cost calculator",
      "split gas with friends",
      "l per 100km fuel cost",
      "mpg fuel cost",
    ],
    aliases: ["fuel calculator", "gas calculator", "fuel cost", "trip cost", "mileage cost"],
    features: [
      "Dual unit systems: Metric (km, L/100km, cost per liter) and Imperial (miles, MPG, cost per gallon)",
      "Round trip toggle to automatically calculate return journeys",
      "Split fuel expenses evenly among road trip passengers",
      "Preloaded vehicle efficiency presets (Hybrid, Sedan, SUV, Truck, Motorcycle)",
      "Cost per kilometer or mile metric for travel expense reimbursement",
    ],
    faqs: [
      {
        question: "How do I calculate fuel cost for a road trip?",
        answer:
          "For Metric: (Distance in km / 100) × Fuel Efficiency in L/100km × Price per Liter. For Imperial: (Distance in miles / MPG) × Price per Gallon.",
      },
      {
        question: "How does passenger splitting work?",
        answer:
          "The total fuel expense is divided evenly among all specified passengers, giving each traveler's exact fair share for carpools or vacation road trips.",
      },
    ],
    relatedToolSlugs: ["tip-calculator", "percentage-calculator", "work-hours-calc"],
    nextSteps: ["tip-calculator", "work-hours-calc"],
  },

  "work-hours-calc": {
    slug: "work-hours-calc",
    name: "Work Hours Calculator",
    shortName: "Work Hours",
    tagline: "Calculate shift hours, weekly timesheets, unpaid breaks, and overtime pay.",
    category: "date-time",
    description: "Calculate work hours, weekly payroll timesheets, unpaid break deductions, and overtime pay.",
    longDescription:
      "A complete employee shift and weekly timesheet calculator. Calculate shift duration, deduct unpaid breaks, compute decimal hours for payroll software, calculate overtime pay, and handle overnight cross-midnight shifts effortlessly.",
    iconName: "Clock",
    privacy: "local",
    metaTitle: "Work Hours & Timesheet Calculator",
    metaDescription:
      "Calculate work hours, weekly timesheets, unpaid break deductions, decimal payroll hours, and overtime pay. Export timesheet CSV.",
    keywords: [
      "work hours calculator",
      "timesheet calculator",
      "calculate hours worked",
      "decimal hours calculator",
      "overtime calculator",
      "payroll hours calculator",
      "time card calculator",
    ],
    aliases: ["work hours", "timesheet", "hours worked", "timecard", "payroll calculator"],
    features: [
      "Dual mode: Single Shift quick calculator and 7-day Weekly Timesheet",
      "Accurate overnight shift calculation across midnight boundaries",
      "Unpaid break deductions (30m, 45m, 60m) net of total hours",
      "Decimal hours conversion (e.g. 8h 30m = 8.50 hrs) for payroll entry",
      "Overtime pay calculation with customizable weekly threshold and 1.5x overtime rate",
      "One-click 'Fill 9-to-5' weekday schedule button and CSV timesheet export",
    ],
    faqs: [
      {
        question: "What are decimal hours in payroll?",
        answer:
          "Decimal hours express minutes as fractions of an hour for accounting software. For example, 8 hours and 15 minutes is 8.25 hours, 8 hours and 30 minutes is 8.50 hours, and 8 hours and 45 minutes is 8.75 hours.",
      },
      {
        question: "How do overnight shifts calculate?",
        answer:
          "If the end time is earlier than the start time (e.g., 10:00 PM to 6:00 AM), the calculator automatically recognizes that the shift crosses midnight into the next day and calculates the correct 8-hour duration.",
      },
    ],
    relatedToolSlugs: ["date-difference-calculator", "time-converter", "working-days-calculator"],
    nextSteps: ["date-difference-calculator", "time-converter"],
  },
};
