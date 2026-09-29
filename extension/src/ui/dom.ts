/**
 * A tiny element builder. Text is always set as text (never parsed as HTML);
 * `html` is only for trusted markup built into the extension, such as icons.
 */

type Child = Node | string | number | false | null | undefined;
type Props = {
  class?: string;
  html?: string;
  on?: Partial<{ [K in keyof HTMLElementEventMap]: (e: HTMLElementEventMap[K]) => void }>;
  [attr: string]: unknown;
};

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props | null = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") el.className = String(value);
    else if (key === "html") el.innerHTML = String(value);
    else if (key === "on") {
      for (const [type, fn] of Object.entries(value as Record<string, EventListener>)) el.addEventListener(type, fn);
    } else if (value === true) el.setAttribute(key, "");
    else el.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
