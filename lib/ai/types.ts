export type AIProviderType = "local" | "gemini";

export interface AIModelDefinition {
  id: string;
  name: string;
  task: string;
  sizeBytes: number;
  browserCompatible: boolean;
  webGPUCompatible?: boolean;
  license: string;
  description: string;
}

export interface AIInput {
  text: string;
  task:
    | "summarize"
    | "rewrite"
    | "simplify"
    | "keywords"
    | "explain-json"
    | "general";
  options?: Record<string, unknown>;
}

export interface AIOutput {
  result: string;
  provider: AIProviderType;
  modelUsed: string;
  elapsedMs: number;
  metrics?: {
    wordCount?: number;
    charCount?: number;
    confidence?: number;
    keyPoints?: string[];
    data?: unknown;
  };
}

export interface AIProvider {
  id: AIProviderType;
  name: string;
  isAvailable(): Promise<boolean>;
  generate(input: AIInput): Promise<AIOutput>;
  /**
   * Emits text as it arrives, resolving with the same shape `generate` returns.
   *
   * Optional: the on-device engines are synchronous string transforms with
   * nothing to stream, and faking chunks for them would add latency to hide
   * that they are already instant. Callers fall back to `generate`.
   */
  generateStream?(
    input: AIInput,
    onChunk: (textSoFar: string) => void
  ): Promise<AIOutput>;
}
