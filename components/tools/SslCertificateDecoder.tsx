"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Copy, Check, ShieldCheck, AlertTriangle, Calendar, Key, Globe, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextArea,
  StatGrid,
  Stat,
  Chips,
  Notice,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const OID_MAP: Record<string, string> = {
  "2.5.4.3": "Common Name (CN)",
  "2.5.4.6": "Country (C)",
  "2.5.4.7": "Locality (L)",
  "2.5.4.8": "State or Province (ST)",
  "2.5.4.10": "Organization (O)",
  "2.5.4.11": "Organizational Unit (OU)",
  "2.5.4.9": "Street Address",
  "2.5.4.5": "Serial Number",
  "1.2.840.113549.1.1.1": "RSA Encryption",
  "1.2.840.113549.1.1.11": "SHA-256 with RSA Encryption",
  "1.2.840.113549.1.1.12": "SHA-384 with RSA Encryption",
  "1.2.840.113549.1.1.13": "SHA-512 with RSA Encryption",
  "1.2.840.10045.2.1": "Elliptic Curve Public Key (ECC)",
  "1.2.840.10045.3.1.7": "secp256r1 / NIST P-256",
  "1.2.840.10045.4.3.2": "ECDSA with SHA-256",
  "2.5.29.17": "Subject Alternative Name (SAN)",
  "2.5.29.19": "Basic Constraints",
  "2.5.29.15": "Key Usage",
  "2.5.29.37": "Extended Key Usage",
};

interface Asn1Node {
  tag: number;
  length: number;
  headerLen: number;
  dataOffset: number;
  bytes: Uint8Array;
}

function parseDerNodes(bytes: Uint8Array, offset = 0, limit?: number): Asn1Node[] {
  const max = limit !== undefined ? limit : bytes.length;
  const nodes: Asn1Node[] = [];
  let curr = offset;

  while (curr < max) {
    const tag = bytes[curr];
    curr++;
    if (curr >= max) break;

    let length = bytes[curr];
    curr++;
    let headerLen = 2;

    if (length & 0x80) {
      const numBytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < numBytes; i++) {
        if (curr >= max) break;
        length = (length << 8) | bytes[curr];
        curr++;
      }
      headerLen = 2 + numBytes;
    }

    const dataOffset = curr;
    nodes.push({
      tag,
      length,
      headerLen,
      dataOffset,
      bytes: bytes.subarray(dataOffset, Math.min(dataOffset + length, bytes.length)),
    });

    curr = dataOffset + length;
  }
  return nodes;
}

function parseOid(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const first = bytes[0];
  const parts = [Math.floor(first / 40), first % 40];
  let val = 0;
  for (let i = 1; i < bytes.length; i++) {
    const b = bytes[i];
    val = (val << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) {
      parts.push(val);
      val = 0;
    }
  }
  return parts.join(".");
}

function parseAsn1Time(bytes: Uint8Array, tag: number): Date | null {
  try {
    const str = new TextDecoder().decode(bytes);
    if (tag === 0x17) {
      // UTCTime: YYMMDDHHMMSSZ
      const yearPrefix = parseInt(str.slice(0, 2), 10) >= 50 ? "19" : "20";
      const fullYear = `${yearPrefix}${str.slice(0, 2)}`;
      const iso = `${fullYear}-${str.slice(2, 4)}-${str.slice(4, 6)}T${str.slice(6, 8)}:${str.slice(8, 10)}:${str.slice(10, 12)}Z`;
      return new Date(iso);
    } else if (tag === 0x18) {
      // GeneralizedTime: YYYYMMDDHHMMSSZ
      const iso = `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}T${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)}Z`;
      return new Date(iso);
    }
    return null;
  } catch {
    return null;
  }
}

