"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, Terminal, Container, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/utils/download";
import {
  ToolSection,
  Field,
  TextArea,
  Chips,
  Notice,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const PRESETS = [
  {
    label: "Nginx Web Server",
    cmd: "docker run -d --name webserver -p 80:80 -p 443:443 -v /var/www:/usr/share/nginx/html:ro -v /etc/nginx/nginx.conf:/etc/nginx/nginx.conf:ro --restart unless-stopped nginx:alpine",
  },
  {
    label: "PostgreSQL Database",
    cmd: "docker run -d --name postgres-db -p 5432:5432 -e POSTGRES_DB=app_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret_password -v pgdata:/var/lib/postgresql/data --restart always postgres:16-alpine",
  },
  {
    label: "Redis Cache with Limits",
    cmd: "docker run -d --name redis-cache -p 6379:6379 -m 512m --cpus 1.5 --restart always redis:7-alpine redis-server --appendonly yes",
  },
  {
    label: "Full App with Environment & Networks",
    cmd: "docker run -d --name api-backend --network internal-net -p 3000:3000 -e NODE_ENV=production -e PORT=3000 --env-file .env.local -v ./logs:/app/logs --restart on-failure:5 node:20-alpine npm start",
  },
];

interface ParsedDockerRun {
  serviceName: string;
  /** Only set when --name was given; compose then pins the container name. */
  containerName?: string;
  image: string;
  /** Exec form, so quoted arguments (sh -c "a && b") survive intact. */
  command: string[];
  ports: string[];
  volumes: string[];
  environment: Record<string, string>;
  envFiles: string[];
  restart?: string;
  networks: string[];
  networkMode?: string;
  memory?: string;
  cpus?: string;
  privileged?: boolean;
  init?: boolean;
  readOnly?: boolean;
  workdir?: string;
  entrypoint?: string;
  user?: string;
  hostname?: string;
  capAdd: string[];
  extraHosts: string[];
  labels: string[];
  /** Flags this converter does not map, as typed, so they can be added by hand. */
  unsupported: string[];
}

/** docker run flags that take no value. Anything else unknown is assumed to take one. */
const BOOLEAN_FLAGS = new Set([
  "-d", "--detach", "-i", "--interactive", "-t", "--tty", "--rm", "--privileged",
  "--init", "--read-only", "-P", "--publish-all", "--no-healthcheck", "--oom-kill-disable",
]);

/** Values that select a network mode rather than name a network. */
function isNetworkMode(n: string): boolean {
  return n === "host" || n === "none" || n === "bridge" || n.startsWith("container:");
}

function parseDockerRun(cmd: string): ParsedDockerRun | null {
  if (!cmd.trim()) return null;

  // Normalize command: remove leading backslashes and collapse whitespace
  let clean = cmd.replace(/\\\s*\r?\n/g, " ").replace(/\s+/g, " ").trim();

  // Strip initial "docker run" if present
  clean = clean.replace(/^(sudo\s+)?docker\s+(container\s+)?run\s+/i, "");

  // Tokenize while respecting quotes
  const tokens: string[] = [];
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match;
  while ((match = regex.exec(clean)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[0]);
  }

  if (tokens.length === 0) return null;

  let name = "";
  let image = "";
  const commandArgs: string[] = [];
  const ports: string[] = [];
  const volumes: string[] = [];
  const environment: Record<string, string> = {};
  const envFiles: string[] = [];
  let restart = "";
  const networks: string[] = [];
  let networkMode = "";
  let memory = "";
  let cpus = "";
  let privileged = false;
  let init = false;
  let readOnly = false;
  let workdir = "";
  let entrypoint = "";
  let user = "";
  let hostname = "";
  const capAdd: string[] = [];
  const extraHosts: string[] = [];
  const labels: string[] = [];
  const unsupported: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    const raw = tokens[i];

    // Everything after the image is the container's command, flags included
    // (`nginx -g "daemon off;"`).
    if (image) {
      commandArgs.push(raw);
      i++;
      continue;
    }

    let flag = raw;
    let inlineVal: string | null = null;
    if (raw.startsWith("-") && raw.includes("=")) {
      const eqIdx = raw.indexOf("=");
      flag = raw.slice(0, eqIdx);
      inlineVal = raw.slice(eqIdx + 1);
    }

    const consumeValue = (): string => {
      if (inlineVal !== null) {
        i++;
        return inlineVal;
      }
      if (i + 1 < tokens.length) {
        i += 2;
        return tokens[i - 1];
      }
      i++;
      return "";
    };

    if (BOOLEAN_FLAGS.has(flag) || /^-[dit]{2,3}$/.test(flag)) {
      // -it, -dit, -itd ...
      if (flag === "--privileged") privileged = true;
      else if (flag === "--init") init = true;
      else if (flag === "--read-only") readOnly = true;
      else if (flag === "-P" || flag === "--publish-all" || flag === "--no-healthcheck" || flag === "--oom-kill-disable") {
        unsupported.push(flag);
      }
      i++;
    } else if (flag === "--name") {
      name = consumeValue();
    } else if (flag === "-p" || flag === "--publish") {
      const p = consumeValue();
      if (p) ports.push(p);
    } else if (flag === "-v" || flag === "--volume") {
      const v = consumeValue();
      if (v) volumes.push(v);
    } else if (flag === "-e" || flag === "--env") {
      const pair = consumeValue();
      const eqIdx = pair.indexOf("=");
      if (eqIdx !== -1) {
        environment[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
      } else if (pair) {
        environment[pair] = "";
      }
    } else if (flag === "--env-file") {
      const ef = consumeValue();
      if (ef) envFiles.push(ef);
    } else if (flag === "--restart") {
      restart = consumeValue();
    } else if (flag === "--net" || flag === "--network") {
      const n = consumeValue();
      if (n && isNetworkMode(n)) networkMode = n;
      else if (n) networks.push(n);
    } else if (flag === "-m" || flag === "--memory") {
      memory = consumeValue();
    } else if (flag === "--cpus") {
      cpus = consumeValue();
    } else if (flag === "-w" || flag === "--workdir") {
      workdir = consumeValue();
    } else if (flag === "--entrypoint") {
      entrypoint = consumeValue();
    } else if (flag === "-u" || flag === "--user") {
      user = consumeValue();
    } else if (flag === "-h" || flag === "--hostname") {
      hostname = consumeValue();
    } else if (flag === "--cap-add") {
      const c = consumeValue();
      if (c) capAdd.push(c);
    } else if (flag === "--add-host") {
      const h = consumeValue();
      if (h) extraHosts.push(h);
    } else if (flag === "-l" || flag === "--label") {
      const l = consumeValue();
      if (l) labels.push(l);
    } else if (!raw.startsWith("-")) {
      // First non-flag token is the image.
      image = raw;
      i++;
    } else {
      // An unmapped flag. Most docker run flags take a value, and skipping
      // only the flag would make its value look like the image name
      // ("--hostname web nginx" became image: web).
      const hadInline = inlineVal !== null;
      const takesNext = !hadInline && i + 1 < tokens.length && !tokens[i + 1].startsWith("-");
      const value = hadInline || takesNext ? consumeValue() : (i++, "");
      unsupported.push(value ? `${flag}${hadInline ? "=" : " "}${value}` : flag);
    }
  }

  if (!image) return null;

  const serviceName = (name || image.split("/").pop()!.split(":")[0] || "app")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();

  return {
    serviceName,
    containerName: name || undefined,
    image,
    command: commandArgs,
    ports,
    volumes,
    environment,
    envFiles,
    restart: restart || undefined,
    networks,
    networkMode: networkMode || undefined,
    memory: memory || undefined,
    cpus: cpus || undefined,
    privileged: privileged || undefined,
    init: init || undefined,
    readOnly: readOnly || undefined,
    workdir: workdir || undefined,
    entrypoint: entrypoint || undefined,
    user: user || undefined,
    hostname: hostname || undefined,
    capAdd,
    extraHosts,
    labels,
    unsupported,
  };
}

/** A YAML double-quoted scalar. JSON string syntax is valid YAML. */
const q = (v: string) => JSON.stringify(v);

function generateComposeYaml(parsed: ParsedDockerRun): string {
  const lines: string[] = ["services:"];
  const indent = "  ";
  const sIndent = "    ";
  const pIndent = "      ";

  const list = (key: string, items: string[]) => {
    if (items.length === 0) return;
    lines.push(`${sIndent}${key}:`);
    for (const item of items) lines.push(`${pIndent}- ${q(item)}`);
  };

  lines.push(`${indent}${parsed.serviceName}:`);
  lines.push(`${sIndent}image: ${parsed.image}`);
  if (parsed.containerName) lines.push(`${sIndent}container_name: ${q(parsed.containerName)}`);
  if (parsed.hostname) lines.push(`${sIndent}hostname: ${q(parsed.hostname)}`);
  if (parsed.restart) lines.push(`${sIndent}restart: ${parsed.restart}`);
  if (parsed.privileged) lines.push(`${sIndent}privileged: true`);
  if (parsed.init) lines.push(`${sIndent}init: true`);
  if (parsed.readOnly) lines.push(`${sIndent}read_only: true`);
  if (parsed.entrypoint) lines.push(`${sIndent}entrypoint: ${q(parsed.entrypoint)}`);
  if (parsed.command.length > 0) lines.push(`${sIndent}command: [${parsed.command.map(q).join(", ")}]`);
  if (parsed.workdir) lines.push(`${sIndent}working_dir: ${q(parsed.workdir)}`);
  if (parsed.user) lines.push(`${sIndent}user: ${q(parsed.user)}`);
  if (parsed.networkMode) lines.push(`${sIndent}network_mode: ${q(parsed.networkMode)}`);

  list("ports", parsed.ports);
  list("volumes", parsed.volumes);
  list("env_file", parsed.envFiles);

  if (Object.keys(parsed.environment).length > 0) {
    lines.push(`${sIndent}environment:`);
    for (const [k, v] of Object.entries(parsed.environment)) {
      lines.push(`${pIndent}${k}: ${q(v)}`);
    }
  }

  list("cap_add", parsed.capAdd);
  list("extra_hosts", parsed.extraHosts);
  list("labels", parsed.labels);
  list("networks", parsed.networks);

  if (parsed.memory || parsed.cpus) {
    lines.push(`${sIndent}deploy:`);
    lines.push(`${pIndent}resources:`);
    lines.push(`${pIndent}  limits:`);
    if (parsed.cpus) lines.push(`${pIndent}    cpus: "${parsed.cpus}"`);
    if (parsed.memory) lines.push(`${pIndent}    memory: ${parsed.memory}`);
  }

  if (parsed.networks.length > 0) {
    lines.push("");
    lines.push("networks:");
    for (const n of parsed.networks) {
      lines.push(`${indent}${n}:`);
      lines.push(`${sIndent}external: true`);
    }
  }

  // Volume declaration for named volumes
  const namedVolumes = parsed.volumes
    .filter((v) => v.includes(":"))
    .map((v) => v.split(":")[0])
    .filter((v) => !v.startsWith(".") && !v.startsWith("/") && !v.startsWith("~"));

  if (namedVolumes.length > 0) {
    lines.push("");
    lines.push("volumes:");
    for (const nv of Array.from(new Set(namedVolumes))) {
      lines.push(`${indent}${nv}:`);
    }
  }

  return lines.join("\n");
}

export default function DockerRunToCompose() {
  const [cliInput, setCliInput] = useState(PRESETS[0].cmd);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseDockerRun(cliInput), [cliInput]);
  const composeYaml = useMemo(() => (parsed ? generateComposeYaml(parsed) : ""), [parsed]);

  const copyResult = () => {
    if (!composeYaml) return;
    navigator.clipboard.writeText(composeYaml);
    setCopied(true);
    toast.success("docker-compose.yml copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!composeYaml) return;
    const blob = new Blob([composeYaml], { type: "text/yaml;charset=utf-8" });
    downloadBlob(blob, "docker-compose.yml");
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="Docker Run CLI to Docker Compose Converter"
        description="Convert single or multi-line 'docker run' terminal commands into standard docker-compose.yml files."
      >
        <Chips
          value={null}
          onChange={(val) => {
            const p = PRESETS.find((x) => x.label === val);
            if (p) setCliInput(p.cmd);
          }}
          options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
          ariaLabel="Docker Run Presets"
        />

        <Field label="Docker Run Command" hint="Maps -p, -v, -e, --env-file, --name, --restart, --network, -m, --cpus, -w, -u, -h, --cap-add, --add-host, -l and more">
          <TextArea
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            placeholder="docker run -d --name my-app -p 8080:80 nginx:alpine"
            className="font-mono text-xs leading-relaxed min-h-28"
            aria-label="Docker Run Command"
          />
        </Field>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Generated docker-compose.yml">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compose Specification
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={copyResult}
                disabled={!composeYaml}
                className="h-7 text-xs"
              >
                {copied ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                Copy YAML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFile}
                disabled={!composeYaml}
                className="h-7 text-xs"
              >
                <Download className="size-3 mr-1" /> Download
              </Button>
            </div>
          </div>
          <TextArea
            value={composeYaml}
            readOnly
            placeholder="docker-compose.yml output will appear here..."
            className="font-mono text-xs leading-relaxed min-h-80 bg-muted/30"
            aria-label="Generated Compose YAML"
          />
        </div>
        {parsed && parsed.unsupported.length > 0 && (
          <Notice tone="warning">
            Not converted, add by hand if you need them: {parsed.unsupported.join(", ")}
          </Notice>
        )}
        {cliInput.trim() && !parsed && (
          <Notice tone="error">No image found. A docker run command needs an image name, such as nginx:alpine.</Notice>
        )}
      </ToolSection>
    </div>
  );
}
