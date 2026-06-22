export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { ConfiguracionView } from "@/components/configuracion-view";
import { getCurrentUserEmail, checkEmailAccess } from "@/lib/access";
import { loadEmailAllowlist } from "@/lib/data";

export default async function ConfiguracionPage() {
  const email = await getCurrentUserEmail();
  if (!email) redirect("/sign-in");

  const allowed = await checkEmailAccess(email);
  if (!allowed) redirect("/sign-in");

  const emails = await loadEmailAllowlist();

  return <ConfiguracionView initialEmails={emails} currentEmail={email} />;
}
