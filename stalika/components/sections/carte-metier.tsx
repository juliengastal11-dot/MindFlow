"use client";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Carte métier : une page de site dessinée en code, sans image.

   En mode `modele`, la carte est le site « fait à la chaîne » : trois barres
   grises identiques et un rond gris. En mode métier, la bordure passe à
   l'accent, un glyphe propre au métier apparaît avec le nom, et l'agencement
   des barres change d'un métier à l'autre pour que neuf cartes ne se
   ressemblent pas. Décor pur : la carte ne mène nulle part.
--------------------------------------------------------------------------- */

type Barre = string;

/** Un agencement de barres par métier : largeur et hauteur, en classes. */
const AGENCEMENTS: Record<string, readonly Barre[]> = {
  Restaurant: ["h-1.5 w-full", "h-1.5 w-2/3", "h-5 w-full"],
  Coach: ["h-5 w-1/2", "h-1.5 w-full", "h-1.5 w-3/4", "h-1.5 w-1/2"],
  Artisan: ["h-1.5 w-1/3", "h-5 w-full", "h-1.5 w-2/3"],
  Boutique: ["h-4 w-full", "h-4 w-full", "h-1.5 w-1/2"],
  Cabinet: ["h-1.5 w-full", "h-1.5 w-full", "h-1.5 w-full", "h-1.5 w-1/3"],
  Traiteur: ["h-1.5 w-3/4", "h-5 w-2/3", "h-1.5 w-full"],
  Photographe: ["h-7 w-full", "h-1.5 w-1/2"],
  Salon: ["h-1.5 w-1/2", "h-1.5 w-full", "h-5 w-3/4"],
  Association: ["h-1.5 w-2/3", "h-1.5 w-full", "h-1.5 w-1/2", "h-4 w-1/3"],
};

const PAR_DEFAUT: readonly Barre[] = ["h-1.5 w-full", "h-1.5 w-2/3", "h-1.5 w-1/2"];

/** Un glyphe par métier, dans une grille de 24. */
function Glyphe({ nom }: { nom: string }) {
  let dessin: React.ReactNode;
  switch (nom) {
    case "Restaurant":
      dessin = (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
        </>
      );
      break;
    case "Coach":
      dessin = <path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" />;
      break;
    case "Artisan":
      dessin = <path d="M4 20l6-6M10 14l-3-3 6-7 7 4-4 7z" />;
      break;
    case "Boutique":
      dessin = (
        <>
          <path d="M5 8h14l-1 12H6z" />
          <path d="M9 8a3 3 0 016 0" />
        </>
      );
      break;
    case "Cabinet":
      dessin = (
        <>
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M9 8V6h6v2M3 13h18" />
        </>
      );
      break;
    case "Traiteur":
      dessin = <path d="M4 17a8 8 0 0116 0zM2 20h20M12 9V7" />;
      break;
    case "Photographe":
      dessin = (
        <>
          <path d="M4 8h4l2-3h4l2 3h4v11H4z" />
          <circle cx="12" cy="13" r="3" />
        </>
      );
      break;
    case "Salon":
      dessin = (
        <>
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="M7.5 16L18 4M16.5 16L6 4" />
        </>
      );
      break;
    case "Association":
      dessin = <path d="M3 12l4-4 4 2 4-2 6 5-5 5-3-2-3 2z" />;
      break;
    default:
      dessin = <circle cx="12" cy="12" r="8" />;
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0 stroke-accent md:size-6"
    >
      {dessin}
    </svg>
  );
}

export function CarteMetier({ nom, modele = false }: { nom: string; modele?: boolean }) {
  if (modele) {
    return (
      <div className="flex aspect-[4/3] h-full w-full flex-col justify-between rounded-card border border-border bg-card p-3 md:p-4">
        <div className="flex items-center gap-2">
          <span className="size-5 shrink-0 rounded-full bg-muted md:size-6" />
          <span className="h-1.5 w-1/3 rounded-full bg-muted" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="h-1.5 w-full rounded-full bg-muted" />
          <span className="h-1.5 w-full rounded-full bg-muted" />
          <span className="h-1.5 w-full rounded-full bg-muted" />
        </div>
        <span className="text-xs text-muted-foreground">{nom}</span>
      </div>
    );
  }

  const barres = AGENCEMENTS[nom] ?? PAR_DEFAUT;
  return (
    <div className="flex aspect-[4/3] h-full w-full flex-col justify-between rounded-card border border-accent bg-card p-3 md:p-4">
      <div className="flex items-center gap-2">
        <Glyphe nom={nom} />
        <span className="font-display text-sm md:text-base">{nom}</span>
      </div>
      <div className="flex flex-col gap-2">
        {barres.map((classes, i) => (
          <span key={i} className={cn("rounded-full bg-muted", classes)} />
        ))}
      </div>
    </div>
  );
}
