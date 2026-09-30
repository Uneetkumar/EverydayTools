/** Logic behind the random, timer and regex tools. (The speed test has its own file: speedtest.test.mjs.) */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { load } from "./helpers.mjs";

const rnd = await load("random/random.ts");
const timers = await load("time/timers.ts");
const zones = await load("time/zones.ts");
const builder = await load("regex/builder.ts");
const flavors = await load("regex/flavors.ts");

describe("randomness", () => {
  it("is uniform over a range that does not divide 2^32", () => {
    const n = 7;
    const counts = Array(n).fill(0);
    const draws = 140_000;
    for (let i = 0; i < draws; i++) counts[rnd.randomBelow(n)]++;
    const expected = draws / n;
    const chi = counts.reduce((s, c) => s + (c - expected) ** 2 / expected, 0);
    assert.ok(chi < 22.46, `chi-square ${chi.toFixed(1)} (df=6, p=0.001)`);
  });
  it("covers inclusive bounds and wide ranges", () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i++) seen.add(rnd.randomInt(-2, 2));
    assert.deepEqual([...seen].sort((a, b) => a - b), [-2, -1, 0, 1, 2]);
    const big = rnd.randomInt(0, 2 ** 40);
    assert.ok(big >= 0 && big <= 2 ** 40);
  });
  it("draws unique numbers and shuffles without loss", () => {
    const u = rnd.uniqueInts(10, 1, 10);
    assert.deepEqual([...u].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.throws(() => rnd.uniqueInts(6, 1, 5), RangeError);
    assert.deepEqual([...rnd.shuffle([1, 2, 3, 4, 5])].sort(), [1, 2, 3, 4, 5]);
  });
  it("parses and rolls dice notation", () => {
    const p = rnd.parseDice("4d6kh3+2");
    assert.ok(p.ok);
    assert.equal(p.canonical, "4d6kh3+2");
    for (let i = 0; i < 200; i++) {
      const r = rnd.rollDice(p.expr);
      assert.ok(r.total >= 5 && r.total <= 20);
      assert.equal(r.groups[0].rolls.filter((x) => x.dropped).length, 1);
    }
    assert.equal(rnd.parseDice("d%").expr.terms[0].sides, 100);
    assert.equal(rnd.parseDice("0d6").ok, false);
    assert.equal(rnd.parseDice("2d6+").ok, false);
    const dist = rnd.sumDistribution(2, 6);
    assert.ok(Math.abs(dist.find((d) => d.total === 7).probability - 6 / 36) < 1e-12);
    assert.equal(rnd.expectedValue(rnd.parseDice("1d6!").expr), 4.2);
  });
});

describe("timers", () => {
  it("parses typed durations", () => {
    for (const [text, sec] of [["90", 90], ["1:30", 90], ["1:30:00", 5400], ["1h 30m", 5400], ["45s", 45], ["1.5h", 5400], ["1h30", 5400], ["5 minutes 30 seconds", 330]]) assert.equal(timers.parseDuration(text), sec, text);
    assert.equal(timers.parseDuration("abc"), null);
  });
  it("builds the Pomodoro and interval schedules", () => {
    const kinds = Array.from({ length: 8 }, (_, i) => timers.pomodoroPhase(i, timers.DEFAULT_POMODORO).kind);
    assert.deepEqual(kinds, ["focus", "short", "focus", "short", "focus", "short", "focus", "long"]);
    const tabata = timers.buildSchedule(timers.INTERVAL_PRESETS.find((p) => p.id === "tabata").plan);
    assert.equal(timers.scheduleSeconds(tabata), 10 + 8 * 20 + 7 * 10);
    const circuit = timers.buildSchedule(timers.INTERVAL_PRESETS.find((p) => p.id === "circuit").plan);
    assert.equal(circuit.filter((s) => s.kind === "setrest").length, 2);
  });
  it("formats clocks and differences", () => {
    assert.equal(timers.formatClock(3725), "1:02:05");
    assert.equal(timers.formatClock(65), "01:05");
    const d = timers.diffTo(1_000_000 + (3 * 86400 + 5 * 3600 + 7 * 60 + 9) * 1000, 1_000_000);
    assert.deepEqual([d.days, d.hours, d.minutes, d.seconds], [3, 5, 7, 9]);
  });
});

