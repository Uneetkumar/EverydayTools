/**
 * Alarm sounds made with the Web Audio API, so there are no audio files to
 * download and nothing to license. Browsers only let a page start audio after
 * a click or key press, so `prime()` must be called from one (Start buttons do
 * it); after that the sound can play even when the tab is in the background.
 */

export type AlarmSound = "chime" | "beep" | "bell" | "digital";

export const ALARM_SOUNDS: { id: AlarmSound; label: string }[] = [
  { id: "chime", label: "Chime" },
  { id: "beep", label: "Beep" },
  { id: "bell", label: "Bell" },
  { id: "digital", label: "Digital alarm" },
];

let ctx: AudioContext | null = null;
let stopAt = 0;
const active: { osc: OscillatorNode; gain: GainNode }[] = [];

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    try {
      ctx = new C();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Call from a user gesture (a click on Start) so later alarms are allowed to play. */
export function primeAudio(): void {
  const c = getContext();
  if (c && c.state === "suspended") void c.resume().catch(() => undefined);
}

function tone(c: AudioContext, freq: number, start: number, dur: number, opts: { type?: OscillatorType; gain?: number; attack?: number } = {}) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  const peak = opts.gain ?? 0.2;
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + (opts.attack ?? 0.01));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
  active.push({ osc, gain });
  osc.onended = () => {
    const i = active.findIndex((a) => a.osc === osc);
    if (i !== -1) active.splice(i, 1);
  };
}

/** Length in seconds of one pass of the sound. */
const LENGTH: Record<AlarmSound, number> = { chime: 1.2, beep: 1.0, bell: 2.2, digital: 1.4 };

function pass(c: AudioContext, sound: AlarmSound, t: number) {
  switch (sound) {
    case "chime":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.16, 0.7, { gain: 0.18 }));
      break;
    case "beep":
      [0, 0.3, 0.6].forEach((o) => tone(c, 880, t + o, 0.18, { type: "square", gain: 0.08, attack: 0.005 }));
      break;
    case "bell":
      // Inharmonic partials, the way a struck bell rings.
      [[440, 0.22], [1214, 0.1], [2376, 0.05]].forEach(([f, g]) => tone(c, f, t, 2.0, { gain: g, attack: 0.004 }));
      break;
    case "digital":
      for (let i = 0; i < 4; i++) {
        tone(c, 1760, t + i * 0.35, 0.12, { type: "square", gain: 0.07, attack: 0.003 });
        tone(c, 1760, t + i * 0.35 + 0.16, 0.12, { type: "square", gain: 0.07, attack: 0.003 });
      }
      break;
  }
}

/** Plays the sound `repeat` times. Returns false if audio is unavailable or blocked. */
export function playAlarm(sound: AlarmSound, repeat = 1): boolean {
  const c = getContext();
  if (!c) return false;
  if (c.state === "suspended") void c.resume().catch(() => undefined);
  const now = c.currentTime + 0.02;
  for (let i = 0; i < repeat; i++) pass(c, sound, now + i * (LENGTH[sound] + 0.4));
  stopAt = now + repeat * (LENGTH[sound] + 0.4);
  return true;
}

/** A single short tick, for countdown beeps in interval timers. */
export function playTick(high = false): void {
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") void c.resume().catch(() => undefined);
  tone(c, high ? 1320 : 880, c.currentTime + 0.01, high ? 0.35 : 0.12, { type: "sine", gain: high ? 0.22 : 0.14, attack: 0.004 });
}

/** Silences anything still playing. */
export function stopAlarm(): void {
  const c = getContext();
  if (!c) return;
  const t = c.currentTime;
  for (const { osc, gain } of [...active]) {
    try {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(0.0001, t);
      osc.stop(t + 0.01);
    } catch {
      /* already stopped */
    }
  }
  active.length = 0;
  stopAt = 0;
}

export function isAlarmPlaying(): boolean {
  return !!ctx && stopAt > ctx.currentTime;
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}

/** Shows a system notification if the user has allowed them. Never asks for permission itself. */
export function notify(title: string, body: string): boolean {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    new Notification(title, { body, tag: "tabbench-timer", silent: true });
    return true;
  } catch {
    return false;
  }
}

export async function askNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}
