import { cn } from "@/lib/cn";

/**
 * Formato tipo “dashboard de pendientes”: rejilla con bordes finos, cabeceras en mayúsculas,
 * segunda fila para filtros (cuando aplica), filas alternas. Paleta neutra zinc (no colores del mock).
 */
export const dataTable = {
  shell: "overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800",
  table: "w-full border-collapse text-sm",
  /** Fila de títulos de columna */
  trHeadLabels: "bg-zinc-100 dark:bg-zinc-900/70",
  thLabel:
    "border border-zinc-200 px-3 py-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-300",
  thLabelRight: "text-right",
  thLabelNarrow: "w-12 whitespace-nowrap",
  /** Fila de filtros */
  trHeadFilters: "bg-zinc-50 dark:bg-zinc-900/40",
  thFilter: "border border-zinc-200 p-2 align-middle dark:border-zinc-800",
  filterInput:
    "h-8 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500",
  filterSelect: "h-8 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100",
  /** Cuerpo: cebra */
  trBody: (index: number) =>
    cn(
      "border-b border-zinc-200 dark:border-zinc-800",
      index % 2 === 0 ? "bg-white dark:bg-zinc-950" : "bg-zinc-50/90 dark:bg-zinc-900/35",
    ),
  td: "border-x border-zinc-100 px-3 py-3 align-middle text-zinc-800 dark:border-zinc-800/80 dark:text-zinc-200",
  tdNum: "text-right tabular-nums tracking-tight",
  tdTruncate: "max-w-[14rem] truncate",
} as const;
