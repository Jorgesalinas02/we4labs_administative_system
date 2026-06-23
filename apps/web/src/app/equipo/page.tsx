export const dynamic = "force-dynamic";
import { loadTeamMembers } from "@/lib/data";
import { TeamView } from "@/components/team-view";

export default async function EquipoPage() {
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }

  const members = await loadTeamMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Equipo</h1>
        <p className="text-sm text-zinc-500">
          Registra aquí a los miembros del equipo: empleados, contratistas y socios. Podrás
          asociarlos a las transacciones de egresos en el flujo de caja.
        </p>
      </div>
      <TeamView initialMembers={members} />
    </div>
  );
}
