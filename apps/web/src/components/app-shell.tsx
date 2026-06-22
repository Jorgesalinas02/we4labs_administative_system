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
  TrendingUp,
  Users,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/cn";
import { PusherAlerts } from "@/components/pusher-alerts";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/supuestos", label: "Supuestos", icon: Layers },
  { href: "/flujo-caja", label: "Flujo de caja", icon: Wallet },
  { href: "/proyecciones", label: "Proyecciones", icon: TrendingUp },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/cartera", label: "Cuentas por Cobrar", icon: Landmark },
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
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
      <PusherAlerts tenantId={tenantId ?? null} />
      <div className="flex min-h-screen flex-col md:flex-row md:items-start">
        <aside
          className={cn(
            "w-full shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
            "md:sticky md:top-0 md:h-screen md:w-60 md:min-w-[15rem] md:max-w-[15rem]",
            "md:overflow-y-auto md:border-b-0 md:border-r",
          )}
        >
          <div className="flex items-center justify-between p-4">
            <div>
              <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                We4Labs Admin
              </Link>
              <p className="mt-0.5 text-xs text-zinc-500">Sistema administrativo</p>
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-x-visible md:px-3">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                prefetch
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
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
        <main className="min-w-0 flex-1 overflow-x-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
