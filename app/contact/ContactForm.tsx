"use client";

import React, { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "@/components/ui/CopyButton";
import { EDITORIAL_EMAIL, SUPPORT_EMAIL } from "@/lib/contact";

const TOPICS = [
  { value: "bug", label: "Something isn't working", to: SUPPORT_EMAIL },
  { value: "wrong-result", label: "A result looks wrong", to: EDITORIAL_EMAIL },
  { value: "request", label: "Request a new tool or feature", to: SUPPORT_EMAIL },
  { value: "other", label: "Something else", to: SUPPORT_EMAIL },
] as const;

/**
 * Composes an email in the visitor's own mail app.
 *
 * The site is a static export with no server to receive a form post, and the
 * previous form showed "Message received" without sending anything — people
 * believed they had contacted us when they had not. Opening a pre-filled
 * email is honest, needs no backend, and the visitor keeps a copy in their
 * sent mail. If a backend is added later, this is the one place to change.
 */
export default function ContactForm() {
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["value"]>("bug");
  const [toolUrl, setToolUrl] = useState("");
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);

  const chosen = TOPICS.find((t) => t.value === topic) ?? TOPICS[0];
  const subject = `[TabBench] ${chosen.label}`;
  const body = [message.trim(), toolUrl.trim() && `\nPage: ${toolUrl.trim()}`].filter(Boolean).join("\n");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const href = `mailto:${chosen.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setOpened(true);
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="contact-topic">What is it about?</Label>
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value as typeof topic)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-page">Which tool or page? (optional)</Label>
          <Input
            id="contact-page"
            type="text"
            inputMode="url"
            placeholder="e.g. tabbench.com/tools/emi-calculator"
            value={toolUrl}
            onChange={(e) => setToolUrl(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-message">Your message</Label>
          <Textarea
            id="contact-message"
            required
            rows={6}
            placeholder={
              topic === "wrong-result"
                ? "The numbers you entered, the result you got, and the result you expected."
                : topic === "bug"
                  ? "What you did, what happened, and your browser and device."
                  : "Tell us what you need."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="type-caption text-muted-foreground">
            Please don&apos;t include passwords or personal documents. For a file problem, describe the file
            (type, size, page count) instead of attaching it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" className="px-4">
            <Send aria-hidden="true" />
            Open in my email app
          </Button>
          <span className="text-sm text-muted-foreground">Sends to {chosen.to}</span>
        </div>
      </form>

      {opened && (
        <div role="status" className="mt-5 rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium text-foreground">Your email app should now be open with the message filled in.</p>
          <p className="mt-1 text-muted-foreground">
            Press send there to deliver it. If nothing opened, email {chosen.to} directly:
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${chosen.to}`}>
                <Mail aria-hidden="true" />
                {chosen.to}
              </a>
            </Button>
            <CopyButton text={chosen.to} label="Copy address" size="md" />
          </div>
        </div>
      )}
    </div>
  );
}
