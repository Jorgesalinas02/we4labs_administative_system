import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Carga env del monorepo para `migrate` / `seed` alineado con Next (`apps/web/.env.local`).
 * Orden: `.env` raíz, luego `apps/web/.env.local` con override (misma `DATABASE_URL` que la web).
 */
export function loadMonorepoEnv() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "../../..");
  config({ path: path.join(root, ".env") });
  config({ path: path.join(root, "apps/web/.env.local"), override: true });
  config();
}
