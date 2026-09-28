"use client";

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Info, LockOpen } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolErrorState, ToolLoadingState, ToolSuccessState } from "@/components/tool/tool-states";
import { markToolCompleted, markToolError } from "@/lib/analytics";
import { downloadBlob } from "@/lib/utils/download";
import { loadPdfJs, pdfDocumentOptions } from "@/lib/pdf/loader";

type Status =
  | { kind: "idle" }
  | { kind: "working"; message: string }
  | { kind: "not-locked" }
  | { kind: "needs-password"; wrong: boolean }
  | { kind: "done"; blob: Blob; pages: number }
  | { kind: "error"; message: string };

/** Render scale: 2.5 × 72 DPI ≈ 180 DPI — sharp on screen and in print. */
const RENDER_SCALE = 2.5;

/**
 * Unlock PDF.
 *
 * pdf-lib cannot decrypt, so the previous version re-saved the encrypted file
 * and reported success: the copy kept its restrictions (and could come out
 * corrupted). pdf.js can decrypt, with the password when one is needed, so an
 * encrypted document is opened with pdf.js and each page is re-drawn into a
 * new, unencrypted PDF. The copy looks and prints the same; the trade-off is
 * that its pages are images, so text is no longer selectable — which the page
 * says plainly.
 */
export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const reset = () => {
    setFile(null);
    setPassword("");
    setStatus({ kind: "idle" });
  };

  const unlock = async (f: File, pwd: string) => {
    setStatus({ kind: "working", message: "Checking the PDF…" });
    const bytes = await f.arrayBuffer();

    // 1. Not encrypted at all? pdf-lib refuses encrypted files by default.
    try {
      await PDFDocument.load(bytes.slice(0));
      setStatus({ kind: "not-locked" });
      return;
    } catch (e) {
      const encrypted = e instanceof Error && /encrypt/i.test(e.message);
      if (!encrypted) {
        markToolError("invalid_pdf");
        setStatus({ kind: "error", message: "This file couldn't be read as a PDF. It may be damaged." });
        return;
      }
    }

    // 2. Encrypted: open with pdf.js, which decrypts (using the password if
    //    the document needs one to open).
    let task: ReturnType<Awaited<ReturnType<typeof loadPdfJs>>["getDocument"]> | null = null;
    try {
      const pdfjs = await loadPdfJs();
      task = pdfjs.getDocument({ ...pdfDocumentOptions(bytes.slice(0)), password: pwd || undefined });
      const doc = await task.promise;

      const out = await PDFDocument.create();
      for (let i = 1; i <= doc.numPages; i++) {
        setStatus({ kind: "working", message: `Unlocking page ${i} of ${doc.numPages}…` });
        const page = await doc.getPage(i);
        const size = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvas, viewport, background: "#ffffff" }).promise;
        const jpg: Blob = await new Promise((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.9)
        );
        const image = await out.embedJpg(await jpg.arrayBuffer());
        out.addPage([size.width, size.height]).drawImage(image, { x: 0, y: 0, width: size.width, height: size.height });
        page.cleanup();
        canvas.width = canvas.height = 0;
      }
      const saved = await out.save();
      setStatus({ kind: "done", blob: new Blob([new Uint8Array(saved)], { type: "application/pdf" }), pages: doc.numPages });
      markToolCompleted();
    } catch (e) {
      const name = (e as { name?: string })?.name;
      const code = (e as { code?: number })?.code;
      if (name === "PasswordException") {
        // code 1: a password is required; code 2: the one given is wrong.
        setStatus({ kind: "needs-password", wrong: code === 2 });
        return;
      }
      console.error(e);
      markToolError("unlock_failed");
      setStatus({
        kind: "error",
        message: "This PDF couldn't be unlocked. It may use an encryption method the browser can't open, or be damaged.",
      });
    } finally {
      await task?.destroy().catch(() => {});
    }
  };

  const base = file?.name.replace(/\.pdf$/i, "") ?? "document";
  const busy = status.kind === "working";

  return (
    <div className="space-y-6">
      <DropZone
        accept="application/pdf,.pdf"
        maxSizeMB={100}
        title="Drop a locked PDF here or choose one"
        subtitle="Unlocked in your browser. The file and its password are never uploaded."
        supportedFormatsText="PDF"
        selectedFile={file}
        onClear={busy ? undefined : reset}
        onFileSelect={(f) => {
          setFile(f);
          setPassword("");
          void unlock(f, "");
        }}
      />

      {status.kind === "working" && <ToolLoadingState label={status.message} />}

      {status.kind === "not-locked" && (
        <ToolSuccessState title="This PDF isn't locked">
          <p>
            It has no password and no printing or copying restrictions, so there is nothing to remove. You can use
            it as it is.
          </p>
        </ToolSuccessState>
      )}

      {status.kind === "needs-password" && file && (
        <form
          className="space-y-3 rounded-xl border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (password) void unlock(file, password);
          }}
        >
          <Label htmlFor="unlock-password">
            {status.wrong ? "That password didn't work. Try again:" : "This PDF needs a password to open:"}
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="unlock-password"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={status.wrong || undefined}
              className="h-10 sm:max-w-xs"
              autoFocus
            />
            <Button type="submit" size="lg" disabled={!password}>
              <LockOpen aria-hidden="true" />
              Unlock
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The password is used only in this tab to open the file. Without it the document can&apos;t be opened —
            no tool can recover a forgotten password.
          </p>
        </form>
      )}

      {status.kind === "error" && <ToolErrorState title="Couldn't unlock this PDF" description={status.message} onRetry={reset} />}

      {status.kind === "done" && (
        <div className="space-y-4">
          <ToolSuccessState title={`Unlocked — ${status.pages} ${status.pages === 1 ? "page" : "pages"}`}>
            <p>The copy has no password and no printing or copying restrictions. Your original file is unchanged.</p>
          </ToolSuccessState>
          <Button size="lg" onClick={() => downloadBlob(status.blob, `${base}-unlocked.pdf`, "unlock-pdf")}>
            <Download aria-hidden="true" />
            Download unlocked PDF
          </Button>
          <p className="flex gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Each page is saved as a high-resolution image, so the copy looks and prints the same but its text
              can&apos;t be selected or searched. Unlock only documents you&apos;re entitled to.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