describe("time zones", () => {
  it("knows offsets and daylight saving", () => {
    const summer = Date.UTC(2026, 6, 1, 12);
    const winter = Date.UTC(2026, 0, 1, 12);
    assert.equal(zones.zoneClock(summer, "Asia/Kolkata").offsetMin, 330);
    assert.equal(zones.zoneClock(summer, "America/New_York").offsetMin, -240);
    assert.equal(zones.zoneClock(winter, "America/New_York").offsetMin, -300);
    assert.ok(zones.zoneClock(summer, "America/New_York").dst);
    assert.ok(!zones.zoneClock(summer, "Asia/Kolkata").dst);
    assert.equal(zones.isValidZone("Nope/Nowhere"), false);
  });
  it("plans a day across zones", () => {
    const rows = zones.plan("2026-07-01", "UTC", ["UTC", "Asia/Kolkata"], 9, 18);
    const noon = rows[12];
    assert.equal(noon.cells[1].hour, 17);
    assert.equal(noon.cells[1].minute, 30);
    assert.ok(noon.cells[0].working && noon.cells[1].working);
  });
});

describe("regex builder", () => {
  it("every template matches its own sample text", () => {
    for (const t of builder.TEMPLATES) {
      const c = builder.compile(t.build());
      assert.deepEqual(c.issues, [], t.id);
      const flags = [...new Set((t.flags + c.requiredFlags + "g").split(""))].join("");
      const matches = [...t.sample.matchAll(new RegExp(c.pattern, flags))];
      assert.ok(matches.length > 0, `${t.id}: ${c.pattern} found nothing in its sample`);
    }
  });
  it("escapes text and wraps repeated pieces", () => {
    const { makeBlock, compile } = builder;
    assert.equal(compile([makeBlock("text", { text: "a.b", quant: { kind: "plus" } })]).pattern, "(?:a\\.b)+");
    assert.equal(compile([makeBlock("oneof", { options: ["cat", "dog"], quant: { kind: "optional" } })]).pattern, "(?:cat|dog)?");
    assert.equal(compile([makeBlock("set", { classes: ["lower"], custom: "a-f", negate: true })]).pattern, "[^a-za-f]");
  });
});

describe("regex languages", () => {
  it("converts named groups and flags for each language", () => {
    const py = flavors.generateCode("python", "(?<y>\\d{4})", "gi");
    assert.match(py.code, /\(\?P<y>/);
    assert.match(py.code, /re\.IGNORECASE/);
    assert.match(flavors.generateCode("go", "\\d+", "i").code, /\(\?i\)/);
    assert.ok(flavors.generateCode("go", "a(?=b)", "").notes.some((n) => /look-ahead/.test(n)));
    const phpCode = flavors.generateCode("php", "a/b\\\\", "u").code;
    assert.match(phpCode, /'~a\/b\\\\\\\\~u'/);
  });
  it("generated Python compiles", { skip: spawnSync("python3", ["--version"]).status !== 0 && "python3 is not installed" }, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tb-re-"));
    try {
      const f = path.join(dir, "a.py");
      fs.writeFileSync(f, flavors.generateCode("python", '(?<x>"q"\'s)\\\\', "gim").code);
      assert.equal(spawnSync("python3", ["-m", "py_compile", f]).status, 0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  it("flags pattern syntax JavaScript does not know, with a fix", () => {
    const issues = flavors.detectForeignSyntax("(?i)(?P<u>\\w+)\\A", "");
    assert.deepEqual(issues.map((i) => i.id), ["py-named", "inline-flags", "anchors"]);
    assert.equal(issues.find((i) => i.id === "inline-flags").fix.flags, "i");
  });
});
