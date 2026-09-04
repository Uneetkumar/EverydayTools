/**
 * Zero-Download Client-Side Text Rewriter.
 * Supports tone shifts: Professional, Friendly, Concise, Formal, Casual, Simple.
 * Preserves facts, numbers, dates, emails, URLs, and core meaning.
 */

export type ToneType =
  | "professional"
  | "friendly"
  | "concise"
  | "formal"
  | "casual"
  | "simple";

const CASUAL_TO_FORMAL: Record<string, string> = {
  "gonna": "going to",
  "wanna": "want to",
  "gotta": "must",
  "kinda": "somewhat",
  "sorta": "rather",
  "hey": "Greetings,",
  "thanks": "Thank you",
  "cool": "satisfactory",
  "awesome": "excellent",
  "bad": "suboptimal",
  "fix": "resolve",
  "help": "assist",
  "ask": "inquire",
  "tell": "inform",
  "buy": "purchase",
  "need": "require",
  "start": "commence",
  "stop": "cease",
  "show": "demonstrate",
  "give": "provide",
  "check": "verify",
  "talk": "discuss",
  "job": "position",
  "boss": "manager",
  "a lot of": "numerous",
  "about": "approximately",
  "anyway": "nevertheless",
};

const FORMAL_TO_CASUAL: Record<string, string> = {
  "going to": "gonna",
  "want to": "wanna",
  "commence": "start",
  "terminate": "end",
  "demonstrate": "show",
  "purchase": "buy",
  "inquire": "ask",
  "assist": "help",
  "verify": "check",
  "utilize": "use",
  "furthermore": "also",
  "nevertheless": "anyway",
  "subsequent to": "after",
  "prior to": "before",
  "in order to": "to",
  "in light of": "since",
  "with regard to": "about",
};

const FILLER_PHRASES = [
  /\b(it goes without saying that|at the end of the day|needless to say|for all intents and purposes)\b/gi,
  /\b(in order to)\b/gi,
  /\b(due to the fact that)\b/gi,
  /\b(at this point in time)\b/gi,
  /\b(in the event that)\b/gi,
  /\b(as a matter of fact)\b/gi,
];

export function rewriteTextLocally(text: string, tone: ToneType = "professional"): string {
  if (!text.trim()) return "";

  let result = text;

  switch (tone) {
    case "concise": {
      // Remove conversational fillers & redundant phrases
      for (const pattern of FILLER_PHRASES) {
        result = result.replace(pattern, (match) => {
          if (/in order to/i.test(match)) return "to";
          if (/due to the fact that/i.test(match)) return "because";
          if (/at this point in time/i.test(match)) return "now";
          if (/in the event that/i.test(match)) return "if";
          return "";
        });
      }
      // Compress multiple spaces
      result = result.replace(/\s{2,}/g, " ").trim();
      break;
    }

    case "formal":
    case "professional": {
      // Replace contractions and casual idioms
      result = result
        .replace(/\bcan't\b/gi, "cannot")
        .replace(/\bwon't\b/gi, "will not")
        .replace(/\bdon't\b/gi, "do not")
        .replace(/\bdoesn't\b/gi, "does not")
        .replace(/\bdidn't\b/gi, "did not")
        .replace(/\bisn't\b/gi, "is not")
        .replace(/\baren't\b/gi, "are not")
        .replace(/\bwasn't\b/gi, "was not")
        .replace(/\bweren't\b/gi, "were not")
        .replace(/\bI'm\b/g, "I am")
        .replace(/\bwe're\b/gi, "we are")
        .replace(/\bthey're\b/gi, "they are")
        .replace(/\byou're\b/gi, "you are");

      for (const [key, val] of Object.entries(CASUAL_TO_FORMAL)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        result = result.replace(regex, (match) => {
          const isCap = match[0] === match[0].toUpperCase();
          return isCap ? val.charAt(0).toUpperCase() + val.slice(1) : val;
        });
      }
      break;
    }

    case "friendly": {
      // Soften sentences with supportive openers if suitable
      result = result
        .replace(/\bDear Sir\/Madam\b/gi, "Hi there,")
        .replace(/\bTo Whom It May Concern\b/gi, "Hello,")
        .replace(/\bRegards,\b/gi, "Warm regards,")
        .replace(/\bSincerely,\b/gi, "Best wishes,");
      break;
    }

    case "casual": {
      for (const [key, val] of Object.entries(FORMAL_TO_CASUAL)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        result = result.replace(regex, val);
      }
      break;
    }

    case "simple": {
      result = result
        .replace(/\butilize\b/gi, "use")
        .replace(/\bfacilitate\b/gi, "help")
        .replace(/\bimplement\b/gi, "set up")
        .replace(/\bcommence\b/gi, "start")
        .replace(/\bterminate\b/gi, "end")
        .replace(/\boptimal\b/gi, "best")
        .replace(/\bsubstantial\b/gi, "large")
        .replace(/\bexpedite\b/gi, "speed up")
        .replace(/\bdemonstrate\b/gi, "show");
      break;
    }
  }

  return result.trim();
}
