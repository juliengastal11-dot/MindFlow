import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/formats";
import { Card } from "@/components/ui/card";
import { PastilleStatut } from "@/components/admin/statut";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ info?: string }>;
}) {
  const { info } = await searchParams;

  const [demandes, aTraiter] = await Promise.all([
    db.demande.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.demande.count({ where: { statut: "a_traiter" } }),
  ]);

  return (
    <div data-src="app/admin/page.tsx">
      <h1 className="font-display text-3xl">Demandes reçues</h1>
      <p className="eyebrow text-muted-foreground mt-2">{aTraiter} à traiter</p>

      {info === "supprimee" && (
        <p role="status" className="mt-6 text-sm">
          Demande supprimée.
        </p>
      )}

      {demandes.length === 0 ? (
        <Card className="mt-8 p-6">
          <p>{"Aucune demande pour l'instant. Elles arriveront ici dès que quelqu'un ira au bout de la conversation."}</p>
        </Card>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="py-3 pr-4 font-medium">Date</th>
                <th scope="col" className="py-3 pr-4 font-medium">Prénom</th>
                <th scope="col" className="py-3 pr-4 font-medium">Activité</th>
                <th scope="col" className="py-3 pr-4 font-medium">Budget</th>
                <th scope="col" className="py-3 pr-4 font-medium">Délai</th>
                <th scope="col" className="py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id} className="border-b border-border">
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/demandes/${d.id}`} className="font-medium hover:underline cursor-pointer">
                      {d.prenom}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{d.activite}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{d.budget}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{d.delai}</td>
                  <td className="py-3">
                    <PastilleStatut statut={d.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
