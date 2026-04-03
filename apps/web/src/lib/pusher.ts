/**
 * Cliente Pusher opcional para alertas (cartera / calendario).
 * Configurar NEXT_PUBLIC_PUSHER_* y credenciales servidor cuando se integre.
 */
export function getPusherConfig() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  return { key, cluster };
}
