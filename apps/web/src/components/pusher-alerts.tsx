"use client";

import { useEffect, useState } from "react";
import PusherClient from "pusher-js";
import { getPusherConfig } from "@/lib/pusher";

type Props = { tenantId: string | null };

/**
 * Suscripción a eventos de cartera/calendario. Publicar desde backend con getPusherServer().trigger.
 */
export function PusherAlerts({ tenantId }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const cfg = getPusherConfig();

  useEffect(() => {
    if (!cfg?.key || !cfg.cluster || !tenantId) return;

    const pusher = new PusherClient(cfg.key, {
      cluster: cfg.cluster,
      authEndpoint: "/api/pusher/auth",
      authTransport: "ajax",
    });

    const channel = pusher.subscribe(`private-tenant-${tenantId}`);
    channel.bind("portfolio-reminder", (data: { message?: string }) => {
      setToast(data?.message ?? "Recordatorio de cartera");
    });
    channel.bind("tax-deadline", (data: { message?: string }) => {
      setToast(data?.message ?? "Alerta tributaria");
    });

    return () => {
      pusher.unsubscribe(`private-tenant-${tenantId}`);
      pusher.disconnect();
    };
  }, [cfg?.key, cfg?.cluster, tenantId]);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      role="status"
    >
      <p>{toast}</p>
      <button
        type="button"
        className="mt-2 text-xs text-blue-600 underline dark:text-blue-400"
        onClick={() => setToast(null)}
      >
        Cerrar
      </button>
    </div>
  );
}
