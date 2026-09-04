import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ai/rate-limiter";

const MAX_INPUT_CHARS = 4000;
const TIMEOUT_MS = 15000;

function buildTaskPrompt(task: string, text: string, options?: Record<string, unknown>): string {
  switch (task) {
    case "summarize": {
      const length = (options?.length as string) || "medium";
      const bullet = options?.bulletPoints ? "Format the summary as concise bullet points." : "Provide clear, concise paragraphs.";
      return `Summarize the following text accurately without hallucinating details. Target length: ${length}. ${bullet}\n\nText:\n"""${text}"""`;
    }
    case "rewrite": {
      const tone = (options?.tone as string) || "professional";
      return `Rewrite the following text in a ${tone} tone. Preserve all key facts, numbers, names, dates, and instructions accurately.\n\nText:\n"""${text}"""`;
    }
    case "simplify": {
      return `Simplify the following text into plain, clear English (accessible to an 8th-grade reading level). Replace jargon and convoluted phrasing while preserving technical accuracy, numbers, and facts.\n\nText:\n"""${text}"""`;
    }
    case "keywords": {
      return `Extract the most important primary keywords, secondary keywords, and key phrases from the following text. Format as a ranked list with brief relevance notes.\n\nText:\n"""${text}"""`;
    }
    case "explain-json": {
      return `Analyze and explain this JSON structure in plain English. Describe its schema, key fields, data types, hierarchy, and any potential security or optimization insights.\n\nJSON:\n"""${text}"""`;
    }
    default:
      return text;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateCheck = checkRateLimit(ip, 15, 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateCheck.resetInSec}s or switch to free On-Device AI.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { text, task, options } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'text' field" }, { status: 400 });
    }

    if (text.length > MAX_INPUT_CHARS) {
      return NextResponse.json(
        {
          error: `Input exceeds maximum limit of ${MAX_INPUT_CHARS} characters.`,
        },
        { status: 400 }
      );
    }

    const prompt = buildTaskPrompt(task || "general", text, options);

    // Call Gemini API via Firebase / Google Developer endpoint
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBq6KCEK787HsvkH2s4ROMqvn--qKTMcnQ";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const apiRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1200,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!apiRes.ok) {
        const errorData = await apiRes.json().catch(() => ({}));
        if (apiRes.status === 429) {
          return NextResponse.json(
            { error: "Cloud AI quota temporarily reached. Please use On-Device AI." },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: errorData.error?.message || "Cloud AI processing failed. Please try On-Device AI." },
          { status: 502 }
        );
      }

      const data = await apiRes.json();
      const generatedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

      return NextResponse.json({
        result: generatedText.trim(),
        model: "gemini-2.5-flash",
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        return NextResponse.json(
          { error: "AI request timed out. Try with a shorter input or use On-Device AI." },
          { status: 504 }
        );
      }
      throw fetchErr;
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
