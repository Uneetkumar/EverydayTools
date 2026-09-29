"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { ArrowRight, Copy, KeyRound, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Chips,
  Field,
  Notice,
  Segmented,
  SelectInput,
  Stat,
  StatGrid,
  TextArea,
  TextInput,
  ToggleRow,
  ToolDivider,
  ToolSection,
} from "@/components/tool/kit";
import { copyText } from "@/lib/utils/clipboard";
import {
  ALG_NAMES,
  CLAIMS,
  HEADER_FIELDS,
  SUPPORTED_ALGS,
  decodeJwt,
  duration,
  generateTestKeys,
  headerWarnings,
  isHmac,
  signJwt,
  timeState,
  verifyJwt,
  type Json,
  type VerifyResult,
} from "@/lib/jwt/jwt";
import { cn } from "@/lib/utils";

/** HS256, signed with the secret "tabbench-demo-secret". */
const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEwMjQiLCJuYW1lIjoiQWxleCBEb2UiLCJlbWFpbCI6ImFsZXhAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJlZGl0b3IiXSwiaXNzIjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tIiwiYXVkIjoiYXBpLmV4YW1wbGUuY29tIiwiaWF0IjoxNzY3MjI1NjAwLCJleHAiOjE5MjQ5OTIwMDB9.OgRdNSPzvHKzYA6xm-ziny_rEIWwo7Mi63gVyv4Kuno";
const SAMPLE_SECRET = "tabbench-demo-secret";

const EXPIRY = [
  { value: "900", label: "Expires in 15 min" },
  { value: "3600", label: "1 hour" },
  { value: "86400", label: "1 day" },
  { value: "2592000", label: "30 days" },
];

function relative(ms: number): string {
  return ms >= 0 ? `in ${duration(ms)}` : `${duration(ms)} ago`;
}

function useNow(): number | null {
  // Only in the browser: a time baked into the static page would be wrong.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const prime = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => document.visibilityState === "visible" && setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(prime);
      window.clearInterval(timer);
    };
  }, []);
  return now;
}

function JsonBlock({ title, value, onCopy }: { title: string; value: string; onCopy: () => void }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
        <Button variant="ghost" size="xs" onClick={onCopy}>
          <Copy aria-hidden="true" /> Copy
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/30 p-3.5 font-mono text-xs leading-relaxed text-foreground">{value}</pre>
    </div>
  );
}

function ClaimValue({ k, v, time, now, fmt }: { k: string; v: unknown; time?: boolean; now: number | null; fmt: Intl.DateTimeFormat }) {
  if (time && typeof v === "number" && Number.isFinite(v)) {
    const ms = v * 1000;
    return (
      <span>
        <span className="font-mono text-foreground">{v}</span>
        {now !== null && (
          <span className="block text-muted-foreground">
            {fmt.format(new Date(ms))} · {relative(ms - now)}
          </span>
        )}
      </span>
    );
  }
  if (Array.isArray(v) && v.every((x) => typeof x !== "object")) return <span className="font-mono text-foreground">{v.join(", ")}</span>;
  if (v && typeof v === "object") return <span className="font-mono break-all text-foreground">{JSON.stringify(v)}</span>;
  if ((k === "scope" || k === "scp") && typeof v === "string") {
    return (
      <span className="flex flex-wrap gap-1">
        {v.split(/\s+/).filter(Boolean).map((s) => (
          <span key={s} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {s}
          </span>
        ))}
      </span>
    );
  }
  return <span className="font-mono break-all text-foreground">{typeof v === "string" ? v : JSON.stringify(v)}</span>;
}

