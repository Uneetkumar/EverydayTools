"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Trash2, Download, Check, FileText, Search as SearchIcon,
} from "lucide-react";
import { downloadText } from "@/lib/utils/download";

/**
 * A local notepad. Notes live in localStorage only — there is no account and
 * no sync, which is the point: it works instantly and nothing is transmitted.
 */
interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

const KEY = "et_notes_v1";
const AUTOSAVE_MS = 400;

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    /* quota or private mode */
  }
}

const firstLine = (body: string) =>
  body.split("\n").find((l) => l.trim())?.trim().slice(0, 60) || "Untitled note";

export default function NotePad() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const loaded = loadNotes();
      setNotes(loaded);
      setActiveId(loaded[0]?.id ?? null);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const active = notes.find((n) => n.id === activeId) ?? null;

  // Debounced autosave, so every keystroke does not hit localStorage.
  const persist = useCallback((next: Note[]) => {
    setNotes(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveNotes(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    }, AUTOSAVE_MS);
  }, []);

  const addNote = () => {
    const note: Note = { id: crypto.randomUUID(), title: "", body: "", updatedAt: Date.now() };
    const next = [note, ...notes];
    persist(next);
    setActiveId(note.id);
  };

  const updateBody = (body: string) => {
    if (!active) return;
    persist(
      notes.map((n) =>
        n.id === active.id ? { ...n, body, title: firstLine(body), updatedAt: Date.now() } : n
      )
    );
  };

  const removeNote = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  };

  const visible = filter.trim()
    ? notes.filter((n) =>
        (n.title + n.body).toLowerCase().includes(filter.trim().toLowerCase())
      )
    : notes;

  const words = active ? active.body.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="grid grid-cols-1 @3xl:grid-cols-[260px_1fr] gap-4 min-h-[26rem]">
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={addNote}
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New note
          </button>
        </div>

        {notes.length > 3 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter notes"
              aria-label="Filter notes"
              className="w-full bg-transparent text-xs outline-none text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
        )}

        <ul className="space-y-1 max-h-[22rem] overflow-y-auto">
          {visible.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-slate-400">
              {notes.length === 0 ? "No notes yet." : "No matches."}
            </li>
          )}
          {visible.map((note) => (
            <li key={note.id}>
              <div
                className={`group flex items-center gap-2 rounded-xl px-3 py-2 transition cursor-pointer ${
                  note.id === activeId
                    ? "bg-blue-50 dark:bg-blue-950/40"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => setActiveId(note.id)}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                    {note.title || "Untitled note"}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNote(note.id);
                  }}
                  aria-label={`Delete ${note.title || "note"}`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {active ? (
          <>
            <textarea
              value={active.body}
              onChange={(e) => updateBody(e.target.value)}
              placeholder="Start typing. Your note saves automatically to this browser."
              className="flex-1 min-h-[20rem] w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-slate-900 dark:text-slate-100 outline-none placeholder-slate-400"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 px-4 py-2">
              <span className="text-[11px] text-slate-400 tabular-nums">
                {words} word{words === 1 ? "" : "s"} · {active.body.length} characters
                {saved && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3 h-3" />
                    saved
                  </span>
                )}
              </span>
              <button
                onClick={() =>
                  downloadText(active.body, `${(active.title || "note").replace(/[^\w -]/g, "").slice(0, 40) || "note"}.txt`)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Download .txt
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No note open. Create one to start writing.
            </p>
            <button
              onClick={addNote}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              New note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
