import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatHeure } from "@/lib/formats";
import { SEPARATEUR_MULTIPLE } from "@/lib/questionnaire";
import { changerStatut } from "@/lib/actions/admin-demandes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PastilleStatut } from "@/components/admin/statut";
import { Supprimer } from "@/components/admin/supprimer";

export const metadata: Metadata = {
  title: "Demandes",
  robots: { index: false, follow: false },
};

// [[À CONFIRMER PAR L'UTILISATEUR : libellé d'un champ vide]]
const VIDE = "Non renseigné";

/** « 06 45 74 86 08 » ou « +33 6 45… » vers le format international sans « + » : « 33645748608 ». */
function numeroInternational(brut: string): string {
  let n = brut.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) return n.slice(1);
  if (n.startsWith("00")) return n.slice(2);
  if (n.startsWith("0")) return "33" + n.slice(1);
  return n;
}

function Valeur({ children }: { children: string | null | undefined }) {
  const texte = children?.trim();
  return texte ? <>{texte}</> : <span className="text-muted-foreground">{VIDE}</span>;
}

export default async function DemandePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ info?: string }>;
}) {
  const { id } = await params;
  const { info } = await searchParams;

  const d = await db.demande.findUnique({ where: { id } });
  if (!d) notFound();

  const objectifs = d.objectifs
    .split(SEPARATEUR_MULTIPLE)
    .map((o) => o.trim())
    .filter(Boolean);

  const estWhatsApp = d.contactMode === "whatsapp";
  const numero = estWhatsApp ? numeroInternational(d.contactValeur) : "";
  // [[À CONFIRMER : message prérempli du bouton WhatsApp, absent de CONTENU.md]]
  const message = `Bonjour ${d.prenom}, c'est Julien de Stalika. Merci pour vos réponses, `;
  const hrefReponse = estWhatsApp
    ? `https://wa.me/${numero}?text=${encodeURIComponent(message)}`
    : `mailto:${d.contactValeur}`;
  const hrefContact = estWhatsApp ? `https://wa.me/${numero}` : `mailto:${d.contactValeur}`;

  return (
    <div data-src="app/admin/demandes/[id]/page.tsx">
      <Link href="/admin" className="eyebrow text-muted-foreground hover:underline cursor-pointer">
        Toutes les demandes
      </Link>

      <h1 className="font-display text-3xl mt-4">
        {d.prenom} · {d.activite}
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
        <span>
          Reçue le {formatDate(d.createdAt)} à {formatHeure(d.createdAt)}
        </span>
        <PastilleStatut statut={d.statut} />
      </p>

      {info === "statut" && (
        <p role="status" className="mt-6 text-sm">
          Statut mis à jour.
        </p>
      )}

      <Card className="mt-8 p-6">
        <dl className="grid gap-y-3 sm:grid-cols-[200px_1fr]">
          <dt className="text-muted-foreground">Situation</dt>
          <dd><Valeur>{d.situation}</Valeur></dd>

          <dt className="text-muted-foreground">Le site doit servir à</dt>
          <dd>
            {objectifs.length > 0 ? (
              <ul className="list-disc pl-5">
                {objectifs.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            ) : (
              <Valeur>{null}</Valeur>
            )}
          </dd>

          <dt className="text-muted-foreground">Ce que ses clients demandent</dt>
          <dd><Valeur>{d.demandeClients}</Valeur></dd>

          <dt className="text-muted-foreground">Logo et photos</dt>
          <dd><Valeur>{d.actifs}</Valeur></dd>

          <dt className="text-muted-foreground">{"Un site qu'il aime"}</dt>
          <dd><Valeur>{d.siteAime}</Valeur></dd>

          <dt className="text-muted-foreground">Budget</dt>
          <dd><Valeur>{d.budget}</Valeur></dd>

          <dt className="text-muted-foreground">Délai</dt>
          <dd><Valeur>{d.delai}</Valeur></dd>

          <dt className="text-muted-foreground">Contact</dt>
          <dd>
            {d.contactValeur.trim() ? (
              <a
                href={estWhatsApp ? hrefContact : `mailto:${d.contactValeur}`}
                className="underline underline-offset-4 cursor-pointer"
                {...(estWhatsApp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {d.contactValeur}
              </a>
            ) : (
              <Valeur>{null}</Valeur>
            )}
          </dd>

          <dt className="text-muted-foreground">Consentement</dt>
          <dd>{d.consentement ? "Oui" : "Non"}</dd>
        </dl>
      </Card>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button asChild variant="accent">
          <a
            href={hrefReponse}
            {...(estWhatsApp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {estWhatsApp ? "Répondre sur WhatsApp" : "Répondre par e-mail"}
          </a>
        </Button>

        <form action={changerStatut.bind(null, d.id, "repondu")}>
          <Button type="submit" variant="outline">
            Marquer répondu
          </Button>
        </form>

        <form action={changerStatut.bind(null, d.id, "archive")}>
          <Button type="submit" variant="outline">
            Archiver
          </Button>
        </form>

        <Supprimer id={d.id} />
      </div>
    </div>
  );
}
