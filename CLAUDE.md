# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                  # Next.js dev server (port 3000)
pnpm build                # Build all packages in order
pnpm lint                 # Lint all packages
pnpm test                 # Tests in @we4labs/shared only

pnpm db:migrate           # Apply SQL migrations to DATABASE_URL
pnpm db:seed              # Load demo data
pnpm db:generate          # Generate migration SQL from schema (often broken due to ESM issues — prefer writing SQL manually)
pnpm db:studio            # Drizzle Studio GUI
```

After changing `packages/db/src/schema.ts`, run `pnpm --filter @we4labs/db build` before importing the new exports in `apps/web`.

## Architecture

**Monorepo** (pnpm workspaces):
- `apps/web` — Next.js 15 App Router, all UI and API routes
- `packages/db` — Drizzle ORM schema, `withTenant()`, migration runner
- `packages/shared` — Zod schemas, `UserRole` type, nómina calculator, cash flow helpers

### Multi-tenant & RLS

Every query must go through `withTenant(sql, tenantId, fn)` from `@we4labs/db`. This wraps the query in a transaction that sets `app.tenant_id` via `set_config`, which PostgreSQL RLS policies use to filter rows. Never query without `withTenant` — RLS will return empty results or errors.

**Single tenant system**: `resolveTenantId()` in `apps/web/src/lib/tenant.ts` returns the one tenant in the DB. Access is controlled by `email_allowlist` (not Clerk orgs).

In dev: set `DEV_TENANT_ID=<uuid>` in `apps/web/.env.local` to bypass Clerk auth and email allowlist entirely.

### Data layer (`apps/web/src/lib/`)

- `db.ts` — singleton `getSql()` / `getDb()` (avoid recreating connections)
- `tenant.ts` — `resolveTenantId()`, cached with React `cache()`
- `access.ts` — `requireAllowedAccess()` (any user) and `requireAdminAccess()` (admin only) for Route Handlers; `resolveUserRole()` for server components
- `data.ts` — all read functions; pattern: `runLoad*()` → wrapped with `cacheByTenant()` → exported as `load*()`
- `data-cache.ts` — `cacheByTenant(segment, fetcher)` uses `unstable_cache` with 45s revalidation by default (override via `DATA_CACHE_SECONDS` env var)

### API routes

All route handlers live in `apps/web/src/app/api/`. Pattern:
- GET: `requireAllowedAccess()` (any authorized user)
- POST/PATCH/DELETE: `requireAdminAccess()` (admin only)
- Always check `!process.env.DATABASE_URL` and return 400 before querying
- Always `resolveTenantId()` and include `tenantId` in all writes

### Roles & UI gating

Roles: `"admin"` (full access) | `"consultor"` (read-only). Stored in `email_allowlist.role`.

`RoleProvider` in `app/layout.tsx` wraps the whole app. Components use `useRole()` or `<AdminOnly>` to hide mutation controls. The backend (`requireAdminAccess`) is the real enforcement — UI gating is UX only.

### Migrations

**`drizzle-kit generate` is broken** (ESM issue). Write migration SQL manually in `packages/db/drizzle/` following the numbering pattern (e.g. `0019_foo.sql`).

Every new table needs:
```sql
ALTER TABLE "my_table" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_my_table" ON "my_table"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id::text = current_setting('app.tenant_id', true));
```

**Warning**: `pnpm db:migrate` has silently failed before (journal hash mismatch). Verify the table actually exists after running. If it doesn't, apply the DDL directly via a Node script using the `postgres` library.

### Adding a new CRUD module

Follow the pattern in `clients` / `team`:
1. Add table to `packages/db/src/schema.ts`
2. Write migration SQL in `packages/db/drizzle/00NN_name.sql` (with RLS)
3. Rebuild db: `pnpm --filter @we4labs/db build`
4. Add `load*()` function in `apps/web/src/lib/data.ts` using `cacheByTenant`
5. Add API route in `apps/web/src/app/api/<resource>/route.ts`
6. Create page `apps/web/src/app/<path>/page.tsx` with `export const dynamic = "force-dynamic"`
7. Add nav entry in `apps/web/src/components/app-shell.tsx`

### Git & deploy

Two remotes:
- `origin` → `Jorgesalinas02/we4labs_administrative` (GitHub)
- `new-origin` → `Jorgesalinas02/we4labs_administative_system` (connected to Vercel — **push here to deploy**)

Workflow: create a feature branch (`feat/` or `fix/`), commit, PR to main via `origin`, then after merge: `git pull origin main && git push new-origin main`.

Production URL: `we4labs-administative-system-git-main-jorgesalinas02s-projects.vercel.app`

### Key env vars (`apps/web/.env.local`)

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `DEV_TENANT_ID` | UUID — bypasses Clerk + email allowlist in dev |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Required even with `DEV_TENANT_ID` |
| `DATA_CACHE_SECONDS` | Override 45s data cache (`0` disables) |
