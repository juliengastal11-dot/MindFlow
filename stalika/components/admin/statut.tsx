import { cn } from "@/lib/utils";

/** Les trois statuts en base, et leur libellé (CONTENU.md). Source unique de l'espace privé. */
export const STATUTS = {
  a_traiter: "À traiter",
  repondu: "Répondu",
  archive: "Archivée",
} as const;

export type Statut = keyof typeof STATUTS;

export const VALEURS_STATUT = Object.keys(STATUTS) as Statut[];

const CLASSES: Record<Statut, string> = {
  a_traiter: "bg-accent text-on-accent",
  repondu: "bg-muted",
  archive: "bg-muted text-muted-foreground",
};

export function estStatut(valeur: string): valeur is Statut {
  return valeur in STATUTS;
}

export function libelleStatut(valeur: string): string {
  return estStatut(valeur) ? STATUTS[valeur] : valeur;
}

export function PastilleStatut({ statut }: { statut: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs",
        estStatut(statut) ? CLASSES[statut] : "bg-muted text-muted-foreground",
      )}
    >
      {libelleStatut(statut)}
    </span>
  );
}