// Sample certificates
const SAMPLE_CERTS = [
  {
    label: "Cloudflare Wildcard Cert",
    pem: `-----BEGIN CERTIFICATE-----
MIIF4zCCBMugAwIBAgIRAP2H5W1F86R9fV1Lq3K0P4swDQYJKoZIhvcNAQELBQAw
VzELMAkGA1UEBhMCVVMxGDAWBgNVBAoTD0Nsb3VkZmxhcmUsIEluYy4xKDAmBgNV
BAMTH0Nsb3VkZmxhcmUgSW5jIEVDQyBDQS0zIENBIDAxMB4XDTI0MDExMDAwMDAw
MFoXDTI1MDExMDIzNTk1OVowGzEZMBcGA1UEAwwQKi5jbG91ZGZsYXJlLmNvbTBZ
MBMGByqGSM49AgEGCCqGSM49AwEHA0IABCRr1yD25o6/F71oD9jR7aA41r+51v6L
t3Q4eWj1qY4o1v0s1b62w3b1r5e8t2q4v6b8t9v0u1w2e3r4t5y6u7ujggKyMIIC
rjAMBgNVHRMBAf8EAjAAMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjA+
BgNVHSAENzA1MDMGBmeBDAECAjApMCcGCCsGAQUFBwIBFhtodHRwczovL3d3dy5j
bG91ZGZsYXJlLmNvbS8wOgYDVR0fBDMwMTAvoC2gK4YpaHR0cDovL2NybDMuZGln
aWNlcnQuY29tL0Nsb3VkZmxhcmVJbmNFQ0NDQS0zLmNybDB4BggrBgEFBQcBAQRs
MGowJAYIKwYBBQUHMAGGGGh0dHA6Ly9vY3NwLmRpZ2ljZXJ0LmNvbTBCAggrBgEF
BQcwAoY2aHR0cDovL2NhY2VydHMuZGlnaWNlcnQuY29tL0Nsb3VkZmxhcmVJbmNF
Q0NDQS0zQ0EwMS5jcnQwHwYDVR0jBBgwFoAU+1T3x9e1jNqZgXyW7O4Z3H3v6c4w
EQYDVR0RBAowCIIOKi5jbG91ZGZsYXJlLmNvbTAHQgYDVR0OBB4EHDEaMBYGA1UE
AwwPKi5jbG91ZGZsYXJlLmNvbTANBgkqhkiG9w0BAQsFAAOCAQEAO8e1J2K3L4M5
N6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7
U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9
-----END CERTIFICATE-----`,
  },
  {
    label: "Let's Encrypt Authority",
    pem: `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8S5JbCd88EDpFyHM5xubUHgWDTWhlQ21+QDWMbChpyTirOLYjq9udJ604
tYyZZyEja0TTOhguP305oCDKPTyQCxiLUSdDDapKEWoCHCeOPuBI4ZGqiafOMYmM
-----END CERTIFICATE-----`,
  },
  {
    label: "PKCS#10 CSR (Certificate Request)",
    pem: `-----BEGIN CERTIFICATE REQUEST-----
MIICgTCCAWkCAQAwPDEaMBgGA1UEAwwRdGVzdC50YWJiZW5jaC5jb20xETAPBgNV
BAoMCFRhYkJlbmNoMQswCQYDVQQGEwJVUzCCASIwDQYJKoZIhvcNAQEBBQADggEP
ADCCAQoCggEBALIldV/qUiAWx6PTHX49Nl3hwK/ZLs1OCKo5YtRmglLSGaI/EpqZ
3yRzQ7GsgJaIf26GqHzo0g4gFqFTcZrfg77bGWtU4S9MWE0pHH7L+KKTTjKIyiy9
mdBtqsAE+CJZfTPBcU8Bk8poPIaJHnBoeBcTdY8VmewWp5C5qVTLd5LA8uvNPgPG
YM4+Jcyrq1H/0QUTxUSwL/llZlC4Xapv8XrEm8XUK/MF89r1cckt0XWoeEWphOCY
6sw7mqCcBA/xWT1V1jGMmmE1YxA7VaTbbBsHUmTv4eTIOClKrdmO7c/+yvrUIyU/
W839mK8efaz2kwfcckAhBFlNc/Z8O3gWoe0CAwEAAaAAMA0GCSqGSIb3DQEBCwUA
A4IBAQAiM01Qe0SfhI5OCAE6t/Fe9j3b1FEBk9aQT+ZTqOImkmOvYQ+9cugQEuka
TykYbyN1Ov7HQ0NonFnDFHxFzJPFtpgwA28XgL1ZQEdcHMt7lMja3dVA89HbfsXZ
2MHk6I9MP3FuHZSZ4EUxYemG48ai/L8KePKmCy09LVPcVirZ9xpo60pLCxHHIKly
T0Z5oQget2qxpKxSn7HsBJacpaIo3168jnu6JKgJb1/XTm+koJja0iD1wgrSZh0b
QmZGqPd/An7EG0p1BAuhQoaOFS3AwZkKMjKYmKOj77FMbs/6GYzLqGWi4pCm8L0Q
+XH5HjDZOKumYnAHPlPzEmzrW/T4
-----END CERTIFICATE REQUEST-----`,
  },
];

