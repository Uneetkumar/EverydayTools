import { AIInput, AIOutput, AIProvider } from "../types";

export class GeminiProvider implements AIProvider {
  id = "gemini" as const;
  name = "Google Gemini 2.5 Flash (Cloud)";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(input: AIInput): Promise<AIOutput> {
    const startTime = performance.now();

    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: input.text,
        task: input.task,
        options: input.options,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      if (res.status === 429) {
        throw new Error(
          errJson.error || "Advanced AI rate limit reached. Switch to On-Device AI for unlimited free processing."
        );
      }
      throw new Error(errJson.error || `Server AI processing failed (${res.status})`);
    }

    const data = await res.json();

    return {
      result: data.result,
      provider: "gemini",
      modelUsed: data.model || "gemini-2.5-flash",
      elapsedMs: Math.round(performance.now() - startTime),
      metrics: {
        wordCount: data.result ? data.result.split(/\s+/).filter(Boolean).length : 0,
        charCount: data.result ? data.result.length : 0,
      },
    };
  }
}
