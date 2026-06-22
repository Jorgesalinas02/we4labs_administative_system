"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso: string): string {
  if (!iso) return "";
  const d = isoToDate(iso);
  if (!d) return "";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

type Props = {
  value: string; // YYYY-MM-DD or ""
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
};

export function DatePickerInput({ value, onChange, placeholder = "Selecciona una fecha", className }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => isoToDate(value) ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const selected = isoToDate(value);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm text-left transition-colors",
          "hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600",
          !value && "text-zinc-400 dark:text-zinc-500",
          className,
        )}
      >
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span className="flex-1 truncate">
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="ml-auto shrink-0 rounded p-0.5 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Popover calendar */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <DayPicker
            mode="single"
            locale={es}
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            onSelect={(day) => {
              onChange(day ? dateToIso(day) : "");
              if (day) setOpen(false);
            }}
            classNames={{
              root: "p-3",
              month_caption: "flex items-center justify-between px-1 pb-2",
              caption_label: "text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-100",
              nav: "flex items-center gap-1",
              button_previous: "flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              button_next: "flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              weeks: "mt-1",
              weekdays: "grid grid-cols-7 mb-1",
              weekday: "text-center text-xs font-medium uppercase text-zinc-400 py-1",
              week: "grid grid-cols-7",
              day: "flex items-center justify-center",
              day_button: cn(
                "h-8 w-8 rounded-md text-sm transition-colors",
                "text-zinc-700 hover:bg-zinc-100",
                "dark:text-zinc-300 dark:hover:bg-zinc-800",
              ),
              selected: "[&>button]:bg-zinc-900 [&>button]:text-white [&>button]:hover:bg-zinc-700 dark:[&>button]:bg-zinc-100 dark:[&>button]:text-zinc-900",
              today: "[&>button]:font-bold [&>button]:text-zinc-900 dark:[&>button]:text-zinc-100",
              outside: "[&>button]:text-zinc-300 dark:[&>button]:text-zinc-600",
              disabled: "[&>button]:opacity-30 [&>button]:cursor-not-allowed",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left"
                  ? <ChevronLeft className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />,
            }}
          />
        </div>
      )}
    </div>
  );
}
