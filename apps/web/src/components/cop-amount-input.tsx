"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

function formatCopPlain(n: number) {
  return n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function parseCopInputMeta(s: string): { n: number; empty: boolean } {
  const cleaned = s
    .trim()
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "");
  if (cleaned === "" || cleaned === "-") return { n: 0, empty: true };
  const n = Number(cleaned);
  return { n: Number.isFinite(n) ? Math.round(n) : 0, empty: false };
}

function parseCopInput(s: string): number {
  return parseCopInputMeta(s).n;
}

function countDigitsBeforeIndex(s: string, index: number): number {
  let n = 0;
  const end = Math.max(0, Math.min(index, s.length));
  for (let i = 0; i < end; i++) {
    if (/\d/.test(s[i]!)) n++;
  }
  return n;
}

function indexAfterNthDigit(s: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < s.length; i++) {
    if (/\d/.test(s[i]!)) {
      seen++;
      if (seen === digitCount) return i + 1;
    }
  }
  return s.length;
}

const defaultInputClass =
  "flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-right tabular-nums tracking-tight ring-offset-white file:border-0 file:bg-transparent placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-500";

/** Entero COP con separadores de miles (es-CO) mientras escribes, como en la matriz de flujo de caja. */
export function CopAmountInput({
  value,
  onCommit,
  className,
  id,
  disabled,
  autoComplete = "off",
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
  autoComplete?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(() => formatCopPlain(safe));
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorDigitsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!focused) setText(formatCopPlain(safe));
  }, [safe, focused]);

  useLayoutEffect(() => {
    const d = cursorDigitsRef.current;
    const el = inputRef.current;
    if (d === null || el === null || !focused) return;
    cursorDigitsRef.current = null;
    const pos = indexAfterNthDigit(text, d);
    el.setSelectionRange(pos, pos);
  }, [text, focused]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete={autoComplete}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      className={cn(defaultInputClass, className)}
      value={focused ? text : formatCopPlain(safe)}
      onFocus={() => {
        setFocused(true);
        setText(formatCopPlain(safe));
      }}
      onBlur={() => {
        setFocused(false);
        onCommit(parseCopInput(text));
      }}
      onChange={(e) => {
        const el = e.target;
        const raw = el.value;
        const sel = el.selectionStart ?? raw.length;
        cursorDigitsRef.current = countDigitsBeforeIndex(raw, sel);
        const { n, empty } = parseCopInputMeta(raw);
        onCommit(n);
        setText(empty ? "" : formatCopPlain(n));
      }}
    />
  );
}
