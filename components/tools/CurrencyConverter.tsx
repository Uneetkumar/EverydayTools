"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowRightLeft,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  Wifi,
} from "lucide-react";
import {
  getRates,
  RateTable,
  POPULAR_CURRENCIES,
  CURRENCY_SYMBOLS,
} from "@/lib/currency/rates";
import { detectLocalCurrency, defaultPairForCurrency } from "@/lib/currency/locale";
import CurrencyPicker from "./CurrencyPicker";

const QUICK_AMOUNTS = [1, 10, 100, 1000, 10000];

const POPULAR_PAIRS: [string, string][] = [
  ["USD", "INR"], ["INR", "USD"], ["EUR", "INR"], ["GBP", "INR"],
  ["AED", "INR"], ["USD", "EUR"], ["CAD", "INR"], ["AUD", "INR"],
];

interface CurrencyConverterProps {
  /** Set by the /convert/[pair] pages. When present, locale detection is skipped. */
  initialFrom?: string;
  initialTo?: string;
}

export default function CurrencyConverter({
  initialFrom,
  initialTo,
}: CurrencyConverterProps = {}) {
  const [amount, setAmount] = useState<string>("1");
  // These defaults must be deterministic: the page is prerendered at build
  // time, so detecting the locale during render would produce a hydration
  // mismatch. Detection happens after mount instead.
  const [from, setFrom] = useState(initialFrom ?? "USD");
  const [to, setTo] = useState(initialTo ?? "INR");
  const [table, setTable] = useState<RateTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [reloadToken, setReloadToken] = useState(0);
  const [localCurrency, setLocalCurrency] = useState<string | null>(null);

  // A pair page states the pair explicitly, so the URL must win over the guess.
  useEffect(() => {
    if (initialFrom || initialTo) return;
    // Deferred off the synchronous effect path so mount does not immediately
    // cascade into a second render.
    const id = setTimeout(() => {
      const local = detectLocalCurrency();
      if (!local || local === "INR") return;
      const pair = defaultPairForCurrency(local);
      setLocalCurrency(local);
      setLoading(true);
      setFrom(pair.from);
      setTo(pair.to);
    }, 0);
    return () => clearTimeout(id);
  }, [initialFrom, initialTo]);

  // State updates happen in the promise callbacks rather than synchronously in
  // the effect body, and `cancelled` guards against a slow response for a
  // currency the user has already switched away from overwriting a newer one.
  useEffect(() => {
    let cancelled = false;
    getRates(from)
      .then((t) => {
        if (cancelled) return;
        setTable(t);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setTable(null);
        setError(
          "Could not reach a rate provider. This is the one tool here that needs a network connection — check that you are online and try again."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, reloadToken]);

  // Loading is flipped by the interactions that start a fetch, so the effect
  // never has to set it synchronously on mount.
  const changeFrom = useCallback((code: string) => {
    setLoading(true);
    setFrom(code);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setReloadToken((n) => n + 1);
  }, []);

  const rate = table?.rates?.[to] ?? null;
  const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const converted = rate !== null ? numericAmount * rate : null;

  const currencyList = useMemo(() => {
    const all = table ? Object.keys(table.rates) : [...POPULAR_CURRENCIES];
    const popular = POPULAR_CURRENCIES.filter((c) => all.includes(c));
    return { all, popular: popular as string[] };
  }, [table]);

  const fmt = (value: number, code: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);

  const swap = () => {
    changeFrom(to);
    setTo(from);
  };

  const copyResult = async () => {
    if (converted === null) return;
    await navigator.clipboard.writeText(converted.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 @2xl:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div className="space-y-1.5">
          <label htmlFor="fx-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Amount
          </label>
          <input
            id="fx-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            className="w-full text-lg font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-slate-900 dark:text-white"
          />
          <CurrencyPicker
            label="Convert from currency"
            value={from}
            onChange={changeFrom}
            codes={currencyList.all}
            popular={currencyList.popular}
          />
        </div>

        <button
          onClick={swap}
          aria-label="Swap currencies"
          className="mx-auto @2xl:mb-1 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Converted to
          </span>
          <div className="w-full text-lg font-bold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 px-3 py-2.5 rounded-xl text-emerald-800 dark:text-emerald-300 min-h-[46px] flex items-center justify-between gap-2">
            <span className="truncate">
              {loading ? "…" : converted !== null ? fmt(converted, to) : "—"}
            </span>
            {converted !== null && !loading && (
              <button onClick={copyResult} aria-label="Copy converted amount"
                className="shrink-0 text-emerald-700 dark:text-emerald-400 hover:opacity-70">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <CurrencyPicker
            label="Convert to currency"
            value={to}
            onChange={setTo}
            codes={currencyList.all}
            popular={currencyList.popular}
          />
        </div>
      </div>

      {rate !== null && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">
              1 {from} = {rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {to}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              1 {to} = {(1 / rate).toLocaleString(undefined, { maximumFractionDigits: 6 })} {from}
            </span>
          </div>
          <button onClick={refresh}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Quick amounts
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button key={q} onClick={() => setAmount(String(q))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              {CURRENCY_SYMBOLS[from] ?? ""}{q.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Popular pairs
        </span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_PAIRS.map(([a, b]) => (
            <button key={`${a}${b}`} onClick={() => { changeFrom(a); setTo(b); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                from === a && to === b
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}>
              {a} → {b}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">{error}</p>
            <button onClick={refresh}
              className="text-xs font-semibold text-amber-900 dark:text-amber-100 underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {localCurrency && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Defaulted to {localCurrency} from your device&rsquo;s region settings.
          Change either currency above to override — no location lookup was
          performed.
        </p>
      )}

      {table && !loading && (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <Wifi className="w-3 h-3 mt-0.5 shrink-0" />
          <span>
            Mid-market rates from {table.provider}, updated{" "}
            {new Date(table.updatedAt).toUTCString()}. Banks and card networks
            add a margin of roughly 1–4% on top, so the amount you actually
            receive will be lower than the figure shown. This is the one tool on
            the site that contacts an external service — it sends no personal
            data, only a request for the public rate table.
          </span>
        </p>
      )}
    </div>
  );
}
