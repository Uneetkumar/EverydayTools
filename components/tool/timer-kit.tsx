"use client";

/**
 * Pieces shared by the countdown, Pomodoro and interval timers: alert
 * preferences (sound, notification, keep-awake), the progress ring, and a
 * hook that shows the remaining time in the browser tab's title so a timer
 * in a background tab stays readable.
 */

import * as React from "react";
import { Bell, BellOff, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SelectInput, ToggleRow } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { ALARM_SOUNDS, askNotificationPermission, notify, playAlarm, primeAudio, stopAlarm, vibrate, type AlarmSound } from "@/lib/audio/alarm";
import { cn } from "@/lib/utils";

export type SoundChoice = AlarmSound | "off";

export interface AlertPrefs {
  sound: SoundChoice;
  setSound: (s: SoundChoice) => void;
  notifyOn: boolean;
  setNotifyOn: (v: boolean) => void;
  awake: boolean;
  setAwake: (v: boolean) => void;
}

export function useAlertPrefs(): AlertPrefs {
  const [sound, setSound] = usePersistentState<SoundChoice>("timer-sound", "chime");
  const [notifyOn, setNotifyOn] = usePersistentState<boolean>("timer-notify", false);
  const [awake, setAwake] = usePersistentState<boolean>("timer-awake", true);
  return { sound, setSound, notifyOn, setNotifyOn, awake, setAwake };
}

/** Sound, vibration and (if allowed) a notification, all at once. */
export function fireAlert(prefs: AlertPrefs, title: string, body: string, repeat = 3): void {
  if (prefs.sound !== "off") playAlarm(prefs.sound, repeat);
  vibrate([250, 120, 250, 120, 400]);
  if (prefs.notifyOn) notify(title, body);
}

export function AlertSettings({ prefs, className }: { prefs: AlertPrefs; className?: string }) {
  const id = React.useId();
  const toggleNotify = async (v: boolean) => {
    if (!v) return prefs.setNotifyOn(false);
    const p = await askNotificationPermission();
    if (p === "granted") prefs.setNotifyOn(true);
    else if (p === "unsupported") toast.error("This browser does not support notifications.");
    else toast.error("Notifications are blocked", { description: "Allow them for this site in your browser's settings, then try again." });
  };
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-44 flex-1 space-y-1.5">
          <label htmlFor={`${id}-sound`} className="block text-sm font-medium text-foreground">
            Alarm sound
          </label>
          <SelectInput
            id={`${id}-sound`}
            value={prefs.sound}
            onChange={(e) => {
              const v = e.target.value as SoundChoice;
              prefs.setSound(v);
              primeAudio();
              if (v !== "off") playAlarm(v, 1);
            }}
          >
            {ALARM_SOUNDS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
            <option value="off">Silent</option>
          </SelectInput>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            primeAudio();
            if (prefs.sound !== "off") playAlarm(prefs.sound, 1);
          }}
          disabled={prefs.sound === "off"}
        >
          <Play aria-hidden="true" /> Test sound
        </Button>
      </div>
      <ToggleRow id={`${id}-notify`} label="Show a notification when time is up" description="Helpful when this tab is in the background. Your browser will ask for permission." checked={prefs.notifyOn} onCheckedChange={toggleNotify} />
      <ToggleRow id={`${id}-awake`} label="Keep the screen on while running" description="Stops the display from sleeping during a timer, where your browser allows it." checked={prefs.awake} onCheckedChange={prefs.setAwake} />
    </div>
  );
}

/** Dismiss button for a ringing alarm. */
export function DismissAlarm({ onDismiss, label = "Stop alarm" }: { onDismiss: () => void; label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={() => {
        stopAlarm();
        onDismiss();
      }}
    >
      <BellOff aria-hidden="true" /> {label}
    </Button>
  );
}

export function NotificationHint() {
  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <Bell aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>Keep this tab open: the alarm is played by the page itself. A tab in the background still rings, but closing it stops the timer.</span>
    </p>
  );
}

/** Progress ring with content in the middle. `fraction` 0–1 is the part remaining. */
export function Ring({ fraction, size = 240, stroke = 10, tone = "primary", children, className }: { fraction: number; size?: number; stroke?: number; tone?: "primary" | "success" | "warning" | "muted"; children?: React.ReactNode; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.min(1, Math.max(0, fraction));
  const stop = { primary: "stroke-primary", success: "stroke-success", warning: "stroke-warning", muted: "stroke-muted-foreground/35" }[tone];
  return (
    <div className={cn("relative mx-auto grid place-items-center", className)} style={{ width: size, height: size, maxWidth: "100%" }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - f)} className={cn(stop, "transition-[stroke-dashoffset] duration-200 ease-linear")} />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

/** Puts `text` in the tab title while non-null, and puts the original back afterwards. */
export function useDocumentTitle(text: string | null): void {
  const original = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (text === null) return;
    if (original.current === null) original.current = document.title;
    document.title = text;
  }, [text]);
  React.useEffect(
    () => () => {
      if (original.current !== null) document.title = original.current;
    },
    []
  );
  React.useEffect(() => {
    if (text === null && original.current !== null) {
      document.title = original.current;
      original.current = null;
    }
  }, [text]);
}
