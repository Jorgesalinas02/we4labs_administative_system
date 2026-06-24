export const dynamic = "force-dynamic";
import { loadCostCenters, loadClients, loadCategoryEntries, loadBusinessCategories } from "@/lib/data";
import { CostCentersView } from "@/components/cost-centers-view";

export default async function CentrosDeCostosPage() {
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }

  const [centers, clientsList, categoryEntries, categories] = await Promise.all([
    loadCostCenters(),
    loadClients(),
    loadCategoryEntries(),
    loadBusinessCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Centros de costos</h1>
        <p className="text-sm text-zinc-500">
          Gestiona tus proyectos, asigna presupuesto cotizado y monitorea el gasto real desde el flujo de caja.
        </p>
      </div>
      <CostCentersView
        initialCenters={centers}
        clients={clientsList}
        entries={categoryEntries.entries}
        categories={categories}
      />
    </div>
  );
}
