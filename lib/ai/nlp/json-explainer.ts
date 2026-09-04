/**
 * Zero-Download Client-Side JSON Explainer.
 * Parses JSON deterministically using native AST traversal, analyzes data types,
 * schemas, nested hierarchies, potential anomalies, and provides plain-English summaries.
 */

export interface JsonFieldInfo {
  path: string;
  type: string;
  sampleValue: string;
  description: string;
  isOptional?: boolean;
}

export interface JsonExplanationResult {
  isValid: boolean;
  error?: string;
  rootType: "object" | "array" | "primitive";
  totalKeys: number;
  maxDepth: number;
  overview: string;
  fields: JsonFieldInfo[];
  insights: string[];
}

function inferFieldDescription(key: string, val: unknown): string {
  const k = key.toLowerCase();
  if (/^(id|_id|uuid|guid)$/.test(k)) return "Unique identifier";
  if (/email/.test(k)) return "Email address";
  if (/(time|date|created|updated|at|expires)/.test(k)) return "Timestamp / Date field";
  if (/(url|uri|link|href|src)/.test(k)) return "URL link or resource endpoint";
  if (/(name|title|label)/.test(k)) return "Human-readable label or name";
  if (/(count|total|quantity|qty|size|amount|price|cost|tax)/.test(k)) return "Numeric quantity or monetary metric";
  if (/(status|state|flag)/.test(k)) return "Status or lifecycle indicator";
  if (/(token|key|secret|auth)/.test(k)) return "Authentication token or credential";
  if (Array.isArray(val)) return `Array list containing ${val.length} items`;
  if (typeof val === "object" && val !== null) return "Nested object container";
  return `Value of type ${typeof val}`;
}

export function explainJsonLocally(rawJson: string): JsonExplanationResult {
  const trimmed = rawJson.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: "Please enter JSON data to explain.",
      rootType: "primitive",
      totalKeys: 0,
      maxDepth: 0,
      overview: "",
      fields: [],
      insights: [],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      isValid: false,
      error: `Syntax Error: ${err instanceof Error ? err.message : String(err)}`,
      rootType: "primitive",
      totalKeys: 0,
      maxDepth: 0,
      overview: "The input is not valid JSON. Check for missing quotes, trailing commas, or syntax errors.",
      fields: [],
      insights: ["Fix the syntax error to generate full structural explanations."],
    };
  }

  const fields: JsonFieldInfo[] = [];
  const insights: string[] = [];
  let keyCount = 0;
  let maxDepth = 0;

  function traverse(obj: unknown, path: string = "", depth: number = 1) {
    if (depth > maxDepth) maxDepth = depth;

    if (obj === null) {
      fields.push({
        path: path || "root",
        type: "null",
        sampleValue: "null",
        description: "Nullable empty value",
      });
      return;
    }

    if (Array.isArray(obj)) {
      if (depth === 1) {
        insights.push(`Root entity is a list of ${obj.length} records.`);
      }
      if (obj.length > 0) {
        traverse(obj[0], `${path}[0]`, depth + 1);
      }
      return;
    }

    if (typeof obj === "object") {
      const entries = Object.entries(obj as Record<string, unknown>);
      keyCount += entries.length;

      for (const [key, value] of entries) {
        const fieldPath = path ? `${path}.${key}` : key;
        const typeStr = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
        const sample =
          typeof value === "object"
            ? Array.isArray(value)
              ? `[...${value.length} items]`
              : "{...}"
            : String(value);

        fields.push({
          path: fieldPath,
          type: typeStr,
          sampleValue: sample.length > 40 ? sample.slice(0, 37) + "..." : sample,
          description: inferFieldDescription(key, value),
        });

        if (typeof value === "object" && value !== null && depth < 5) {
          traverse(value, fieldPath, depth + 1);
        }
      }
    }
  }

  const rootType = Array.isArray(parsed) ? "array" : typeof parsed === "object" && parsed !== null ? "object" : "primitive";
  traverse(parsed, "", 1);

  // Overview summary
  let overview = "";
  if (rootType === "object") {
    overview = `This JSON payload is a structured object containing ${keyCount} top/nested fields across a depth of ${maxDepth} level${maxDepth > 1 ? "s" : ""}.`;
  } else if (rootType === "array") {
    overview = `This JSON document represents an array dataset with ${(parsed as unknown[]).length} records.`;
  } else {
    overview = `This JSON payload contains a standalone primitive scalar value (${typeof parsed}).`;
  }

  // Generate Insights
  if (fields.some((f) => /token|secret|password|key/i.test(f.path))) {
    insights.push("Contains sensitive authentication fields (token/password/key). Ensure this payload is not exposed client-side in production.");
  }
  if (maxDepth > 4) {
    insights.push(`Deeply nested hierarchy (${maxDepth} levels). Consider flattening schema for lighter network payload transfer.`);
  }
  if (keyCount > 25) {
    insights.push(`Large data model (${keyCount} keys). Ideal for database records or comprehensive API entities.`);
  }
  if (insights.length === 0) {
    insights.push("Clean and well-structured JSON data model.");
  }

  return {
    isValid: true,
    rootType,
    totalKeys: keyCount,
    maxDepth,
    overview,
    fields: fields.slice(0, 40),
    insights,
  };
}
