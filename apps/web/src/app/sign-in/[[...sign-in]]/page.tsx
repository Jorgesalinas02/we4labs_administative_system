import { SignIn } from "@clerk/nextjs";
import { AuthBranding } from "@/components/auth-branding";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-xl shadow-zinc-200/50">
        <AuthBranding subtitle="Inicia sesión para continuar" />
        <p className="mb-6 text-center text-xs text-zinc-400">
          Solo usuarios con correo autorizado pueden ingresar.
        </p>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 p-0",
            },
          }}
        />
      </div>
    </div>
  );
}
