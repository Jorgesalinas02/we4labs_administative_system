"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Calculator,
  Layers,
  Wallet,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PusherAlerts } from "@/components/pusher-alerts";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/supuestos", label: "Supuestos", icon: Layers },
  { href: "/flujo-caja", label: "Flujo de caja", icon: Wallet },
  { href: "/cartera", label: "Cartera", icon: Landmark },
  { href: "/calendario-tributario", label: "Calendario tributario", icon: CalendarDays },
  { href: "/guia-obligaciones", label: "Guía obligaciones", icon: BookOpen },
  { href: "/nomina", label: "Nómina", icon: Calculator },
];

export function AppShell({
  children,
  tenantId,
}: {
  children: React.ReactNode;
  tenantId?: string | null;
}) {
  const pathname = usePathname() ?? "";
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PusherAlerts tenantId={tenantId ?? null} />
      <div className="flex flex-col md:flex-row">
        <aside className="w-full border-b border-zinc-200 bg-white md:w-60 md:min-h-screen md:border-b-0 md:border-r dark:border-zinc-800 dark:bg-zinc-950">
          <div className="p-4">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              We4Labs Admin
            </Link>
            <p className="mt-1 text-xs text-zinc-500">Colombia · multi-tenant</p>
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-3">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
                  pathname === href &&
                    "bg-zinc-900 text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-100",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
