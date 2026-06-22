export function AuthBranding({
  title = "We4Labs",
  subtitle = "Sistema administrativo",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-600/20">
        W4
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}
