"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";

const AUTH_PATHS = ["/sign-in", "/sign-up", "/sign-out-redirect"];

export function ConditionalShell({
  children,
  tenantId,
}: {
  children: React.ReactNode;
  tenantId?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPage) return <>{children}</>;
  return <AppShell tenantId={tenantId}>{children}</AppShell>;
}
