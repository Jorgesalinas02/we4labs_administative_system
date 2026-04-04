import "server-only";
import { unstable_cache } from "next/cache";

/**
 * Segundos de reutilización de lecturas a Neon entre navegaciones (mismo tenant).
 * `0` / `off` / `false` desactiva la caché (siempre va a BD).
 * Por defecto 45s — equilibrio entre frescura y latencia con BD remota.
 */
export function getDataCacheRevalidateSeconds(): number {
  const v = process.env.DATA_CACHE_SECONDS?.trim().toLowerCase();
  if (v === "0" || v === "off" || v === "false") return 0;
  const n = Number(v ?? "45");
  if (!Number.isFinite(n) || n < 0) return 45;
  return Math.min(Math.floor(n), 300);
}

/** Encapsula `unstable_cache` con clave por segmento + argumentos (p. ej. tenantId). */
export function cacheByTenant<T>(
  segment: string,
  fetcher: (tenantId: string) => Promise<T>,
): (tenantId: string) => Promise<T> {
  const sec = getDataCacheRevalidateSeconds();
  if (sec <= 0) return fetcher;
  return unstable_cache(fetcher, [segment], { revalidate: sec });
}
