"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@we4labs/shared";

type RoleContextValue = { role: UserRole | null; isAdmin: boolean };

const RoleContext = createContext<RoleContextValue>({ role: null, isAdmin: false });

/** Provee el rol del usuario actual a los componentes cliente. */
export function RoleProvider({
  role,
  children,
}: {
  role: UserRole | null;
  children: React.ReactNode;
}) {
  return (
    <RoleContext.Provider value={{ role, isAdmin: role === "admin" }}>
      {children}
    </RoleContext.Provider>
  );
}

/** Hook: rol actual e indicador `isAdmin`. */
export function useRole() {
  return useContext(RoleContext);
}

/** Renderiza children solo si el usuario es admin (oculta acciones de escritura). */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useRole();
  return isAdmin ? <>{children}</> : null;
}
