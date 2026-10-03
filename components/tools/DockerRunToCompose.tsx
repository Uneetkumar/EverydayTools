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
  image: string;
  command?: string;
  ports: string[];
  volumes: string[];
  environment: Record<string, string>;
  envFiles: string[];
  restart?: string;
  networks: string[];
  memory?: string;
  cpus?: string;
  privileged?: boolean;
  workdir?: string;
  entrypoint?: string;
  user?: string;
}

function parseDockerRun(cmd: string): ParsedDockerRun | null {
  if (!cmd.trim()) return null;

  // Normalize command: remove leading backslashes and collapse whitespace
  let clean = cmd.replace(/\\\s*\r?\n/g, " ").replace(/\s+/g, " ").trim();

  // Strip initial "docker run" if present
  clean = clean.replace(/^(sudo\s+)?docker\s+run\s+/i, "");

  // Tokenize while respecting quotes
  const tokens: string[] = [];
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match;
  while ((match = regex.exec(clean)) !== null) {
    tokens.push(match[1] || match[2] || match[0]);
  }

  if (tokens.length === 0) return null;

  let serviceName = "app";
  let image = "";
  const commandArgs: string[] = [];
  const ports: string[] = [];
  const volumes: string[] = [];
  const environment: Record<string, string> = {};
  const envFiles: string[] = [];
  let restart = "";
  const networks: string[] = [];
  let memory = "";
  let cpus = "";
  let privileged = false;
  let workdir = "";
  let entrypoint = "";
  let user = "";

  let i = 0;
  while (i < tokens.length) {
    const raw = tokens[i];
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

    if (flag === "-d" || flag === "--detach" || flag === "-i" || flag === "-t" || flag === "-it" || flag === "--rm") {
      i++;
    } else if (flag === "--privileged") {
      privileged = true;
      i++;
    } else if (flag === "--name") {
      serviceName = consumeValue();
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
      if (n) networks.push(n);
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
    } else if (!raw.startsWith("-") && !image) {
      // First non-flag token is the image!
      image = raw;
      i++;
    } else if (image) {
      // Tokens after image are container command arguments
      commandArgs.push(raw);
      i++;
    } else {
      // Unknown flag, skip
      i++;
    }
  }

  if (!image) return null;

  return {
    serviceName: serviceName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase(),
    image,
    command: commandArgs.length > 0 ? commandArgs.join(" ") : undefined,
    ports,
    volumes,
    environment,
    envFiles,
    restart: restart || undefined,
    networks,
    memory: memory || undefined,
    cpus: cpus || undefined,
    privileged: privileged || undefined,
    workdir: workdir || undefined,
    entrypoint: entrypoint || undefined,
    user: user || undefined,
  };
}

function generateComposeYaml(parsed: ParsedDockerRun): string {
  const lines: string[] = ["services:"];
  const indent = "  ";
  const sIndent = "    ";
  const pIndent = "      ";

  lines.push(`${indent}${parsed.serviceName}:`);
  lines.push(`${sIndent}image: ${parsed.image}`);
  lines.push(`${sIndent}container_name: ${parsed.serviceName}`);

  if (parsed.restart) {
    lines.push(`${sIndent}restart: ${parsed.restart}`);
  }

  if (parsed.privileged) {
    lines.push(`${sIndent}privileged: true`);
  }

  if (parsed.entrypoint) {
    lines.push(`${sIndent}entrypoint: ${parsed.entrypoint}`);
  }

  if (parsed.command) {
    lines.push(`${sIndent}command: ${parsed.command}`);
  }

  if (parsed.workdir) {
    lines.push(`${sIndent}working_dir: ${parsed.workdir}`);
  }

  if (parsed.user) {
    lines.push(`${sIndent}user: "${parsed.user}"`);
  }

  if (parsed.ports.length > 0) {
    lines.push(`${sIndent}ports:`);
    for (const p of parsed.ports) {
      lines.push(`${pIndent}- "${p}"`);
    }
  }

  if (parsed.volumes.length > 0) {
    lines.push(`${sIndent}volumes:`);
    for (const v of parsed.volumes) {
      lines.push(`${pIndent}- ${v}`);
    }
  }

  if (parsed.envFiles.length > 0) {
    lines.push(`${sIndent}env_file:`);
    for (const ef of parsed.envFiles) {
      lines.push(`${pIndent}- ${ef}`);
    }
  }

  if (Object.keys(parsed.environment).length > 0) {
    lines.push(`${sIndent}environment:`);
    for (const [k, v] of Object.entries(parsed.environment)) {
      lines.push(`${pIndent}${k}: "${v}"`);
    }
  }

  if (parsed.networks.length > 0) {
    lines.push(`${sIndent}networks:`);
    for (const n of parsed.networks) {
      lines.push(`${pIndent}- ${n}`);
    }
  }

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

        <Field label="Docker Run Command" hint="Supports flags: -p, -v, -e, --restart, -d, --network, -m, --cpus">
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
              Compose Specification (v3)
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
      </ToolSection>
    </div>
  );
}
