export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { ConfiguracionView } from "@/components/configuracion-view";
import { getCurrentUserEmail, isDevBypass, resolveUserRole } from "@/lib/access";
import { loadEmailAllowlist } from "@/lib/data";

export default async function ConfiguracionPage() {
  // Solo administradores pueden gestionar usuarios.
  const role = await resolveUserRole();
  if (role !== "admin") redirect("/dashboard");

  const email = (await getCurrentUserEmail()) ?? (isDevBypass() ? "dev@local" : "");
  const emails = await loadEmailAllowlist();

  return <ConfiguracionView initialEmails={emails} currentEmail={email} />;
}
