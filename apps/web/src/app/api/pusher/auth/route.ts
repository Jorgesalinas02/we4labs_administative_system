import { NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { resolveTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

/** Autoriza suscripción a canales privados Pusher; alinea tenant con sesión. */
export async function POST(req: Request) {
  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json({ error: "Pusher no configurado" }, { status: 503 });
  }

  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "Sin tenant" }, { status: 401 });
  }

  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channelName = String(form.get("channel_name") ?? "");

  if (!socketId || !channelName.startsWith("private-tenant-")) {
    return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
  }

  const expected = `private-tenant-${tenantId}`;
  if (channelName !== expected) {
    return NextResponse.json({ error: "Canal no permitido para este tenant" }, { status: 403 });
  }

  const auth = pusher.authorizeChannel(socketId, channelName);
  return NextResponse.json(auth);
}
