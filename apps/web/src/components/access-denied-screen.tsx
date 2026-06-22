"use client";

import { SignOutButton } from "@clerk/nextjs";

export function AccessDeniedScreen({ email }: { email: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <svg className="h-7 w-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Acceso no autorizado</h1>
        <p className="mt-2 text-sm text-zinc-500">
          El correo{" "}
          <span className="font-medium text-zinc-700">{email || "desconocido"}</span> no está autorizado
          para ingresar al sistema.
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Solicita al administrador que registre tu correo en Configuración.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
