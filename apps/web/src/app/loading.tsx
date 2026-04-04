export default function AppLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-100"
        aria-hidden
      />
      <p className="text-sm text-zinc-500">Cargando…</p>
    </div>
  );
}