interface DecodedCert {
  isCsr: boolean;
  subject: Record<string, string>;
  issuer: Record<string, string>;
  notBefore: Date | null;
  notAfter: Date | null;
  serialNumber: string;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  sans: string[];
  daysRemaining: number | null;
  isExpired: boolean;
  sha256Fingerprint: string;
}

export default function SslCertificateDecoder() {
  const [pem, setPem] = useState(SAMPLE_CERTS[0].pem);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedCert | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    let cancelled = false;

    async function decodeCert() {
      try {
        const isCsr = /CERTIFICATE REQUEST/i.test(pem);
        const cleaned = pem.replace(/-----(BEGIN|END) [A-Z0-9 ]+-----/g, "").replace(/\s+/g, "");
        if (!cleaned) {
          setDecoded(null);
          setErrorMsg(null);
          return;
        }

        const rawBinary = atob(cleaned);
        const bytes = new Uint8Array(rawBinary.length);
        for (let i = 0; i < rawBinary.length; i++) {
          bytes[i] = rawBinary.charCodeAt(i);
        }

        // SHA-256 fingerprint
        const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const sha256Fingerprint = hashArray
          .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
          .join(":");

        // Parse Outer Sequence
        const rootNodes = parseDerNodes(bytes);
        if (rootNodes.length === 0 || rootNodes[0].tag !== 0x30) {
          throw new Error("Invalid ASN.1 structure: missing outer SEQUENCE.");
        }

        const outerSeq = parseDerNodes(rootNodes[0].bytes);
        if (outerSeq.length < 2) {
          throw new Error("Incomplete ASN.1 structure.");
        }

        if (isCsr) {
          // PKCS#10 Certificate Signing Request
          const certInfo = outerSeq[0];
          const infoNodes = parseDerNodes(certInfo.bytes);
          if (infoNodes.length < 3) {
            throw new Error("Invalid CSR structure: missing Subject or Public Key.");
          }

          // infoNodes[0] = version
          // infoNodes[1] = Subject DN
          const subject = parseDistinguishedName(infoNodes[1].bytes);

          // infoNodes[2] = SubjectPublicKeyInfo
          const spkiNodes = parseDerNodes(infoNodes[2].bytes);
          const pkAlgNode = spkiNodes[0] ? parseDerNodes(spkiNodes[0].bytes) : [];
          const pkOid = pkAlgNode[0] ? parseOid(pkAlgNode[0].bytes) : "";
          const publicKeyAlgorithm = OID_MAP[pkOid] || pkOid || "RSA Public Key";

          // outerSeq[1] = signatureAlgorithm
          const sigAlgNodes = parseDerNodes(outerSeq[1].bytes);
          const sigOid = sigAlgNodes.length > 0 ? parseOid(sigAlgNodes[0].bytes) : "";
          const signatureAlgorithm = OID_MAP[sigOid] || sigOid || "SHA-256 with RSA";

          // Attributes (optional, tag 0xa0)
          const sans: string[] = [];
          if (infoNodes[3] && infoNodes[3].tag === 0xa0) {
            extractSans(infoNodes[3].bytes, sans);
          }
          if (sans.length === 0 && subject["Common Name (CN)"]) {
            sans.push(subject["Common Name (CN)"]);
          }

          if (!cancelled) {
            setDecoded({
              isCsr: true,
              subject,
              issuer: { "Document Type": "PKCS#10 Certificate Signing Request (Pre-issuance)" },
              notBefore: null,
              notAfter: null,
              serialNumber: "Assigned by CA upon issuance",
              signatureAlgorithm,
              publicKeyAlgorithm,
              sans,
              daysRemaining: null,
              isExpired: false,
              sha256Fingerprint,
            });
            setErrorMsg(null);
          }
          return;
        }

        // Standard X.509 Certificate
        if (outerSeq.length < 3) {
          throw new Error("Incomplete X.509 Certificate structure.");
        }

        const tbsCert = outerSeq[0];
        const tbsNodes = parseDerNodes(tbsCert.bytes);

        // Optional version: tag 0xa0
        let nodeIdx = 0;
        if (tbsNodes[nodeIdx] && tbsNodes[nodeIdx].tag === 0xa0) {
          nodeIdx++;
        }

        // Serial Number
        const serialNode = tbsNodes[nodeIdx++];
        const serialNumber = Array.from(serialNode.bytes)
          .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
          .join(":");

        // Signature Algorithm Identifier
        const sigAlgNode = tbsNodes[nodeIdx++];
        const sigAlgNodes = parseDerNodes(sigAlgNode.bytes);
        const sigOid = sigAlgNodes.length > 0 ? parseOid(sigAlgNodes[0].bytes) : "";
        const signatureAlgorithm = OID_MAP[sigOid] || sigOid || "SHA-256 with RSA";

        // Issuer Name
        const issuerNode = tbsNodes[nodeIdx++];
        const issuer = parseDistinguishedName(issuerNode.bytes);

        // Validity Sequence [notBefore, notAfter]
        const validityNode = tbsNodes[nodeIdx++];
        const validityTimes = parseDerNodes(validityNode.bytes);
        const notBefore = validityTimes[0] ? parseAsn1Time(validityTimes[0].bytes, validityTimes[0].tag) : null;
        const notAfter = validityTimes[1] ? parseAsn1Time(validityTimes[1].bytes, validityTimes[1].tag) : null;

        // Subject Name
        const subjectNode = tbsNodes[nodeIdx++];
        const subject = parseDistinguishedName(subjectNode.bytes);

        // Subject Public Key Info
        const spkiNode = tbsNodes[nodeIdx++];
        const spkiNodes = parseDerNodes(spkiNode.bytes);
        const pkAlgNode = spkiNodes[0] ? parseDerNodes(spkiNodes[0].bytes) : [];
        const pkOid = pkAlgNode[0] ? parseOid(pkAlgNode[0].bytes) : "";
        const publicKeyAlgorithm = OID_MAP[pkOid] || pkOid || "RSA Public Key";

        // SANs from Extensions (tag 0xa3)
        const sans: string[] = [];
        for (let i = nodeIdx; i < tbsNodes.length; i++) {
          if (tbsNodes[i].tag === 0xa3) {
            extractSans(tbsNodes[i].bytes, sans);
          }
        }
        if (sans.length === 0 && subject["Common Name (CN)"]) {
          sans.push(subject["Common Name (CN)"]);
        }

        // Days remaining calculation
        let daysRemaining: number | null = null;
        let isExpired = false;
        if (notAfter) {
          const diffMs = notAfter.getTime() - Date.now();
          daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          isExpired = daysRemaining < 0;
        }

        if (!cancelled) {
          setDecoded({
            isCsr: false,
            subject,
            issuer,
            notBefore,
            notAfter,
            serialNumber,
            signatureAlgorithm,
            publicKeyAlgorithm,
            sans,
            daysRemaining,
            isExpired,
            sha256Fingerprint,
          });
          setErrorMsg(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setDecoded(null);
          setErrorMsg(err instanceof Error ? err.message : "Failed to decode certificate.");
        }
      }
    }

    decodeCert();
    return () => {
      cancelled = true;
    };
  }, [pem]);

  function parseDistinguishedName(bytes: Uint8Array): Record<string, string> {
    const res: Record<string, string> = {};
    const sets = parseDerNodes(bytes);
    for (const set of sets) {
      const seqs = parseDerNodes(set.bytes);
      for (const seq of seqs) {
        const parts = parseDerNodes(seq.bytes);
        if (parts.length >= 2) {
          const oid = parseOid(parts[0].bytes);
          const label = OID_MAP[oid] || oid;
          const val = new TextDecoder().decode(parts[1].bytes);
          res[label] = val;
        }
      }
    }
    return res;
  }

  function extractSans(bytes: Uint8Array, acc: string[]) {
    // Look for OID 2.5.29.17 in extension list
    const extSeqs = parseDerNodes(bytes);
    for (const ext of extSeqs) {
      const parts = parseDerNodes(ext.bytes);
      for (const p of parts) {
        const sub = parseDerNodes(p.bytes);
        for (const s of sub) {
          if (s.tag === 0x82) {
            // dNSName context tag [2]
            acc.push(new TextDecoder().decode(s.bytes));
          }
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <ToolSection
        title="X.509 Certificate or CSR (PEM)"
        description="Paste an SSL/TLS Certificate or CSR. Everything is parsed strictly inside your browser tab."
      >
        <Chips
          value={null}
          onChange={(val) => {
            const item = SAMPLE_CERTS.find((x) => x.label === val);
            if (item) setPem(item.pem);
          }}
          options={SAMPLE_CERTS.map((c) => ({ value: c.label, label: c.label }))}
          ariaLabel="Sample certificates"
        />

        <Field label="PEM Certificate Content" hint="Must include -----BEGIN CERTIFICATE-----">
          <TextArea
            value={pem}
            onChange={(e) => setPem(e.target.value)}
            className="font-mono text-xs leading-normal min-h-36"
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            aria-label="PEM Certificate Input"
          />
        </Field>
      </ToolSection>

      {decoded ? (
        <>
          <ToolDivider />

          <ToolSection title={decoded.isCsr ? "CSR Inspection Overview" : "Certificate Overview"}>
            <StatGrid>
              {decoded.isCsr ? (
                <Stat
                  label="Document Format"
                  value="PKCS#10 CSR"
                  tone="success"
                  hint="Ready for CA submission"
                />
              ) : (
                <Stat
                  label="Days Remaining"
                  value={
                    decoded.daysRemaining !== null
                      ? decoded.isExpired
                        ? "Expired"
                        : `${decoded.daysRemaining} days`
                      : "Unknown"
                  }
                  tone={decoded.isExpired ? "warning" : "success"}
                  hint={decoded.isExpired ? "Needs immediate renewal" : "Valid active certificate"}
                />
              )}
              <Stat
                label="Primary Domain (CN)"
                value={decoded.subject["Common Name (CN)"] || "N/A"}
                hint="Subject Common Name"
              />
              <Stat
                label="Public Key Type"
                value={decoded.publicKeyAlgorithm.split(" ")[0]}
                hint={decoded.publicKeyAlgorithm}
              />
              <Stat
                label={decoded.isCsr ? "Applicant Organization" : "Issuer Organization"}
                value={
                  decoded.isCsr
                    ? decoded.subject["Organization (O)"] || "Individual / Not specified"
                    : decoded.issuer["Organization (O)"] || decoded.issuer["Common Name (CN)"] || "Self-signed"
                }
              />
            </StatGrid>
          </ToolSection>

          {decoded.isCsr ? (
            <Notice tone="info">
              This is a Certificate Signing Request (CSR). Validity periods (Not Before / Not After) and certificate serial numbers are assigned by the Certificate Authority (CA) upon approval and issuance.
            </Notice>
          ) : (
            <ToolSection title="Validity Period">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-3 shadow-soft space-y-1">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" /> Valid From (Not Before)
                  </span>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {decoded.notBefore ? decoded.notBefore.toUTCString() : "Unknown"}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-3 shadow-soft space-y-1">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" /> Valid Until (Not After)
                  </span>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {decoded.notAfter ? decoded.notAfter.toUTCString() : "Unknown"}
                  </p>
                </div>
              </div>
            </ToolSection>
          )}

          <ToolSection title="Subject & Issuer Details">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Subject */}
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject (Issued To)
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(decoded.subject).length > 0 ? (
                    Object.entries(decoded.subject).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">{k}:</span>
                        <span className="font-semibold text-foreground">{v}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic">No distinguished attributes found</p>
                  )}
                </div>
              </div>

              {/* Issuer */}
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Issuer (Issued By)
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(decoded.issuer).length > 0 ? (
                    Object.entries(decoded.issuer).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">{k}:</span>
                        <span className="font-semibold text-foreground">{v}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic">Self-signed or root certificate</p>
                  )}
                </div>
              </div>
            </div>
          </ToolSection>

          {decoded.sans.length > 0 && (
            <ToolSection title="Subject Alternative Names (SANs)">
              <div className="flex flex-wrap gap-1.5">
                {decoded.sans.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2.5 py-1 font-mono text-xs text-foreground"
                  >
                    <Globe className="size-3 text-muted-foreground" /> {name}
                  </span>
                ))}
              </div>
            </ToolSection>
          )}

          <ToolSection title="Cryptographic Properties">
            <div className="space-y-3">
              {[
                { label: "SHA-256 Fingerprint", val: decoded.sha256Fingerprint, key: "sha256" },
                { label: "Serial Number", val: decoded.serialNumber, key: "serial" },
                { label: "Signature Algorithm", val: decoded.signatureAlgorithm, key: "sig" },
                { label: "Public Key Algorithm", val: decoded.publicKeyAlgorithm, key: "pk" },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-soft"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                    <p className="truncate font-mono text-xs font-semibold text-foreground">{row.val}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copyToClipboard(row.val, row.key)}
                    aria-label={`Copy ${row.label}`}
                  >
                    {copiedKey === row.key ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ToolSection>
        </>
      ) : errorMsg ? (
        <Notice tone="error">{errorMsg}</Notice>
      ) : null}
    </div>
  );
}
