# We4Labs — sistema administrativo

Monorepo: Next.js (App Router), paquetes compartidos, PostgreSQL con **RLS** multi-tenant, y carpeta **`Material/`** con plantillas Excel/Word como referencia de dominio.

## Requisitos

- Node 20+
- pnpm 10+
- Docker (opcional, para Postgres local)

## Configuración rápida

### Opción A — Postgres local (Docker)

```bash
cp .env.example .env
docker compose up -d
pnpm install --no-frozen-lockfile
pnpm db:migrate
pnpm db:seed
```

### Opción B — Neon (Postgres en la nube)

1. Crea un proyecto en [Neon](https://neon.tech) y una base (p. ej. `neondb`).
2. Copia la **connection string** (PostgreSQL). Añade `?sslmode=require` si no viene.
3. En la **raíz** del repo, crea `.env` con:
   `DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require`
4. En **`apps/web/.env.local`** pon la **misma** `DATABASE_URL` (Next solo lee esa carpeta).
5. Sin Docker: `pnpm install --no-frozen-lockfile` → `pnpm db:migrate` → `pnpm db:seed` → `pnpm dev`.

Las migraciones y el seed cargan `DATABASE_URL` desde el `.env` de la raíz del monorepo.

**Neon y RLS:** si `pnpm db:seed` falla por permisos, en el SQL Editor de Neon puede hacer falta que el rol de conexión pueda hacer seed inicial. Consulta la [documentación de roles en Neon](https://neon.tech/docs/manage/roles); en muchos casos el rol creado para la connection string ya puede aplicar migraciones y datos iniciales.

### Arranque de la app

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) (redirige a `/dashboard`).

## Scripts

| Comando | Descripción |
| ------- | ----------- |
| `pnpm dev` | Next.js en desarrollo |
| `pnpm db:migrate` | Aplica migraciones Drizzle + RLS |
| `pnpm db:seed` | Datos demo Colombia / We4Labs |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm build` | Build de todos los paquetes |

## Estructura

- `apps/web` — UI responsive (Dashboard, Supuestos, Flujo de caja, Cartera, Calendario, Guía, Nómina).
- `packages/shared` — Esquemas Zod y calculadora nómina Colombia (MVP).
- `packages/db` — Drizzle, `withTenant()` para `app.tenant_id`, migraciones SQL.
- `services/api` — Esqueleto de handlers para AWS Lambda (misma lógica que se puede invocar desde API Gateway).
- `infra/cdk` — **AWS CDK**: Aurora Serverless v2 + RDS Proxy ([`infra/cdk/lib/we4labs-data-stack.ts`](infra/cdk/lib/we4labs-data-stack.ts)).
- `docs/MATERIAL-INVENTORY.md` — Inventario Material → modelo de datos.

## Multi-tenant y RLS

Las políticas exigen `set_config('app.tenant_id', …, true)` en cada transacción (ver `withTenant` en `@we4labs/db`). En local, la migración `0002` otorga `BYPASSRLS` al rol `we4labs` solo para facilitar seeds; en producción usar un rol **sin** `BYPASSRLS`.

## Material (Excel / Word)

Archivos fuente de requisitos en `Material/`:

- `Material/Flujo_de_Caja_Pyme_SAS completo.xlsx` — libro de referencia (hoja **Control de Cartera** → módulo `/cartera`).
- `calculadora_nomina_colombia.xlsx` — lógica y guía legal de referencia.
- `Guia_Obligaciones_We4Labs.docx` — contenido base de la guía tributaria.

No se ejecutan en runtime; sirven para validar paridad y poblar datos.

## Disclaimer legal

Calculadora de nómina y fechas tributarias son **estimaciones / recordatorios**. Validar siempre con normativa vigente y asesoría profesional.
