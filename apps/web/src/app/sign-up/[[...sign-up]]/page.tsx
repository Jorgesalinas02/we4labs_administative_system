import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { AuthBranding } from "@/components/auth-branding";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-xl shadow-zinc-200/50">
        <AuthBranding subtitle="Crea tu cuenta" />
        <p className="mb-6 text-center text-xs text-zinc-400">
          Tras registrarte, un administrador debe autorizar tu correo en Configuración.
        </p>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 p-0",
            },
          }}
        />
        <p className="mt-6 text-center text-xs text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/sign-in" className="font-medium text-emerald-700 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
