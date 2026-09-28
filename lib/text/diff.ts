/**
 * Myers' O((N+M)·D) difference algorithm, the one behind `git diff`: the
 * shortest sequence of insertions and deletions turning `a` into `b`.
 *
 * Common prefix and suffix are trimmed first (most edits are local), and the
 * search gives up past MAX_EDIT_DISTANCE, reporting the rest as one block
 * replaced, so a comparison of two unrelated large texts stays fast instead
 * of exhausting memory.
 */

export type DiffOp<T> =
  | { type: "equal"; a: T; b: T; aIndex: number; bIndex: number }
  | { type: "delete"; a: T; aIndex: number }
  | { type: "insert"; b: T; bIndex: number };

const MAX_EDIT_DISTANCE = 2000;

export function diff<T>(a: T[], b: T[], key: (x: T) => string | T = (x) => x): DiffOp<T>[] {
  const ka = a.map(key);
  const kb = b.map(key);

  let start = 0;
  while (start < a.length && start < b.length && ka[start] === kb[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && ka[endA - 1] === kb[endB - 1]) {
    endA--;
    endB--;
  }

  const ops: DiffOp<T>[] = [];
  for (let i = 0; i < start; i++) ops.push({ type: "equal", a: a[i], b: b[i], aIndex: i, bIndex: i });
  ops.push(...middle(a, b, ka, kb, start, endA, start, endB));
  for (let i = 0; endA + i < a.length; i++) {
    ops.push({ type: "equal", a: a[endA + i], b: b[endB + i], aIndex: endA + i, bIndex: endB + i });
  }
  return ops;
}

function middle<T>(
  a: T[],
  b: T[],
  ka: unknown[],
  kb: unknown[],
  a0: number,
  a1: number,
  b0: number,
  b1: number
): DiffOp<T>[] {
  const n = a1 - a0;
  const m = b1 - b0;
  if (n === 0 && m === 0) return [];
  const replaceAll = (): DiffOp<T>[] => [
    ...Array.from({ length: n }, (_, i) => ({ type: "delete" as const, a: a[a0 + i], aIndex: a0 + i })),
    ...Array.from({ length: m }, (_, j) => ({ type: "insert" as const, b: b[b0 + j], bIndex: b0 + j })),
  ];
  if (n === 0 || m === 0) return replaceAll();

  const max = Math.min(n + m, MAX_EDIT_DISTANCE);
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  // Each step keeps only the diagonals it could have touched (-d-1..d+1), so
  // memory grows with D² rather than D·(N+M).
  const trace: Int32Array[] = [];
  let found = false;

  outer: for (let d = 0; d <= max; d++) {
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? v[offset + k + 1] : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && ka[a0 + x] === kb[b0 + y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        found = true;
        break outer;
      }
    }
  }
  if (!found) return replaceAll();

  // Walk the trace backwards to recover the edit script.
  const out: DiffOp<T>[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const slice = trace[d];
    const vd = (kk: number) => slice[kk + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && vd(k - 1) < vd(k + 1)) ? k + 1 : k - 1;
    const prevX = vd(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x--;
      y--;
      out.push({ type: "equal", a: a[a0 + x], b: b[b0 + y], aIndex: a0 + x, bIndex: b0 + y });
    }
    if (d > 0) {
      if (x === prevX) {
        y--;
        out.push({ type: "insert", b: b[b0 + y], bIndex: b0 + y });
      } else {
        x--;
        out.push({ type: "delete", a: a[a0 + x], aIndex: a0 + x });
      }
    }
  }
  return out.reverse();
}

/** Split a line into words and the whitespace/punctuation between them, for word-level highlighting. */
export function tokenizeWords(line: string): string[] {
  return line.match(/\s+|[\p{L}\p{M}\p{N}_]+|[^\s\p{L}\p{M}\p{N}_]/gu) ?? [];
}
