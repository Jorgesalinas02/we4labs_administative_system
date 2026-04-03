import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Carga `/.env` en la raíz del monorepo para `migrate` / `seed` sin duplicar archivos. */
export function loadMonorepoEnv() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "../../..");
  config({ path: path.join(root, ".env") });
  config();
}
