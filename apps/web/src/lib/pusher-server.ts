import "server-only";
import Pusher from "pusher";

export function getPusherServer(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER ?? "mt1";
  if (!appId || !key || !secret) return null;
  return new Pusher({ appId, key, secret, cluster, useTLS: true });
}

export function tenantChannelName(tenantId: string) {
  return `private-tenant-${tenantId}`;
}