export default function JwtDecoder() {
  const id = useId();
  const now = useNow();
  const [mode, setMode] = useState<"decode" | "create">("decode");

  // Decode
  const [token, setToken] = useState("");
  const [key, setKey] = useState("");
  const [base64Secret, setBase64Secret] = useState(false);
  const [verify, setVerify] = useState<VerifyResult | null>(null);

  // Create
  const [alg, setAlg] = useState("HS256");
  const [kid, setKid] = useState("");
  const [payloadText, setPayloadText] = useState("");
  const [signKey, setSignKey] = useState("");
  const [signBase64, setSignBase64] = useState(false);
  const [publicPem, setPublicPem] = useState("");
  const [created, setCreated] = useState<{ token: string } | { error: string } | null>(null);

  const decoded = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);
  const jwt = decoded && "jwt" in decoded ? decoded.jwt : null;
  const tokenAlg = jwt ? String(jwt.header.alg ?? "") : "";
  const canVerify = !!jwt && jwt.kind === "jws" && SUPPORTED_ALGS.includes(tokenAlg);
  const hmac = isHmac(tokenAlg);

  const dateFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }), []);

  // Check the signature whenever the token or key changes.
  useEffect(() => {
    let live = true;
    if (!jwt || !canVerify || !key) {
      Promise.resolve().then(() => live && setVerify(null));
      return () => {
        live = false;
      };
    }
    const timer = window.setTimeout(() => {
      verifyJwt(jwt, key, { base64Secret }).then((r) => live && setVerify(r));
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [jwt, canVerify, key, base64Secret]);

  // Sign whenever the draft changes.
  useEffect(() => {
    if (mode !== "create") return;
    let live = true;
    const timer = window.setTimeout(async () => {
      let payload: Json;
      try {
        const p = JSON.parse(payloadText);
        if (!p || typeof p !== "object" || Array.isArray(p)) throw new Error();
        payload = p;
      } catch {
        if (live) setCreated({ error: "The payload must be a JSON object, like {\"sub\": \"123\"}." });
        return;
      }
      if (!signKey) {
        if (live) setCreated(null);
        return;
      }
      const header: Json = { alg, typ: "JWT", ...(kid.trim() ? { kid: kid.trim() } : {}) };
      try {
        const t = await signJwt(header, payload, signKey, { base64Secret: signBase64 });
        if (live) setCreated({ token: t });
      } catch (e) {
        if (live) setCreated({ error: e instanceof Error ? e.message : "The token couldn't be signed." });
      }
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [mode, alg, kid, payloadText, signKey, signBase64]);

  const startCreate = () => {
    setMode("create");
    if (!payloadText) {
      const t = Math.floor(Date.now() / 1000);
      setPayloadText(JSON.stringify({ sub: "user_1024", name: "Alex Doe", iat: t, exp: t + 3600 }, null, 2));
    }
  };

  const setExpiry = (seconds: string) => {
    try {
      const p = JSON.parse(payloadText || "{}");
      const t = Math.floor(Date.now() / 1000);
      setPayloadText(JSON.stringify({ ...p, iat: t, exp: t + Number(seconds) }, null, 2));
    } catch {
      toast.error("Fix the payload JSON first.");
    }
  };

  const changeAlg = (a: string) => {
    const wasHmac = isHmac(alg);
    setAlg(a);
    if (wasHmac !== isHmac(a) || (!isHmac(a) && a.slice(0, 2) !== alg.slice(0, 2))) {
      setSignKey("");
      setPublicPem("");
    }
  };

  const makeKeys = async () => {
    try {
      const k = await generateTestKeys(alg);
      setSignKey(k.privatePem);
      setPublicPem(k.publicPem);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : `This browser can't create ${alg} keys.`);
    }
  };

  const openInDecoder = () => {
    if (!created || !("token" in created)) return;
    setToken(created.token);
    setKey(isHmac(alg) ? signKey : publicPem);
    setBase64Secret(isHmac(alg) && signBase64);
    setMode("decode");
  };

  const ts = jwt && now !== null ? timeState(jwt.payload, now) : null;
  const iat = jwt?.payload && typeof jwt.payload.iat === "number" ? jwt.payload.iat : null;
  const exp = jwt?.payload && typeof jwt.payload.exp === "number" ? jwt.payload.exp : null;
  const warnings = jwt ? headerWarnings(jwt) : [];

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="What do you want to do?"
        value={mode}
        onChange={(m) => (m === "create" ? startCreate() : setMode("decode"))}
        options={[
          { value: "decode", label: "Decode and verify" },
          { value: "create", label: "Create a token" },
        ]}
      />

      {mode === "decode" ? (
        <>
          <ToolSection
            title="Token"
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setToken(SAMPLE);
                    setKey(SAMPLE_SECRET);
                    setBase64Secret(false);
                  }}
                >
                  Try a sample
                </Button>
                {token && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setToken("");
                      setKey("");
                    }}
                  >
                    <RotateCcw aria-hidden="true" /> Clear
                  </Button>
                )}
              </>
            }
          >
            <Field label="Encoded JWT" htmlFor={`${id}-token`} hint="A “Bearer ” prefix, quotes and line breaks are ignored.">
              <TextArea
                id={`${id}-token`}
                rows={4}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi…"
                spellCheck={false}
                autoComplete="off"
                aria-invalid={decoded && "error" in decoded ? true : undefined}
                className="font-mono break-all"
              />
            </Field>
            {decoded && "error" in decoded && <Notice tone="error">{decoded.error}</Notice>}
          </ToolSection>

          {jwt && (
            <>
              <ToolDivider />
              <StatGrid>
                <Stat label="Algorithm" value={tokenAlg || "—"} hint={ALG_NAMES[tokenAlg] ?? (jwt.kind === "jwe" ? "Encrypted" : undefined)} />
                <Stat
                  label="Status"
                  value={
                    !ts ? "…" : ts.state === "valid" ? "Valid" : ts.state === "expired" ? "Expired" : ts.state === "not-yet" ? "Not yet valid" : "No expiry"
                  }
                  tone={ts?.state === "valid" ? "success" : ts?.state === "expired" || ts?.state === "not-yet" ? "warning" : undefined}
                  hint={
                    !ts
                      ? undefined
                      : ts.state === "valid"
                        ? ts.expiresIn === null
                          ? "Never expires"
                          : `Expires ${relative(ts.expiresIn)}`
                        : ts.state === "expired"
                          ? `Expired ${duration(ts.ago)} ago`
                          : ts.state === "not-yet"
                            ? `Starts ${relative(ts.startsIn)}`
                            : jwt.kind === "jwe"
                              ? "Claims are encrypted"
                              : "No exp claim"
                  }
                />
                <Stat label="Issued" value={iat !== null && now !== null ? relative(iat * 1000 - now) : "—"} hint={iat !== null ? dateFmt.format(new Date(iat * 1000)) : undefined} />
                <Stat label="Lifetime" value={iat !== null && exp !== null ? duration((exp - iat) * 1000) : "—"} hint="From issued to expiry" />
              </StatGrid>
              <p className="text-xs text-muted-foreground">Expiry is checked against this device&apos;s clock. Servers usually allow a minute or two of difference.</p>

              {jwt.kind === "jwe" && (
                <Notice tone="info">
                  This is an encrypted token (JWE). Only the header can be read; the claims need the recipient&apos;s private key to decrypt.
                </Notice>
              )}
              {warnings.map((w) => (
                <Notice key={w} tone="warning">
                  {w}
                </Notice>
              ))}

              {jwt.payload && (
                <ToolSection title="Claims" description="What each value in the payload means.">
                  <dl className="divide-y rounded-lg border">
                    {Object.entries(jwt.payload).map(([k, v]) => {
                      const info = CLAIMS[k];
                      return (
                        <div key={k} className="grid gap-1 px-3.5 py-2.5 text-sm @md:grid-cols-[11rem_1fr] @md:gap-4">
                          <dt className="min-w-0">
                            <span className="font-mono text-xs text-muted-foreground">{k}</span>
                            <span className="block font-medium text-foreground">{info?.name ?? "Custom claim"}</span>
                          </dt>
                          <dd className="min-w-0 space-y-0.5">
                            <ClaimValue k={k} v={v} time={info?.time} now={now} fmt={dateFmt} />
                            {info?.help && <span className="block text-xs text-muted-foreground">{info.help}</span>}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </ToolSection>
              )}

              <div className="grid gap-4 @2xl:grid-cols-2">
                <JsonBlock
                  title="Header"
                  value={JSON.stringify(jwt.header, null, 2)}
                  onCopy={async () => {
                    if (await copyText(JSON.stringify(jwt.header, null, 2))) toast.success("Header copied");
                  }}
                />
                {jwt.kind === "jws" && (
                  <JsonBlock
                    title="Payload"
                    value={jwt.payload ? JSON.stringify(jwt.payload, null, 2) : jwt.payloadText}
                    onCopy={async () => {
                      if (await copyText(jwt.payload ? JSON.stringify(jwt.payload, null, 2) : jwt.payloadText)) toast.success("Payload copied");
                    }}
                  />
                )}
              </div>
              {Object.keys(jwt.header).some((k) => HEADER_FIELDS[k]) && (
                <p className="text-xs text-muted-foreground">
                  {Object.keys(jwt.header)
                    .filter((k) => HEADER_FIELDS[k])
                    .map((k) => `${k}: ${HEADER_FIELDS[k].name}`)
                    .join(" · ")}
                </p>
              )}

              {canVerify && (
                <ToolSection
                  title="Verify the signature"
                  description={
                    hmac
                      ? "Enter the secret the token was signed with. It stays on this page and isn't saved."
                      : "Paste the issuer's public key — a PEM block, a JWK, or their whole key set (JWKS)."
                  }
                >
                  {hmac ? (
                    <div className="space-y-4">
                      <Field label="Secret" htmlFor={`${id}-secret`}>
                        <TextInput
                          id={`${id}-secret`}
                          type="password"
                          autoComplete="off"
                          spellCheck={false}
                          value={key}
                          onChange={(e) => setKey(e.target.value)}
                          className="font-mono"
                        />
                      </Field>
                      <ToggleRow
                        id={`${id}-b64`}
                        label="Secret is Base64-encoded"
                        description="Some services show the secret in Base64; turn this on to use the bytes it stands for."
                        checked={base64Secret}
                        onCheckedChange={setBase64Secret}
                      />
                    </div>
                  ) : (
                    <Field label="Public key" htmlFor={`${id}-pub`}>
                      <TextArea
                        id={`${id}-pub`}
                        rows={5}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder={"-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----"}
                        spellCheck={false}
                        className="font-mono text-xs md:text-xs"
                      />
                    </Field>
                  )}
                  {verify?.ok && (
                    <Notice tone="success">Signature verified. This key signed the token, and nothing in it has changed since.</Notice>
                  )}
                  {verify && !verify.ok && verify.reason === "mismatch" && (
                    <Notice tone="error">Invalid signature. Either this isn&apos;t the key that signed it, or the token was changed after signing.</Notice>
                  )}
                  {verify && !verify.ok && verify.reason === "key" && <Notice tone="warning">{verify.message}</Notice>}
                </ToolSection>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <ToolSection title="Header">
            <div className="grid gap-4 @md:grid-cols-2">
              <Field label="Algorithm" htmlFor={`${id}-alg`} hint={ALG_NAMES[alg]}>
                <SelectInput id={`${id}-alg`} value={alg} onChange={(e) => changeAlg(e.target.value)}>
                  {SUPPORTED_ALGS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Key ID (kid)" htmlFor={`${id}-kid`} hint="Optional. Tells the receiver which key to check with.">
                <TextInput id={`${id}-kid`} value={kid} onChange={(e) => setKid(e.target.value)} spellCheck={false} autoComplete="off" />
              </Field>
            </div>
          </ToolSection>

          <ToolSection title="Payload">
            <Chips ariaLabel="Set the expiry" value={null} onChange={setExpiry} options={EXPIRY} />
            <Field label="Claims (JSON)" htmlFor={`${id}-payload`} hint="Times are in seconds since 1970. The buttons above set iat to now and exp after it.">
              <TextArea
                id={`${id}-payload`}
                rows={8}
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                spellCheck={false}
                className="font-mono text-sm"
              />
            </Field>
          </ToolSection>

          <ToolSection
            title={isHmac(alg) ? "Secret" : "Private key"}
            description="Use a test key. Don't paste a production signing key into any website."
            actions={
              !isHmac(alg) && (
                <Button variant="outline" size="sm" onClick={makeKeys}>
                  <KeyRound aria-hidden="true" /> Generate a test key pair
                </Button>
              )
            }
          >
            {isHmac(alg) ? (
              <div className="space-y-4">
                <Field label="Secret" htmlFor={`${id}-sign-secret`} hint="For HS256, use at least 32 random characters.">
                  <TextInput
                    id={`${id}-sign-secret`}
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={signKey}
                    onChange={(e) => setSignKey(e.target.value)}
                    className="font-mono"
                  />
                </Field>
                <ToggleRow id={`${id}-sign-b64`} label="Secret is Base64-encoded" checked={signBase64} onCheckedChange={setSignBase64} />
              </div>
            ) : (
              <>
                <Field label="Private key (PKCS#8 PEM or JWK)" htmlFor={`${id}-priv`}>
                  <TextArea
                    id={`${id}-priv`}
                    rows={5}
                    value={signKey}
                    onChange={(e) => {
                      setSignKey(e.target.value);
                      setPublicPem("");
                    }}
                    placeholder={"-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----"}
                    spellCheck={false}
                    className="font-mono text-xs md:text-xs"
                  />
                </Field>
                {publicPem && (
                  <JsonBlock
                    title="Matching public key — give this to whoever checks the token"
                    value={publicPem}
                    onCopy={async () => {
                      if (await copyText(publicPem)) toast.success("Public key copied");
                    }}
                  />
                )}
              </>
            )}
          </ToolSection>

          <ToolDivider />

          <ToolSection title="Signed token">
            {created && "error" in created ? (
              <Notice tone={signKey ? "error" : "info"}>{created.error}</Notice>
            ) : created ? (
              <>
                <p className="rounded-lg border bg-muted/30 p-3.5 font-mono text-xs break-all text-foreground">{created.token}</p>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={openInDecoder}>
                    Check it in the decoder <ArrowRight aria-hidden="true" />
                  </Button>
                  <Button
                    onClick={async () => {
                      if (await copyText(created.token)) toast.success("Token copied");
                    }}
                  >
                    <Copy aria-hidden="true" /> Copy token
                  </Button>
                </div>
              </>
            ) : (
              <p className={cn("text-sm text-muted-foreground")}>
                {isHmac(alg) ? "Enter a secret to sign the token." : "Paste a private key, or generate a test key pair."}
              </p>
            )}
          </ToolSection>
        </>
      )}
    </div>
  );
}
