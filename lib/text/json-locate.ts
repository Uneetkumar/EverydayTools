/**
 * Offset of the first JSON syntax error in `src`, or null if it parses.
 *
 * Browsers disagree on JSON.parse messages and current Chrome often gives no
 * position at all ("Unexpected token ']', … is not valid JSON"), so the error
 * is located with a small strict parser instead. Only used after JSON.parse
 * has already failed, so it does not need to be fast.
 */
export function locateJsonError(src: string): { offset: number; expected: string } | null {
  let i = 0;
  const fail = (expected: string): never => {
    throw { offset: i, expected };
  };
  const ws = () => {
    while (i < src.length && (src[i] === " " || src[i] === "\t" || src[i] === "\n" || src[i] === "\r")) i++;
  };
  const lit = (word: string) => {
    if (src.startsWith(word, i)) i += word.length;
    else fail(`a value (did you mean ${word}?)`);
  };
  const str = () => {
    i++; // opening quote
    while (i < src.length) {
      const c = src[i];
      if (c === '"') {
        i++;
        return;
      }
      if (c === "\\") {
        const n = src[i + 1];
        if (n === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(src.slice(i + 2, i + 6))) {
            i += 2;
            fail("four hex digits after \\u");
          }
          i += 6;
        } else if ('"\\/bfnrt'.includes(n ?? "")) i += 2;
        else {
          i++;
          fail("a valid escape (\\n, \\t, \\\" …)");
        }
      } else if (c < " ") fail("the string to be closed before the line ends");
      else i++;
    }
    fail('a closing "');
  };
  const num = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(src.slice(i));
    if (!m || m[0] === "-") fail("a number");
    i += m![0].length;
  };
  const value = (): void => {
    ws();
    const c = src[i];
    if (c === "{") {
      i++;
      ws();
      if (src[i] === "}") {
        i++;
        return;
      }
      for (;;) {
        ws();
        if (src[i] !== '"') fail(src[i] === "}" ? "another property (remove the trailing comma)" : "a property name in double quotes");
        str();
        ws();
        if (src[i] !== ":") fail('":" after the property name');
        i++;
        value();
        ws();
        if (src[i] === ",") {
          i++;
          continue;
        }
        if (src[i] === "}") {
          i++;
          return;
        }
        fail('"," or "}"');
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (src[i] === "]") {
        i++;
        return;
      }
      for (;;) {
        ws();
        if (src[i] === "]") fail("another value (remove the trailing comma)");
        value();
        ws();
        if (src[i] === ",") {
          i++;
          continue;
        }
        if (src[i] === "]") {
          i++;
          return;
        }
        fail('"," or "]"');
      }
    }
    if (c === '"') return str();
    if (c === "t") return lit("true");
    if (c === "f") return lit("false");
    if (c === "n") return lit("null");
    if (c === "-" || (c !== undefined && c >= "0" && c <= "9")) return num();
    if (c === "'") fail("double quotes — JSON does not allow single quotes");
    fail(c === undefined ? "more input — the document ends too early" : "a value");
  };
  try {
    value();
    ws();
    if (i < src.length) fail("the end of the document");
    return null;
  } catch (e) {
    return e as { offset: number; expected: string };
  }
}
