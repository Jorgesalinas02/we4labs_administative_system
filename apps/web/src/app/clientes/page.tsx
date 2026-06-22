import { loadClients } from "@/lib/data";
import { ClientsView } from "@/components/clients-view";

export default async function ClientesPage() {
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }

  const clientsList = await loadClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-zinc-500">
          Directorio de clientes del negocio. Puedes añadir, editar y eliminar registros.
        </p>
      </div>
      <ClientsView initialClients={clientsList} />
    </div>
  );
}
