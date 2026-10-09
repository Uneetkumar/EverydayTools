import type { ToolContent } from "../content";

/**
 * Write-ups for the October 2026 batch. Every claim here was checked against
 * the component it describes: what the tool does, what it does not do, and
 * the worked examples (recompute them if a formula changes).
 */
export const NEW_OFFLINE_CONTENT: Record<string, ToolContent> = {
  "subnet-calculator": {
    intro:
      "Give this calculator an IPv4 address and a prefix length and it shows the subnet the address belongs to: the network and broadcast addresses, the first and last address you can assign to a device, the subnet mask and its wildcard (inverse) mask, how many hosts fit, and a bit-by-bit view of where the network part ends. Switch to IPv6 and it does the same for 128-bit prefixes, including how many /64 networks fit inside a /48 or /56. You can paste an address with its prefix attached, such as 10.20.30.40/22, and it is split into the two fields for you.",
    howTo: {
      title: "How to calculate a subnet",
      steps: [
        "Choose IPv4 or IPv6 at the top.",
        "Type or paste an address. If you paste it with a prefix (192.168.10.77/26), the prefix field updates too.",
        "Pick the prefix length. Each option in the list shows its dotted subnet mask, so you can also choose by mask.",
        "Read the network address, usable host range, broadcast address, wildcard mask and host count. Every value has its own copy button.",
        "Use the binary breakdown to see which bits are network and which are host, or press Apply in the reference table to try another common size.",
      ],
    },
    useCases: [
      {
        title: "Splitting an office network",
        body:
          "A /24 gives 254 usable addresses. Splitting it into four /26 subnets, say staff, guests, printers and cameras, gives four ranges of 62 hosts: .1–.62, .65–.126, .129–.190 and .193–.254. Entering any address shows the boundaries of its range, which is the quickest way to check that a device's static IP really sits inside the subnet you meant.",
      },
      {
        title: "Planning cloud VPC ranges",
        body:
          "AWS, Azure and Google Cloud ask for CIDR blocks when you create a VPC and its subnets, and ranges that overlap cannot be peered or joined by VPN later. Working the blocks out first, for example 10.0.0.0/16 for the VPC with /20 or /24 subnets inside it, avoids that. Cloud providers also reserve a few addresses in every subnet (AWS and Azure reserve five), so their usable count is lower than the standard figure shown here.",
      },
      {
        title: "Firewall rules and ACLs",
        body:
          "Cisco access lists and OSPF network statements take a wildcard mask, the inverse of the subnet mask: 0.0.0.63 for a /26, 0.0.15.255 for a /20. The calculator shows the wildcard next to the mask, so there is no need to subtract each octet from 255 by hand and risk an ACL that matches too much.",
      },
    ],
    tips: [
      "For prefixes up to /30, usable hosts = 2^(32 − prefix) − 2: the first address names the network and the last is the broadcast address.",
      "A /31 is shown with 2 usable addresses and a /32 with 1. Point-to-point /31 links (RFC 3021) have no network or broadcast address, and a /32 is a single host.",
      "The scope label recognises the RFC 1918 private ranges (10/8, 172.16/12, 192.168/16), loopback (127/8) and link-local (169.254/16). Other special ranges, such as 100.64.0.0/10 used for carrier-grade NAT, are labelled public.",
      "The reverse DNS value is the PTR name of the exact address you entered (its octets reversed under in-addr.arpa), not the zone for the whole subnet.",
      "The IP class (A, B, C) is shown for reference only. Routing has been classless since 1993, so the prefix length, not the class, decides how big a network is.",
    ],
    extraFaqs: [
      {
        question: "How do I find the network address by hand?",
        answer:
          "Use the block size. For a /26 the mask's last octet is 192, so blocks are 256 − 192 = 64 addresses long and start at multiples of 64. The address 192.168.10.77 falls in the block that starts at 64, so the network is 192.168.10.64, the broadcast is 192.168.10.127, and hosts run from .65 to .126.",
      },
      {
        question: "What are the RFC 1918 private address ranges?",
        answer:
          "10.0.0.0/8 (10.0.0.0–10.255.255.255), 172.16.0.0/12 (172.16.0.0–172.31.255.255) and 192.168.0.0/16 (192.168.0.0–192.168.255.255). They are not routed on the public internet, so any organisation can use them internally.",
      },
      {
        question: "How many /64 subnets are in a /48?",
        answer:
          "65,536 (2^16). A /56, a common allocation for home connections, holds 256. IPv6 LANs are normally /64 because stateless address autoconfiguration (SLAAC) uses the last 64 bits as the interface ID.",
      },
    ],
  },

  "mac-address-lookup": {
    intro:
      "Paste a MAC address in any common notation (colon, hyphen, Cisco dotted or plain hex) and this tool rewrites it in every format, decodes the two flag bits in the first byte, and looks up the manufacturer from the first three bytes, the OUI. Be clear about what the vendor lookup covers: it uses a built-in list of about 140 prefixes from common vendors such as Apple, Samsung, Cisco, Intel, TP-Link, Raspberry Pi and the main virtual-machine platforms, not the IEEE's full register of tens of thousands. Many valid addresses will show as not in the list. The format conversion and bit decoding work for any address.",
    howTo: {
      title: "How to look up and reformat a MAC address",
      steps: [
        "Paste a MAC address. Separators and letter case don't matter: 3C-07-54-12-34-56, 3c07.5412.3456 and 3C0754123456 are read the same way. Six hex digits on their own look up just the OUI.",
        "Read the vendor, the OUI, whether the address is unicast or multicast, and whether it is globally unique or locally administered.",
        "Copy the address in colon (Linux, macOS), hyphen (Windows), Cisco dotted, raw hex or decimal form.",
        "Try a sample, or press Random MAC to generate a locally administered unicast address for a lab or virtual machine.",
      ],
    },
    useCases: [
      {
        title: "Identifying a device on your network",
        body:
          "A router's client list often shows only MAC addresses. When the prefix is in the list, a result such as Raspberry Pi or TP-Link tells you what the device is. If the second hex digit is 2, 6, A or E, the address is locally administered, which on a phone usually means private Wi-Fi addressing is switched on, so the manufacturer cannot be read from the address at all.",
      },
      {
        title: "Reformatting for switches and DHCP",
        body:
          "Cisco IOS shows and accepts MACs as 0011.2233.4455, Windows uses hyphens, and Linux tools and most DHCP servers use colons. Pasting one form and copying another avoids retyping twelve hex digits, which is where typos in DHCP reservations and port-security rules usually come from.",
      },
      {
        title: "Spotting virtual machines",
        body:
          "Prefixes for VMware (00:50:56, 00:0C:29 and others), VirtualBox (08:00:27) and Hyper-V (00:15:5D) are in the list, so a lookup quickly separates a VM's virtual adapter from physical hardware when you are tracking down a duplicate address or an unexpected host.",
      },
    ],
    tips: [
      "The first three bytes are the OUI the IEEE assigns to a manufacturer; the last three are chosen by the manufacturer for each device.",
      "Bit 0 of the first byte (I/G) marks a multicast address when set, which is why multicast MACs always have an odd first byte.",
      "Bit 1 (U/L) marks a locally administered address. Phones and laptops use these for private Wi-Fi addresses, and software can set any MAC it likes, so a vendor match is a strong hint, not proof.",
      "When this list has no match, the IEEE's public OUI register is the authoritative place to look a prefix up.",
      "Random MAC sets the locally administered bit and clears the multicast bit, so the result is safe to assign to a virtual interface without colliding with any manufacturer's range.",
    ],
    extraFaqs: [
      {
        question: "Why does my address show 'Not in built-in list'?",
        answer:
          "The tool ships with about 140 common prefixes so that it works offline and instantly, while the IEEE has assigned tens of thousands and large vendors own hundreds each. A miss only means the prefix is not in this short list, not that the address is invalid or fake.",
      },
      {
        question: "Can two devices share the same MAC address?",
        answer:
          "Factory-assigned addresses should never collide. Virtual machines, cloned VM images and software that overrides the MAC can produce duplicates, which cause intermittent connectivity on the same network segment until one is changed.",
      },
      {
        question: "Does a MAC address reveal my location?",
        answer:
          "No. It identifies a network interface and is only visible to devices on the same local network segment; routers do not pass it on across the internet.",
      },
    ],
  },

  "ipv4-to-ipv6": {
    intro:
      "This tool shows an IPv4 address in the IPv6 forms you meet in logs, socket code and transition setups: the IPv4-mapped address (::ffff:192.0.2.1) in dotted and hex notation, the deprecated IPv4-compatible form, the 6to4 prefix (2002::/48) and the SIIT translated form, plus the address as a 32-bit integer, hex and binary, and its reverse-DNS name. A second mode expands any IPv6 address to its full 32-digit form, compresses it to the standard short form, and gives its ip6.arpa reverse-DNS name.",
    howTo: {
      title: "How to convert IPv4 to IPv6 and expand IPv6",
      steps: [
        "Choose IPv4 to IPv6 Converter, or IPv6 Expander & Compressor.",
        "Enter an IPv4 address such as 203.0.113.10, or pick a sample (Cloudflare 1.1.1.1, Google 8.8.8.8, a local gateway or a documentation address).",
        "Copy the representation you need; every row has its own copy button.",
        "In the IPv6 mode, paste a compressed, expanded or mixed address (including one ending in a dotted IPv4 part) to get the full form, the compressed form and the PTR name.",
      ],
    },
    useCases: [
      {
        title: "Reading dual-stack server logs",
        body:
          "A server listening on an IPv6 socket that also accepts IPv4 records IPv4 clients as ::ffff:203.0.113.10. Recognising that this is simply 203.0.113.10 matters when you search logs, match firewall rules or look the address up in a database that expects plain IPv4.",
      },
      {
        title: "Writing ip6.arpa PTR records",
        body:
          "Reverse DNS for IPv6 reverses all 32 hex digits one nibble at a time, separated by dots, so 2001:db8::1 becomes a 32-label name ending in 8.b.d.0.1.0.0.2.ip6.arpa. Typing that by hand nearly always drops a zero; generating it removes the risk.",
      },
      {
        title: "Comparing addresses in configs",
        body:
          "The same IPv6 address can be written many ways: 2001:0db8:0000:0000:0000:0000:0000:0001, 2001:db8:0:0::1 and 2001:db8::1 are identical. Expanding both sides to the full form, or compressing both, makes a plain text comparison reliable.",
      },
    ],
    tips: [
      "Compression follows RFC 5952: lower-case hex, leading zeros dropped in each group, and :: used once, for the longest run of two or more zero groups.",
      "IPv4-compatible addresses (::192.0.2.1) were deprecated by RFC 4291 and are shown only so you can recognise them in old configurations.",
      "6to4 (2002::/16) embeds the IPv4 address in the next 32 bits. The public relay system it depended on was deprecated in 2015 (RFC 7526), so it is rarely used today.",
      "NAT64 addresses (64:ff9b::/96), which DNS64 networks synthesise, are a different thing from the IPv4-mapped form and are not generated here.",
      "The IPv4 reverse DNS value is the PTR name for that single address.",
    ],
    extraFaqs: [
      {
        question: "Can I reach an IPv4 website using its ::ffff: address?",
        answer:
          "Only from software on your own machine that supports dual-stack sockets. IPv4-mapped addresses are an internal representation inside one host's network stack and are never sent on the wire, so they cannot carry IPv6 traffic to an IPv4-only server. That is the job of NAT64 with DNS64.",
      },
      {
        question: "Why does IPv6 use colons instead of dots?",
        answer:
          "An IPv6 address is 128 bits, written as eight groups of four hex digits. Colons separate the 16-bit groups, and dots stay reserved for the embedded IPv4 notation (::ffff:192.0.2.1), so both can appear in one address without ambiguity.",
      },
    ],
  },

  "ssl-cert-decoder": {
    intro:
      "Paste a PEM certificate (the text from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE-----) or a certificate signing request and this decoder reads it in your browser: who it was issued to and by, the validity dates and days remaining, the domain names in the Subject Alternative Names, the serial number, the signature and public-key algorithms, and the SHA-256 fingerprint. Certificates are public, but nothing is uploaded either way. If you paste a whole chain, the first certificate, normally your server's own, is the one decoded.",
    howTo: {
      title: "How to decode an SSL certificate or CSR",
      steps: [
        "Paste a certificate or CSR in PEM format, or pick a sample. To fetch one from a live site, run openssl s_client -connect example.com:443 -servername example.com and copy the first BEGIN/END block, or export it from your browser's padlock menu.",
        "Check the status and days remaining at the top.",
        "Read the Subject (who it is issued to) and the Issuer (the certificate authority).",
        "Check that every hostname you serve appears under Subject Alternative Names.",
        "Copy the SHA-256 fingerprint, serial number or algorithm names as needed.",
      ],
    },
    useCases: [
      {
        title: "Expiry checks",
        body:
          "Public TLS certificates issued since 15 March 2026 can be valid for at most 200 days, and the CA/Browser Forum's schedule cuts that to 100 days in March 2027 and 47 days in 2029. Renewals are now frequent, so pasting the certificate a server actually presents, rather than the one you believe you installed, is the quickest way to confirm the renewal took effect.",
      },
      {
        title: "Wildcard and SAN coverage",
        body:
          "Browsers match the hostname only against the Subject Alternative Names; Chrome stopped using the Common Name in 2017. A wildcard *.example.com covers www.example.com but neither example.com itself nor a.b.example.com, so check that the bare domain and every subdomain you serve are listed.",
      },
      {
        title: "Checking a CSR before you submit it",
        body:
          "A CSR fixes the subject and public key the authority will certify. Decoding it before you send it catches a misspelt domain, a wrong organisation name or an unexpected key type while correcting it still costs nothing.",
      },
    ],
    tips: [
      "Never paste a private key (BEGIN PRIVATE KEY) into any website. A certificate or CSR is all this tool needs, and both are meant to be public.",
      "A fingerprint identifies one exact certificate: compare the SHA-256 value with the one in your browser's certificate viewer to confirm two copies are the same file.",
      "Common algorithms are shown by name (RSA, RSA-PSS, ECDSA with SHA-256 or SHA-384, Ed25519); anything rarer appears as its numeric OID.",
      "Days remaining is worked out from your device's clock, so a wrong system date gives a wrong figure.",
      "To inspect an intermediate certificate from a chain file, paste its BEGIN/END block on its own.",
    ],
    extraFaqs: [
      {
        question: "Can a certificate be decoded without the private key?",
        answer:
          "Yes. Certificates are public documents that a server sends to every visitor. They contain the public key and identity details; the private key never leaves the server.",
      },
      {
        question: "What is an intermediate certificate?",
        answer:
          "Certificate authorities sign server certificates with an intermediate certificate, which is in turn signed by a root that browsers already trust. Your server must send its own certificate plus the intermediate; if it sends only its own, some browsers and most command-line tools report an incomplete chain.",
      },
      {
        question: "Why is only one certificate shown when I paste a chain?",
        answer:
          "The decoder reads the first PEM block, which in a server chain file is the certificate for your domain. Paste another block on its own to inspect it.",
      },
    ],
  },

  "sql-formatter": {
    intro:
      "Paste a SQL query that arrived on one line, from an ORM log, a slow-query report or an error message, and this formatter puts each clause (SELECT, FROM, each JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT and so on) on its own line, indents the lines in between, and sets keywords to upper case, lower case or leaves them as typed. String literals and comments are never altered, so a value like 'it''s -- not a comment' comes through intact. Minify does the reverse, collapsing the query to a single line without comments.",
    howTo: {
      title: "How to format SQL",
      steps: [
        "Paste your query, or load a preset: a JOIN with GROUP BY, an INSERT, a CTE with window functions, or an UPDATE with a subquery.",
        "Choose keyword casing: UPPERCASE, lowercase or preserve.",
        "Choose indentation: 2 spaces, 4 spaces or a tab.",
        "Turn on Minify for a one-line version without comments.",
        "Copy the result, or download it as query.sql (query.min.sql when minified).",
      ],
    },
    useCases: [
      {
        title: "Reading ORM-generated queries",
        body:
          "Hibernate, Django, Prisma and ActiveRecord log queries as one long line full of aliased columns. Breaking it at each clause shows at a glance which tables are joined and what the WHERE conditions are, which is often enough to spot the unexpected JOIN or missing LIMIT behind a slow request.",
      },
      {
        title: "Consistent queries in code review",
        body:
          "Migrations and report queries written by different people drift into different styles. Running them through the same casing and indentation before committing means the diff shows real changes rather than whitespace.",
      },
      {
        title: "One-line queries for scripts",
        body:
          "Some places need a query on a single line: a psql -c argument, a cron entry, a JSON config value. Minify removes line breaks and comments and keeps every string literal exactly as written.",
      },
    ],
    tips: [
      "Formatting never changes what a query does; databases ignore whitespace and keyword case. String contents and quoted identifiers are left alone.",
      "A line comment (-- note) keeps its own line, so nothing that followed it is accidentally commented out.",
      "The formatter is deliberately simple: it breaks lines at clauses, but does not put each selected column on its own line or indent nested subqueries by depth.",
      "It is dialect-neutral text processing, so PostgreSQL, MySQL, SQLite and SQL Server syntax pass through, but it does not check that the query is valid.",
      "Minify removes all comments, including optimizer hints written as /*+ … */ in MySQL and Oracle. Format instead of minifying if you need to keep them.",
    ],
    extraFaqs: [
      {
        question: "Does formatting alter the query execution plan?",
        answer:
          "No. Query planners ignore whitespace, line breaks and keyword case, so the formatted query runs exactly like the original.",
      },
      {
        question: "Does it check my SQL for errors?",
        answer:
          "No. It does not parse SQL grammar, so a query with a typo is formatted like any other. Run it against your database, or use EXPLAIN, to check it.",
      },
    ],
  },

  "json-to-yaml": {
    intro:
      "Convert JSON to YAML or YAML to JSON, with the input and output side by side. Conversion uses js-yaml, a widely used YAML library, so block text (run: | in a CI file), quoted strings, anchors and multi-document files are handled properly rather than approximated. Strings that YAML would otherwise misread, such as 'yes', 'on', '-1' or a value containing ': ', are quoted automatically, and invalid input is reported with its line and column.",
    howTo: {
      title: "How to convert JSON to YAML and YAML to JSON",
      steps: [
        "Choose JSON → YAML or YAML → JSON; the swap button reverses the direction.",
        "Paste your data, or load the Docker Compose, Kubernetes Pod or GitHub Actions sample.",
        "Pick 2- or 4-space indentation.",
        "If an error appears under the panels, fix the line and column it names.",
        "Copy the result or download it as document.yaml or document.json.",
      ],
    },
    useCases: [
      {
        title: "Kubernetes manifests from kubectl",
        body:
          "kubectl get deployment web -o json prints a live resource as JSON. Converting it to YAML gives the familiar manifest layout you can edit and commit. Remove the status block and server-set fields such as metadata.uid, resourceVersion and creationTimestamp before applying it again.",
      },
      {
        title: "Seeing how a YAML file is really read",
        body:
          "YAML guesses types: python-version: 3.10 becomes the number 3.1, and a postcode like 01234 becomes 1234. Converting YAML to JSON shows exactly how a YAML 1.2 parser types every value, which is the quickest way to debug a config that looks right but behaves wrongly. Quote anything that must stay a string.",
      },
      {
        title: "JSON for tools that need it",
        body:
          "JSON Schema validators, jq and many APIs accept only JSON, even when your team keeps the same configuration in YAML. Converting preserves the structure exactly, and the JSON Formatter can then validate or pretty-print the result.",
      },
    ],
    tips: [
      "Comments do not survive YAML → JSON, because JSON has no comment syntax. Keep the YAML as the source of truth if its comments matter.",
      "A YAML stream with several documents separated by --- becomes a JSON array with one element per document.",
      "YAML is read with YAML 1.2 rules, where yes, no, on and off are plain strings. Older YAML 1.1 tools treat them as booleans, so JSON → YAML quotes them to be safe.",
      "Anchors and aliases (&base, *base) are expanded into full copies in the JSON; going back, repeated blocks are written out in full rather than as anchors.",
      "Dates such as 2024-01-01 stay strings in the JSON instead of being turned into timestamps.",
    ],
    extraFaqs: [
      {
        question: "Can YAML contain comments that JSON does not support?",
        answer:
          "Yes. YAML supports # comments; JSON has none. Converting YAML to JSON drops them, and converting back cannot restore them.",
      },
      {
        question: "Why are some strings quoted in the YAML output?",
        answer:
          "Because unquoted they would be read as something else: '-1' as a number, 'yes' or 'on' as true by YAML 1.1 parsers, 'x: y' as a key and value, and an empty value as null. Quoting keeps them strings in every parser.",
      },
      {
        question: "What is the best indentation standard for YAML?",
        answer:
          "Two spaces is the norm for Kubernetes, Ansible, Docker Compose and GitHub Actions. YAML forbids tab characters for indentation, so always use spaces.",
      },
    ],
  },

  "chmod-calculator": {
    intro:
      "Tick read, write and execute for the owner, the group and everyone else, and this calculator shows the matching octal mode (755), the symbolic string ls -l prints (-rwxr-xr-x), the u=,g=,o= form, and ready-to-copy chmod commands. It works in reverse too: type an octal value or a symbolic string and the checkboxes follow. The setuid, setgid and sticky bits are included, shown with the s, S, t and T letters that ls uses for them.",
    howTo: {
      title: "How to work out chmod permissions",
      steps: [
        "Pick a preset (folder 755, file 644, SSH key 600, ~/.ssh 700, executable script 755, shared /tmp 1777, read-only 444) or start from the grid.",
        "Tick Read (4), Write (2) and Execute (1) for Owner, Group and Others.",
        "Add SUID, SGID or the sticky bit if you need them; the octal value gains a fourth, leading digit.",
        "Or type an octal value or a 9- or 10-character symbolic string to set the grid from it.",
        "Copy the command you need: plain, recursive, symbolic, or the find commands that set directories and files separately.",
      ],
    },
    useCases: [
      {
        title: "Fixing SSH key errors",
        body:
          "ssh refuses a private key that other users can read and prints 'UNPROTECTED PRIVATE KEY FILE'. chmod 600 on the key (read and write for the owner only) fixes it, and the ~/.ssh directory itself should be 700. Both are presets.",
      },
      {
        title: "Web server files",
        body:
          "The usual layout is 755 for directories and 644 for files: everyone can read, only the owner can change anything. Avoid chmod -R 755 on a whole site, which marks every file executable; the Fix Web Permissions command uses find to set directories and files separately.",
      },
      {
        title: "Shared team directories",
        body:
          "Setting the setgid bit on a directory (chmod 2775) makes new files inherit the directory's group instead of each creator's own group, so a team keeps access to each other's files. The sticky bit (as on /tmp, mode 1777) stops users deleting files they do not own.",
      },
    ],
    tips: [
      "Each digit is the sum of r = 4, w = 2 and x = 1: 7 is rwx, 6 is rw-, 5 is r-x, 4 is r--.",
      "On a directory, r lets you list the names in it, x lets you enter it and reach files inside, and w lets you create, rename and delete entries (which also needs x).",
      "A capital S or T in the symbolic string means a special bit is set without the matching execute bit, which is usually a mistake.",
      "chmod 777 lets any local user change or replace the file. If a web app only works with 777, the real problem is ownership: fix it with chown instead.",
      "Linux ignores the setuid bit on shell scripts for security reasons; it only takes effect on compiled programs.",
    ],
    extraFaqs: [
      {
        question: "How do octal permissions add up?",
        answer:
          "Read = 4, write = 2, execute = 1, added up separately for owner, group and others. Read + write = 6, read + execute = 5, all three = 7, so rw-r--r-- is 644 and rwxr-x--- is 750.",
      },
      {
        question: "What is SGID on a directory?",
        answer:
          "With SGID (2000) set on a directory, files and subdirectories created inside it take the directory's group rather than the primary group of the user who created them.",
      },
      {
        question: "Is chmod 755 the same as chmod u=rwx,g=rx,o=rx?",
        answer:
          "Yes, both set exactly the same permissions. The symbolic form can also add or remove a single bit without touching the rest (chmod g+w file), which an octal value cannot do.",
      },
    ],
  },

  "docker-to-compose": {
    intro:
      "Paste a docker run command, even one split over several lines with backslashes, and get the equivalent service in a docker-compose.yml in the current Compose Specification format. Ports, volumes, environment variables and env files, restart policy, networks, memory and CPU limits, working directory, user, entrypoint, hostname, added capabilities, extra hosts and labels are all mapped. Arguments after the image become the service's command as a list, so quoted arguments like sh -c \"a && b\" survive intact, and any flag the converter does not map is listed under the output instead of being dropped silently.",
    howTo: {
      title: "How to convert docker run to Docker Compose",
      steps: [
        "Paste the command (with or without sudo docker run in front), or pick a preset: Nginx, PostgreSQL, Redis with limits, or a Node app with networks.",
        "Read the generated YAML. The service is named after --name, or after the image when there is no name.",
        "Check the warning under the output for flags that were not converted, such as --gpus, and add those to the file yourself.",
        "Copy the YAML or download docker-compose.yml, then run docker compose up -d in the same folder.",
      ],
    },
    useCases: [
      {
        title: "Turning a one-off command into a file",
        body:
          "A docker run line with a dozen flags lives in shell history until it is lost. As a compose file it can be committed, reviewed and re-run with docker compose up -d, and changing one port or variable no longer means retyping the whole command.",
      },
      {
        title: "Starting point for a self-hosted app",
        body:
          "Many projects document installation as a single docker run command. Converting it gives you a compose file to build on, adding a database service, a reverse proxy or a backup container next to it.",
      },
      {
        title: "Seeing what a command really grants",
        body:
          "Laid out as named keys (privileged: true, network_mode: host, cap_add), it is obvious when a command copied from a forum gives the container more access than the app needs.",
      },
    ],
    tips: [
      "--network host, none or bridge become network_mode. Any other network name becomes an external network, which you are expected to have created with docker network create.",
      "Bind mounts (./data:/data, /srv/app:/app) stay as paths. A name before the colon (pgdata:/var/lib/postgresql/data) is a named volume and is declared at the bottom of the file.",
      "-m and --cpus become deploy.resources.limits, which docker compose up applies in current Compose versions.",
      "container_name is only added when the command used --name. Leaving it out lets Compose name containers itself, which you need if you ever scale the service.",
      "-d, -it and --rm have no compose equivalent and are dropped: docker compose up -d runs detached, and docker compose run --rm gives a throwaway container.",
    ],
    extraFaqs: [
      {
        question: "Does this support multi-line docker run commands with backslashes?",
        answer:
          "Yes. Backslash line continuations are joined before the flags are read, so a command copied from documentation works as pasted.",
      },
      {
        question: "What version of Docker Compose is generated?",
        answer:
          "The Compose Specification used by Docker Compose v2 (the docker compose command). The old top-level version: key is not written; current Compose ignores it and prints a warning when it is present.",
      },
      {
        question: "Why is a flag listed as not converted?",
        answer:
          "docker run has many flags and only the common ones are mapped. Others, such as --gpus, --device, --log-driver or --ulimit, have compose equivalents with a different shape (GPU access, for example, goes under deploy.resources.reservations.devices), so they are listed for you to add rather than guessed.",
      },
    ],
  },

  "box-shadow-gen": {
    intro:
      "Build a CSS box-shadow from up to five layers, see it live on a sample card against a light or dark background, and copy either the CSS value or a Tailwind arbitrary class. Each layer has its own X and Y offset, blur, spread, colour, opacity, inset switch and visibility toggle, which is how natural-looking shadows are made: a small, sharp shadow where the card meets the surface plus a large, soft one for ambient light. Five presets (subtle card, floating elevation, neon glow, neumorphic and dual rim) give you a starting point.",
    howTo: {
      title: "How to build a layered box shadow",
      steps: [
        "Pick a preset or start from the default layers.",
        "Select a layer and adjust its X and Y offset, blur, spread, colour and opacity; switch on Inset for an inner shadow.",
        "Add a layer (up to five), hide one with the eye icon to compare, or delete it.",
        "Switch the preview background between light and dark to check the shadow on both.",
        "Copy the CSS box-shadow value or the Tailwind shadow-[…] class.",
      ],
    },
    useCases: [
      {
        title: "Elevation levels for a design system",
        body:
          "Cards, menus and dialogs read as sitting at different heights when their shadows grow with elevation: more Y offset and blur for higher surfaces, with opacity kept low. Building each level here and saving the values as tokens such as shadow-sm, shadow-md and shadow-lg keeps every component consistent.",
      },
      {
        title: "Shadows that still work in dark mode",
        body:
          "A black shadow almost vanishes on a dark background, which the dark preview shows straight away. Common fixes are a slightly stronger opacity, a faint 1px light ring (a layer with 0 offset, 0 blur, 1px spread and low-opacity white), or a lighter surface colour for raised elements.",
      },
      {
        title: "Focus rings and glows",
        body:
          "A layer with no offset and no blur but a 2–3px spread draws a crisp ring that, unlike a border, does not change the element's size; many focus styles are built this way. Several zero-offset, coloured, blurred layers make a glow.",
      },
    ],
    tips: [
      "Negative spread pulls the shadow in from the edges so a large blur doesn't spill out sideways; the Floating Elevation preset pairs a 25px blur with −5px spread.",
      "For everyday UI, keep black shadows at roughly 5–15% opacity. Heavier shadows look dated and muddy.",
      "In the Tailwind class, spaces in the value are written as underscores, which Tailwind turns back into spaces.",
      "Inset shadows are drawn inside the border and are the basis of pressed buttons and recessed inputs.",
      "Shadows never affect layout, so adding one never moves the elements around it.",
    ],
    extraFaqs: [
      {
        question: "What does the spread radius do in box-shadow?",
        answer:
          "Spread grows or shrinks the shadow's shape before it is blurred. Positive spread makes the shadow larger than the element; negative spread makes it smaller, which keeps a soft shadow tucked under the element instead of spreading around all four sides.",
      },
      {
        question: "Can box-shadow affect performance?",
        answer:
          "Static shadows are cheap. Animating box-shadow forces a repaint on every frame, which can stutter on low-end phones when many elements animate at once; a common workaround is to put the shadow on a pseudo-element and animate its opacity instead.",
      },
    ],
  },

  "glassmorphism-gen": {
    intro:
      "Design a frosted-glass panel: a semi-transparent background with backdrop-filter blurring whatever sits behind it, an optional light border, rounded corners and a soft shadow. Sliders control blur, saturation, tint colour and opacity, border colour, opacity and width, and corner radius, and the preview card sits over a choice of three busy backgrounds so you can judge the effect. The output is plain CSS, including the -webkit- prefixed line for older Safari versions, and the equivalent Tailwind classes.",
    howTo: {
      title: "How to create a glassmorphism effect",
      steps: [
        "Start from a preset: Frosted Glass Card, Dark HUD, Ultra Minimal Rim or Deep Obsidian Glass.",
        "Adjust Backdrop Blur and Saturation to set how strongly the background is softened.",
        "Set the tint colour and its opacity; lower opacity lets more of the background show through.",
        "Set the border colour, opacity and width, and the corner radius.",
        "Switch the preview scene (gradient, geometric shapes or neon) to test it over different content, then copy the CSS or the Tailwind classes.",
      ],
    },
    useCases: [
      {
        title: "Sticky headers over scrolling content",
        body:
          "A header with a light tint and 10–16px of blur stays readable while the page scrolls underneath and still hints at what is behind it. Test it over the busiest content on your page, such as photos, not just over a plain background.",
      },
      {
        title: "Cards on a photo or gradient",
        body:
          "Glass panels only work when there is something colourful behind them; over a flat white page they just look grey. Raising saturation to around 150–180% keeps the colours behind the glass vivid instead of muddy.",
      },
      {
        title: "Dialogs and overlays",
        body:
          "A blurred backdrop behind a dialog keeps the page visible but clearly inactive. Make the dialog's own tint opaque enough that its text stays readable whatever happens to be behind it.",
      },
    ],
    tips: [
      "backdrop-filter blurs only what is behind the element. With nothing colourful behind it, there is nothing visible to blur.",
      "Contrast changes as the background moves. Check text over the brightest and darkest content the panel can sit on, and raise the tint opacity until it stays readable; WCAG asks for 4.5:1 for body text.",
      "Large blurred areas cost GPU time, especially on low-end phones and when animated. Keep the blurred area modest and avoid animating it.",
      "Browsers without backdrop-filter show only the semi-transparent tint, so pick a tint that still works without the blur.",
      "In the Tailwind output, spaces inside arbitrary values are written as underscores, for example bg-[rgba(255,_255,_255,_0.15)], as Tailwind requires.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between filter: blur() and backdrop-filter: blur()?",
        answer:
          "filter: blur() blurs the element itself, including its text. backdrop-filter: blur() blurs whatever is behind the element and leaves the element's own content sharp, which is what makes the glass effect possible.",
      },
      {
        question: "Why is -webkit-backdrop-filter included?",
        answer:
          "Safari supported backdrop-filter only with the -webkit- prefix until Safari 18 in 2024. Keeping both lines covers iPhones and Macs that have not been updated.",
      },
    ],
  },

  "px-to-rem": {
    intro:
      "Convert between pixels and rem at any root font size, with the em, percentage and point equivalents shown alongside, and generate a CSS clamp() value for fluid type that grows smoothly between two screen widths. The clamp() section includes a viewport slider so you can watch the computed size change, and a reference table lists Tailwind's font-size classes in rem and pixels.",
    howTo: {
      title: "How to convert px to rem and build a clamp() value",
      steps: [
        "Choose the root font size: 16px (the browser default), 14, 12 or 10.",
        "Type a pixel value to get rem, or a rem value to get pixels; the two fields stay in sync.",
        "For fluid type, enter the smallest and largest viewport widths and the font size you want at each.",
        "Drag Simulate Viewport to check the size at widths in between.",
        "Copy the clamp() value into your font-size declaration.",
      ],
    },
    useCases: [
      {
        title: "Turning a design into code",
        body:
          "Design tools give sizes in pixels. With the usual 16px root, 14px is 0.875rem, 18px is 1.125rem and 24px is 1.5rem. Sizes in rem grow when a visitor raises their browser's default font size, which pixel sizes ignore.",
      },
      {
        title: "Fluid headings without breakpoints",
        body:
          "For a heading that should be 16px on a 375px phone and 24px on a 1280px laptop, the calculator produces clamp(1rem, 0.884vw + 0.7928rem, 1.5rem): 16px at 375px, about 19.5px on a 768px tablet, and 24px from 1280px up. One declaration replaces a ladder of media queries.",
      },
      {
        title: "Reading an older stylesheet",
        body:
          "Some stylesheets set html { font-size: 62.5% } so that 1rem equals 10px. Switch the root to 10px to read their values correctly, and be aware that the trick shrinks text in any component that assumes the 16px default.",
      },
    ],
    tips: [
      "rem is relative to the root (html) font size; em is relative to the element's own font size, so nested ems compound: 1.2em inside 1.2em is 1.44 times the root.",
      "Points are a print unit. In CSS, 1pt = 1/72 inch and 1px = 1/96 inch, so 16px = 12pt.",
      "Keep the clamp() middle term as vw plus rem, as generated here. A font size in vw alone ignores the reader's font-size setting, which fails WCAG's resize-text requirement.",
      "The minimum and maximum in the clamp() value are in rem too, so the limits also follow the reader's font-size preference.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between REM and EM?",
        answer:
          "REM (root em) is always relative to the font size of the <html> element. EM is relative to the font size of the element it is used on (or its parent, for font-size itself), so values compound when elements are nested.",
      },
      {
        question: "How is the clamp() value calculated?",
        answer:
          "The preferred size is a straight line through your two points: slope = (max size − min size) ÷ (max width − min width), and intercept = min size − slope × min width. The middle term is slope × 100 in vw plus the intercept in rem, and clamp() holds it between your minimum and maximum sizes.",
      },
    ],
  },

  "svg-to-data-uri": {
    intro:
      "Paste SVG markup or open an .svg file, and this tool cleans it (removing the XML declaration, DOCTYPE, comments and whitespace between tags) and gives you five ready-to-paste forms: a CSS background-image rule, a URL-encoded data URI, a Base64 data URI, an HTML <img> tag, and a JSX version with attributes renamed for React. A live preview on a light or dark background confirms the encoded version still renders.",
    howTo: {
      title: "How to turn an SVG into a data URI",
      steps: [
        "Paste <svg> markup, open an .svg file, or pick a sample icon.",
        "Check the preview; switch to the dark background for icons drawn in light colours.",
        "Copy the form you need: CSS background-image, URL-encoded data URI, Base64 data URI, <img> tag or JSX.",
      ],
    },
    useCases: [
      {
        title: "Icons inside CSS",
        body:
          "Custom select arrows, checkbox ticks and list bullets are often drawn with background-image so that no extra file is requested. The URL-encoded form keeps the markup mostly readable inside your stylesheet, which makes it easy to change a fill colour later.",
      },
      {
        title: "Single-file pages",
        body:
          "A self-contained HTML report or an offline page cannot fetch images from a server. Embedding small SVGs as data URIs keeps everything in one file. For email, use PNG instead: many email clients, Gmail included, do not display SVG at all.",
      },
      {
        title: "Moving an icon into React",
        body:
          "SVG exported from design tools uses attributes such as stroke-width, fill-rule and class, which React expects as strokeWidth, fillRule and className. The JSX output renames the common ones and turns inline style strings into style objects, saving a round of fixes by hand.",
      },
    ],
    tips: [
      "In the URL-encoded form, # must become %23, or the browser treats everything after it as a page fragment and colours like #fff break. The encoder also escapes %, <, >, { and }.",
      "Double quotes are switched to single quotes so the result can sit inside a double-quoted url(\"…\"). If your SVG already uses single quotes inside attribute values, such as a font-family list, check the preview.",
      "Base64 makes the data about a third larger than the raw markup. URL-encoding usually adds less, and it compresses better with gzip or Brotli, so it is normally the better choice for SVG.",
      "Give the SVG a viewBox so it scales to the size you set in CSS with background-size or width and height.",
      "A data URI is cached only as part of the file that contains it, so keep inlining for small icons and serve larger graphics as separate files.",
    ],
    extraFaqs: [
      {
        question: "Why do unescaped '#' characters break SVG data URIs?",
        answer:
          "In a URL, # starts the fragment identifier, so the browser stops reading the image data at the first unescaped # and the SVG is cut short. Escaping it as %23 keeps colours like fill=\"#ff0000\" intact.",
      },
      {
        question: "Is there a size limit for data URIs?",
        answer:
          "Current browsers accept very long data URIs, but every byte is downloaded again with each stylesheet or page that embeds it and cannot be cached on its own. Inlining pays off for icons of a few kilobytes; larger graphics are better as files.",
      },
    ],
  },

  "color-palette-gen": {
    intro:
      "Pick a base colour and this generator builds an 11-step shade scale named the way Tailwind names its colours (50 to 950), shows each shade's contrast ratio against white and black text, suggests complementary, analogous and triadic colours, and exports the scale as a tailwind.config.js block or as CSS custom properties. The scale is built in HSL: every step keeps your colour's hue and saturation and uses a fixed lightness, from 96% for 50 down to 6% for 950.",
    howTo: {
      title: "How to generate a colour scale",
      steps: [
        "Pick a base colour with the picker, type a hex code, choose a preset (Emerald, Indigo, Rose, Amber, Cyan, Violet), or press Random.",
        "Look along the 50–950 scale; each swatch shows its contrast against white and black and which text colour to use on it.",
        "Click any swatch to copy its hex code.",
        "Check the harmony row for accent colours: complementary (opposite hue), analogous (±30°) and triadic (±120°).",
        "Copy the tailwind.config.js snippet for Tailwind v3, or the CSS variables, which go inside @theme { } in Tailwind v4.",
      ],
    },
    useCases: [
      {
        title: "From a brand colour to a full UI scale",
        body:
          "One brand hex is not enough for an interface: you need near-white tints for backgrounds, mid shades for borders and buttons, and dark shades for text. Generating eleven steps from one colour gives a family that belongs together, and the names slot straight into classes such as bg-brand-50 and text-brand-800.",
      },
      {
        title: "Choosing accessible pairs",
        body:
          "Each swatch shows its contrast against white and black. WCAG AA needs 4.5:1 for normal text and 3:1 for large text, so the ratios tell you at a glance which shades can carry white button text and which need dark text.",
      },
      {
        title: "Finding accent colours",
        body:
          "Complementary colours sit opposite each other on the colour wheel and contrast strongly; analogous ones sit beside each other and feel calm; triadic ones are spaced a third of the wheel apart. They are mathematical starting points, so adjust lightness and saturation by eye before using one.",
      },
    ],
    tips: [
      "Because every step uses a fixed lightness, your exact input colour may not appear in the scale. Shade 500 is your hue and saturation at 50% lightness; if your brand colour must appear exactly, use it alongside the scale.",
      "HSL lightness is not how bright a colour looks: a yellow and a blue at the same HSL lightness differ a lot in perceived brightness. Expect yellows to look washed out at the light end and blues to turn dark sooner; Tailwind's own palettes are hand-tuned for this.",
      "Contrast ratios use the WCAG 2 formula, which runs from 1:1 (no contrast) to 21:1 (black on white).",
      "The CSS variables are named --color-brand-50 to --color-brand-950, the naming Tailwind v4 uses for theme colours.",
    ],
    extraFaqs: [
      {
        question: "How are shades 50 through 950 calculated?",
        answer:
          "Your colour is converted to HSL; the hue and saturation are kept, and the lightness is set to 96, 90, 80, 70, 60, 50, 40, 30, 20, 12 and 6% for the eleven steps. It is simple and predictable, but it does not reproduce Tailwind's hand-tuned palettes.",
      },
      {
        question: "What does a 4.5:1 contrast ratio mean?",
        answer:
          "It is the minimum WCAG 2 Level AA asks for between normal-size text and its background, so that people with moderately low vision can read it. Large text (24px, or about 18.7px bold) needs 3:1, and Level AAA raises the bars to 7:1 and 4.5:1.",
      },
    ],
  },

  "llm-token-counter": {
    intro:
      "Paste a prompt, document or code and get an estimate of its token count, words and characters, how much of a model's context window it would fill, and what it would cost as input or output at the listed price. The count is an estimate, calibrated against OpenAI's o200k tokenizer and scaled for Claude and Gemini using the ratios those providers publish, not each provider's real tokenizer. It is good for budgeting and for checking whether something will fit. Prices are standard list prices for current OpenAI, Anthropic and Google models, with the date they were last checked shown under the table.",
    howTo: {
      title: "How to estimate tokens and API cost",
      steps: [
        "Choose a model from the list: GPT-6 Astra, Sol and Luna, Claude Fable, Opus, Sonnet and Haiku, or Gemini Pro and Flash.",
        "Paste your text, or load a sample: a system prompt, TypeScript code or a JSON payload.",
        "Read the estimated tokens, tokens per word, words and characters, and the input cost at the listed price. A long prompt switches to the higher long-prompt rate where a model has one.",
        "Check the context-window bar to see how much of the model's limit the text uses.",
        "Compare the estimated prompt and completion cost across every listed model in the table.",
      ],
    },
    useCases: [
      {
        title: "Will it fit?",
        body:
          "A long contract, a large source file or a chat history can exceed a model's context window, and anything over the limit is cut off or rejected. The capacity bar shows the share used. Leave headroom, because the window also has to hold the system prompt, any tool definitions and the model's reply.",
      },
      {
        title: "Trimming a prompt that runs on every request",
        body:
          "A system prompt is sent with every call, so its tokens are paid for thousands of times. Cutting a 2,000-token prompt to 1,200 saves 800 tokens per request, which at 100,000 requests a month is 80 million input tokens. The Prompt & Context Cleaner can strip markup and comments before you count.",
      },
      {
        title: "Rough budgeting",
        body:
          "Multiply the estimated input tokens by your expected number of requests, add an allowance for output tokens, which usually cost several times more per token, and you have an order-of-magnitude monthly figure before writing any code.",
      },
    ],
    tips: [
      "For ordinary English prose, a token averages about four characters, or roughly three-quarters of a word. Code, JSON, numbers and non-English text use more tokens per word.",
      "The same text costs more tokens on some models than others. Anthropic says the tokenizer in Claude 4.7 and later models produces about 30% more tokens than its previous one, so the estimate for Claude models is scaled up by that much; Gemini is scaled by Google's figure of about four characters a token.",
      "Output tokens cost more than input tokens on most models, so a long answer can cost more than the prompt that asked for it.",
      "The text is processed in your browser; nothing you paste is sent to any AI provider.",
      "Some models charge more for long prompts: OpenAI's GPT-6 models above 272K tokens, Gemini 3.1 Pro above 200K and Claude Haiku 5.5 above 100K. The higher rate then applies to the whole request, input and output.",
      "Prices and model line-ups change often. Treat costs here as a guide and check the provider's current pricing page before committing to a budget.",
    ],
    extraFaqs: [
      {
        question: "How accurate is the estimate?",
        answer:
          "The estimator was checked against OpenAI's o200k tokenizer: it lands within about 5% on English prose, source code and JSON, and within 10–15% on CSS, CSV data and long URLs. Claude and Gemini figures add the providers' published ratios on top, so treat them as a little less precise. For exact counts use the provider's own tools: OpenAI publishes the tiktoken library, and Anthropic and Google offer token-counting API endpoints.",
      },
      {
        question: "Why do different models produce different token counts?",
        answer:
          "Each provider trains its own tokenizer vocabulary, so the same word may be one token for one model and two or three for another. Counts for the same text can differ by a noticeable margin between providers.",
      },
      {
        question: "Why are completion tokens more expensive than prompt tokens?",
        answer:
          "A prompt is processed in one parallel pass, while output is generated one token at a time, each step needing another pass through the model. That sequential work costs more compute per token, and pricing reflects it.",
      },
    ],
  },

  "ai-prompt-opt": {
    intro:
      "This is a prompt builder, not an AI that rewrites your text. You fill in the parts of a well-structured prompt (the role the model should take, background context, the specific goal, rules and things to avoid, how to reason, examples, and the output format) and it assembles them into one prompt with each part wrapped in its own XML-style tag, such as <role>, <context> and <rules>. Empty sections are left out. Model providers, Anthropic in particular, recommend tagged sections for long prompts because they keep instructions, background and data clearly apart. Three templates (code reviewer, data extraction, docs writer) show filled-in examples.",
    howTo: {
      title: "How to build a structured prompt",
      steps: [
        "Pick a template, or clear the fields and start your own.",
        "Fill in the sections you need: role, context, objective, rules, thinking process, examples and output format.",
        "Keep Include {{USER_INPUT}} Placeholder switched on if your code will insert user data; it adds an <input_data> block at the end.",
        "Copy the assembled prompt into your system prompt, API call or chat.",
      ],
    },
    useCases: [
      {
        title: "Turning a one-line request into a reusable prompt",
        body:
          "'Review this code' gets a generic answer. Stating the role (senior reviewer for a TypeScript API), the context (Node 20, PostgreSQL), the objective (find security and performance problems), the rules (cite line numbers, skip style nitpicks) and the output format (a table of severity, line and fix) gets a focused, consistent one, and the same prompt can be reused next time.",
      },
      {
        title: "Keeping user data apart from instructions",
        body:
          "When an app inserts text from users or documents into a prompt, putting it in its own tag at the end, as the {{USER_INPUT}} option does, and telling the model in the rules to treat that block as data makes it harder for text inside a document to be taken as instructions. It reduces prompt-injection risk; it does not remove it.",
      },
      {
        title: "Sharing prompts across a team",
        body:
          "Sections with fixed names make prompts easier to review: a teammate can tighten the rules or swap the examples without rewriting everything, and the differences between versions are easy to see in a diff.",
      },
    ],
    tips: [
      "Examples are the strongest signal for output format. One or two realistic input and output pairs usually do more than a paragraph describing the format.",
      "Say what to do as well as what to avoid: 'Write for a non-technical reader' works better than 'Don't use jargon' on its own.",
      "Ask for step-by-step reasoning only when the task needs it (multi-step logic, maths, code review). For simple lookups it just makes answers longer and costlier.",
      "The tag names are a convention, not syntax the model requires. What matters is that each section is clearly delimited and consistently named.",
      "Nothing is sent anywhere; the builder only joins your text together in the browser.",
    ],
    extraFaqs: [
      {
        question: "Why use XML tags instead of Markdown headings?",
        answer:
          "A Markdown heading can blend into Markdown inside the data you are passing, while an opening and closing tag pair marks exactly where a section starts and ends. Either works for short prompts; tags help most when a prompt mixes instructions with long pasted content.",
      },
      {
        question: "What is chain-of-thought prompting?",
        answer:
          "Asking the model to work through a problem step by step before answering. It tends to improve accuracy on multi-step problems. Many current models already reason internally, so test whether an explicit thinking section helps for your model and task.",
      },
      {
        question: "Does this tool rewrite or optimise my prompt?",
        answer:
          "No. It does not change your wording or send it to a model; it arranges what you write into a consistent, tagged structure. How well the prompt works still depends on how clearly each section is written.",
      },
    ],
  },

  "json-schema-for-ai": {
    intro:
      "Describe a tool your AI model can call (its name, what it does, and each parameter's name, type, description, whether it is required and any allowed values) and this builder writes the definition three ways: for OpenAI function calling, for Anthropic tool use (input_schema), and as a matching TypeScript interface for your handler code. With Strict on, it follows OpenAI's Structured Outputs rules: every property is listed as required, optional ones become nullable, additionalProperties is false, and arrays and objects get the fields strict mode insists on.",
    howTo: {
      title: "How to build a function-calling schema",
      steps: [
        "Start from a template (Get Weather, Query Database, Send Email), or enter your own tool name in snake_case and a one-sentence description.",
        "Add parameters with a name, type (string, number, boolean, array or object), description and whether each is required.",
        "For a fixed set of choices, enter enum values separated by commas, for example celsius, fahrenheit.",
        "Switch Strict on or off depending on whether you use OpenAI Structured Outputs.",
        "Switch between the OpenAI, Anthropic and TypeScript tabs to copy or download each version.",
      ],
    },
    useCases: [
      {
        title: "One definition for several providers",
        body:
          "OpenAI wraps the schema in a function object under parameters, while Anthropic expects name, description and input_schema at the top level. The JSON Schema inside is the same, so defining the parameters once and copying both versions stops them drifting apart when a parameter changes.",
      },
      {
        title: "Reliable arguments with Structured Outputs",
        body:
          "With strict: true, OpenAI constrains generation to your schema, so arguments always parse and always contain every field. The catch is that the schema must follow strict-mode rules (all fields required, no extra properties, nullable types for optional fields), and the builder applies them for you.",
      },
      {
        title: "Typing the handler",
        body:
          "The TypeScript interface matches the schema field for field, including union types for enums and | null for optional fields in strict mode, so the function that receives the model's arguments is typed instead of taking any.",
      },
    ],
    tips: [
      "The description is the model's only guide to when to call the tool and what to put in each field. Write it like an instruction: 'City name, e.g. Paris. Not a country.'",
      "Enums are the most reliable way to restrict a value. For numeric choices, set the type to number so the values are emitted as numbers.",
      "In strict mode an optional field arrives as null when the model has nothing for it, so handle null in your code.",
      "Array parameters are generated as arrays of strings and object parameters as empty objects; edit the JSON if you need another item type or nested fields.",
      "Validate arguments on your server before acting on them, even with a strict schema; the model still chooses the values.",
    ],
    extraFaqs: [
      {
        question: "What does 'additionalProperties: false' mean in JSON Schema?",
        answer:
          "It says no keys other than the declared properties are allowed. OpenAI's strict mode requires it on every object, so the model can never add a field your code does not expect.",
      },
      {
        question: "How do tools differ from standard JSON mode?",
        answer:
          "JSON mode only guarantees syntactically valid JSON in the reply. A tool definition tells the model which actions exist and the exact arguments each takes, and the model decides when to call one.",
      },
    ],
  },

  "clean-prompt-strip": {
    intro:
      "Paste text you are about to give an AI model, such as a scraped web page, a log file, documentation or source code, and this tool removes what wastes tokens or should not leave your hands: HTML tags, code comments, Markdown formatting and runs of blank lines. It can also mask email addresses, phone numbers, IPv4 addresses, card-number patterns and AWS access key IDs with placeholders like [EMAIL_REDACTED]. Each step is a switch, a counter shows the characters and estimated tokens saved, and everything runs in the browser, so the unredacted text never leaves your device.",
    howTo: {
      title: "How to clean and redact text for an AI model",
      steps: [
        "Paste your text, or load a sample: a scraped HTML page, heavily commented code, or Markdown with personal data.",
        "Switch the steps on or off: Strip HTML / XML Tags, Mask PII & Secrets, Strip Code Comments, Strip Markdown Syntax and Collapse Blank Lines.",
        "Compare input and output side by side, and read the tokens saved and the size reduction.",
        "Read through the output, then copy it.",
      ],
    },
    useCases: [
      {
        title: "Sharing logs with an AI assistant",
        body:
          "Application logs routinely contain customer email addresses, IP addresses and phone numbers. Masking them before pasting into a chat or an API call keeps that data out of the provider's systems while leaving the shape of the error intact, so the model can still help diagnose it.",
      },
      {
        title: "Cleaning scraped pages for retrieval (RAG)",
        body:
          "HTML scraped from documentation is mostly tags and attributes. Stripping them and collapsing blank lines before splitting text into chunks for embedding means each chunk carries more real content, and the index costs less to build and store.",
      },
      {
        title: "Fitting code into a context window",
        body:
          "Licence headers, commented-out code and long doc comments can be a large share of a source file. Removing them before asking for a review or refactor leaves more room for the code itself; keep comments that explain intent the model needs to understand.",
      },
    ],
    tips: [
      "Redaction is pattern-based. It catches common email formats; phone numbers written with a + country code, Indian mobile numbers and North American 10-digit numbers; IPv4 addresses; 16-digit card numbers; and AWS key IDs starting with AKIA. Names, street addresses, IPv6 addresses and most other secrets are not detected, so read the output before sending it.",
      "Long digit strings such as 11-digit order numbers can be masked as phone numbers. Over-masking is the safer mistake, but check that nothing you need was replaced.",
      "Comment stripping removes // comments and # comments that start a line or follow a space, so prose containing // or a line beginning with '# ' loses text too. Switch it off for plain prose. Shebang lines (#!) are kept.",
      "With Strip Markdown on, headings keep their text and only the # markers go; underscores inside names like user_id are left alone.",
      "Tokens saved is an estimate (characters ÷ 4), good for comparing before and after.",
    ],
    extraFaqs: [
      {
        question: "Does stripping Markdown hurt the model's understanding?",
        answer:
          "For lookup and summarising, removing bold, links and bullet markers rarely matters. Tables and code blocks carry real structure, though, so leave Markdown in place when that structure is what the model needs.",
      },
      {
        question: "Is the redacted text safe to share?",
        answer:
          "Safer, not guaranteed safe. The patterns miss names, addresses and secrets in formats they do not know, and context can still identify a person. Treat masking as a first pass and read the result before it leaves your hands.",
      },
    ],
  },

  "tip-calculator": {
    intro:
      "Enter the bill, choose a tip percentage (10, 15, 18, 20 or 25%, or type your own) and the number of people, and this calculator shows the tip, the total and what each person pays. Three rounding modes match how groups actually settle up: exact to the cent, the total rounded up to a whole amount, or each person's share rounded up, with the tip adjusted to match. A copy button produces a short summary to paste into a group chat, and symbols for dollars, rupees, euros, pounds and yen are built in.",
    howTo: {
      title: "How to calculate a tip and split the bill",
      steps: [
        "Choose the currency symbol and enter the bill amount.",
        "Pick a tip percentage or type a custom one.",
        "Enter how many people are splitting.",
        "Choose rounding: Exact Cent, Round Total Up or Round Per Person Up.",
        "Read the tip, the total and the amount per person, and copy the summary for your group chat.",
      ],
    },
    useCases: [
      {
        title: "Splitting a dinner evenly",
        body:
          "A $120 bill with an 18% tip is $141.60 in total, or $35.40 each for four people. Rounding per person up makes it $36 each: $144 in total and a $24 tip (20%), and nobody has to deal with coins or odd transfer amounts.",
      },
      {
        title: "When a service charge is already on the bill",
        body:
          "Restaurants in India and much of Europe often add a service charge, so check the bill before tipping on top. In India, the consumer protection authority's guidelines say a service charge cannot be added automatically and you can ask for it to be removed. In the US and Canada, 15–20% of the pre-tax amount is customary for table service.",
      },
      {
        title: "Any shared cost",
        body:
          "The same split works for a cab, groceries or a shared booking: set the tip to 0% and use the split and the rounding to work out each person's share.",
      },
    ],
    tips: [
      "The tip is calculated on the amount you enter. Enter the pre-tax subtotal if you tip before tax, which is the usual US convention, or the full total if you prefer to tip on that.",
      "Exact Cent splits can be a cent short overall: $100 split three ways is $33.33 each, which adds up to $99.99. Round Per Person Up avoids that by having everyone pay slightly more.",
      "Round Total Up rounds bill plus tip up to the next whole unit and adds the difference to the tip.",
      "The split is even. If people ordered very different amounts, work out each person's own subtotal and apply the tip percentage to each.",
    ],
    extraFaqs: [
      {
        question: "Is tip calculated before or after tax?",
        answer:
          "In the US the usual convention is to tip on the pre-tax subtotal of food and drinks; tipping on the total including tax is a little more generous and also common. Enter whichever amount you want the percentage applied to.",
      },
      {
        question: "What if people ordered different amounts?",
        answer:
          "This calculator splits evenly. For a fair split of an itemised bill, add up each person's items, apply the tip percentage to each subtotal, and share any common items such as starters evenly.",
      },
    ],
  },

  "fuel-cost-calc": {
    intro:
      "Work out how much fuel a trip will use and what it will cost: enter the distance, your vehicle's fuel efficiency and the fuel price, and the calculator gives the fuel needed, the total cost, the cost per kilometre or mile, and each passenger's share. It works in metric (km, litres, L/100km) or US units (miles, US gallons, MPG), has a round-trip switch so the return journey is not forgotten, and offers typical efficiency figures for a hybrid, sedan, SUV, truck or motorcycle if you don't know your own.",
    howTo: {
      title: "How to calculate fuel cost for a trip",
      steps: [
        "Choose Metric (km, L, L/100km) or Imperial (miles, gal, MPG).",
        "Enter the one-way distance, and switch on Round Trip if you are coming back.",
        "Enter your vehicle's efficiency, or pick a preset.",
        "Enter the fuel price per litre or per gallon.",
        "Set how many people are sharing, then read the total, the per-person cost and the fuel needed, or copy the summary.",
      ],
    },
    useCases: [
      {
        title: "Splitting a road trip",
        body:
          "A drive of 280 km each way is 560 km for the round trip. A car that does 15 km/L (6.67 L/100km) uses about 37.4 litres; at ₹95 a litre that is about ₹3,548, or ₹887 each for four people.",
      },
      {
        title: "What a commute costs",
        body:
          "A 25 km commute each way, five days a week, adds up to about 1,100 km a month. Knowing what that costs in fuel makes it easier to compare driving with a monthly transit pass, a carpool or the running cost of an electric vehicle.",
      },
      {
        title: "Checking a mileage allowance",
        body:
          "Many employers reimburse business travel per kilometre or mile. The cost per unit of distance shows what your car actually spends on fuel, which you can compare with the rate you are paid; remember the allowance is also meant to cover wear, servicing and insurance.",
      },
    ],
    tips: [
      "In India and some other markets, mileage is quoted in km/L. Convert it with L/100km = 100 ÷ (km/L): 15 km/L is 6.67 L/100km and 20 km/L is 5.",
      "MPG here means US gallons (3.785 L). UK figures use the imperial gallon (4.546 L), so a UK 40 mpg is about 33 US mpg; convert first, or switch to metric.",
      "To turn US MPG into L/100km, divide 235.2 by the MPG: 30 MPG is about 7.8 L/100km.",
      "Real-world consumption is usually worse than the official figure. The most accurate number is your own, measured from fill-ups.",
    ],
    extraFaqs: [
      {
        question: "How do I measure my car's real fuel efficiency?",
        answer:
          "Fill the tank, reset the trip meter and drive normally. At the next fill-up, litres added ÷ kilometres driven × 100 is your L/100km (or kilometres ÷ litres for km/L). Averaging two or three tanks smooths out differences in where the pump clicks off.",
      },
      {
        question: "Does the calculator include tolls or parking?",
        answer:
          "No, only fuel. Add tolls, parking and any other shared costs to the total separately before you split it.",
      },
    ],
  },

  "work-hours-calc": {
    intro:
      "Turn clock-in and clock-out times into hours worked, minus unpaid breaks, in both hours and minutes and the decimal hours payroll systems ask for. The single-shift mode handles one shift; the weekly timesheet covers seven days, each with its own start, end and break, totals the week, splits regular and overtime hours at a weekly threshold you set, and works out gross pay at your hourly and overtime rates. Shifts that cross midnight are handled automatically, and the week can be exported as a CSV file.",
    howTo: {
      title: "How to calculate hours worked",
      steps: [
        "Choose Weekly Timesheet or Single Shift.",
        "Enter the start and end times and the unpaid break in minutes. An end time earlier than the start is treated as the next day.",
        "In the weekly view, switch days on or off, or press Fill 9-to-5 for Monday to Friday, 09:00–17:00 with a 30-minute break.",
        "Set your hourly rate, overtime rate and weekly overtime threshold (40 hours unless you change it).",
        "Read the total, regular and overtime hours and the gross pay, then copy the summary or export the CSV.",
      ],
    },
    useCases: [
      {
        title: "Filling in a timesheet",
        body:
          "Payroll and invoicing tools want decimal hours: 7 hours 45 minutes is 7.75, not 7.45. A shift from 08:30 to 17:00 with a 45-minute break comes to 7 h 45 m, which the calculator shows as 7.75 hours, ready to enter.",
      },
      {
        title: "Night shifts",
        body:
          "A shift from 22:00 to 06:30 with a 30-minute break is 8 hours worked. Because the end time is earlier than the start, the calculator counts it as finishing the next morning, so there is no negative result to correct by hand.",
      },
      {
        title: "Checking overtime on a payslip",
        body:
          "The default week (Monday to Thursday 09:00–17:30 and Friday 09:00–17:00, each with a 30-minute break) comes to 39.5 hours. Add a Saturday morning and the hours above 40 are paid at the overtime rate, which lets you check what the payslip should show.",
      },
    ],
    tips: [
      "Minutes to decimal hours: divide by 60. 15 minutes is 0.25, 20 minutes is 0.33, 30 minutes is 0.5 and 45 minutes is 0.75.",
      "Overtime here is weekly: hours above the threshold are paid at the overtime rate. Rules vary by place; California also counts daily overtime after 8 hours, and Indian factory law pays overtime at twice the ordinary rate. Set the rate and threshold to the rules that apply to you.",
      "If you leave the overtime rate empty, 1.5 times the hourly rate is used.",
      "Pay is shown with a $ sign, but the arithmetic works for any currency.",
      "Entries are not saved when you leave the page; export the CSV to keep a copy.",
    ],
    extraFaqs: [
      {
        question: "How is overtime pay calculated?",
        answer:
          "Hours above the weekly threshold are multiplied by the overtime rate and the rest by the regular rate. With 44 hours, a 40-hour threshold, $25 an hour and $37.50 overtime: 40 × 25 + 4 × 37.50 = $1,150.",
      },
      {
        question: "Should breaks be deducted?",
        answer:
          "Only unpaid ones. Whether a lunch or rest break is paid depends on your contract and local law; enter 0 minutes for any break that counts as working time.",
      },
    ],
  },
};
