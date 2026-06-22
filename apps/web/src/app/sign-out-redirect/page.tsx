"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AuthBranding } from "@/components/auth-branding";

export default function SignOutRedirectPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    void signOut({ redirectUrl: "/sign-in" }).catch(() => {
      router.replace("/sign-in");
    });
  }, [signOut, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <AuthBranding subtitle="Cerrando sesión…" />
        <p className="text-sm text-zinc-500">Redirigiendo al inicio de sesión</p>
      </div>
    </div>
  );
}
