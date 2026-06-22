import { NextResponse } from "next/server";
import { businessCategories, withTenant } from "@we4labs/db";
import { ALL_CATEGORIES_CATALOG } from "@we4labs/shared";
import { and, eq } from "drizzle-orm";
import { getSql } from "@/lib/db";
import { resolveTenantId } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  const sql = getSql();
  const rows = await withTenant(sql, tenantId, (db) =>
    db
      .select()
      .from(businessCategories)
      .where(eq(businessCategories.tenantId, tenantId))
      .orderBy(businessCategories.sortOrder, businessCategories.createdAt),
  );
  return NextResponse.json(rows);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

export async function POST(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    const sql = getSql();

    // ── Modo 1: selección del catálogo ────────────────────────────
    if (Array.isArray(raw.codes) && raw.codes.length > 0) {
      await withTenant(sql, tenantId, async (db) => {
        const existing = await db
          .select({ code: businessCategories.code })
          .from(businessCategories)
          .where(eq(businessCategories.tenantId, tenantId));
        const existingCodes = new Set(existing.map((r) => r.code));

        let order = existing.length;
        for (const code of raw.codes as string[]) {
          if (existingCodes.has(code)) continue;
          const def = ALL_CATEGORIES_CATALOG.find((c) => c.code === code);
          if (!def) continue;
          await db.insert(businessCategories).values({
            tenantId,
            kind: def.kind,
            parentCode: def.parentCode,
            parentLabel: def.parentLabel,
            code: def.code,
            label: def.label,
            asksClient: def.asksClient,
            sortOrder: order++,
          });
        }
      });
      revalidatePath("/supuestos");
      return NextResponse.json({ ok: true });
    }

    // ── Modo 2: categoría personalizada ──────────────────────────
    const { custom } = raw as {
      custom?: {
        kind: string;
        label: string;
        parentLabel: string;
        asksClient?: string;
      };
    };
    if (
      !custom ||
      typeof custom.label !== "string" ||
      !custom.label.trim() ||
      typeof custom.parentLabel !== "string" ||
      !custom.parentLabel.trim() ||
      (custom.kind !== "income" && custom.kind !== "expense")
    ) {
      return NextResponse.json({ error: "Datos inválidos para categoría personalizada" }, { status: 400 });
    }

    const parentCode = slugify(custom.parentLabel) || "custom";
    const code = `custom_${slugify(custom.label)}_${Date.now()}`;

    await withTenant(sql, tenantId, async (db) => {
      const existing = await db
        .select({ code: businessCategories.code })
        .from(businessCategories)
        .where(eq(businessCategories.tenantId, tenantId));
      await db.insert(businessCategories).values({
        tenantId,
        kind: custom.kind as "income" | "expense",
        parentCode,
        parentLabel: custom.parentLabel.trim(),
        code,
        label: custom.label.trim(),
        asksClient: custom.asksClient ?? "none",
        sortOrder: existing.length,
      });
    });

    revalidatePath("/supuestos");
    return NextResponse.json({ ok: true, code });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const tenantId = await resolveTenantId();
  if (!tenantId || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sin tenant o base de datos" }, { status: 400 });
  }
  try {
    const raw = await req.json();
    if (!raw?.code || typeof raw.code !== "string") {
      return NextResponse.json({ error: "code requerido" }, { status: 400 });
    }
    const body = { code: raw.code as string };
    const sql = getSql();
    await withTenant(sql, tenantId, (db) =>
      db
        .delete(businessCategories)
        .where(
          and(
            eq(businessCategories.tenantId, tenantId),
            eq(businessCategories.code, body.code),
          ),
        ),
    );
    revalidatePath("/supuestos");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
