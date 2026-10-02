import { Bell, Check, ChevronsUpDown, MousePointer2, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ton } from "@/lib/demos";

/* ---------------------------------------------------------------------------
   Les pièces communes des trois interfaces de démonstration : la fenêtre
   (barre du haut, barre latérale, curseur), les pastilles d'état, les cases,
   les avatars, les boutons, les barres de progression et la notification.

   Le clair des fenêtres vient de `.jour` ; la couleur du logiciel, de
   `--color-produit`, posée par la carte. Les tailles suivent celles d'une
   vraie application réduite à la taille d'une carte : 12 px pour le texte
   courant, 11 px pour les méta-données, 10,5 px pour les pastilles.

   La fenêtre s'adapte à sa propre largeur (requêtes de conteneur, posées par
   la carte) : sous 32 rem, c'est la mise en page du téléphone, sans colonnes
   et avec un doigt au lieu du curseur ; la barre latérale n'apparaît qu'à
   partir de 42 rem (sur tablette, la fiche qui glisse garde ainsi sa largeur).

   Tout ici est décoratif : la carte cache la fenêtre aux lecteurs d'écran et
   dit en une phrase ce que la démo montre.
--------------------------------------------------------------------------- */

export type FenetreProps = {
  nom: string;
  marque: LucideIcon;
  entreprise: string;
  utilisateur: string;
  nav: readonly string[];
  icones: readonly LucideIcon[];
  vue: string;
  /** La suite du fil d'Ariane, révélée par l'animation (`data-d="fil-suite"`). */
  suite?: string;
  children: React.ReactNode;
};

export function Fenetre({ nom, marque: Marque, entreprise, utilisateur, nav, icones, vue, suite, children }: FenetreProps) {
  return (
    <div
      data-fenetre=""
      className="jour relative flex size-full select-none flex-col overflow-hidden rounded-[0.7rem] bg-card text-[12px] leading-snug text-foreground shadow-fenetre"
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border/80 px-3 @lg:h-10 @lg:px-3.5">
        <span className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-produit text-on-produit">
          <Marque className="size-3" strokeWidth={2.25} />
        </span>
        <span className="font-semibold tracking-tight">{nom}</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="truncate text-muted-foreground">{vue}</span>
        {suite && (
          <span data-d="fil-suite" className="hidden min-w-0 items-center gap-2 opacity-0 @lg:flex">
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate font-medium">{suite}</span>
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <span className="hidden h-6 w-36 items-center gap-1.5 rounded-md bg-muted/70 px-2 text-[11px] text-muted-foreground @2xl:flex">
            <Search className="size-3" />
            Rechercher
          </span>
          <Bell className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <Avatar initiales={utilisateur} ton="produit" />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <aside className="hidden w-[8.75rem] shrink-0 flex-col gap-px border-r border-border/80 bg-background/80 p-2 @2xl:flex">
          <div className="mb-2 flex items-center gap-1.5 px-1.5 py-1 text-[11.5px] font-medium">
            <span className="grid size-4 shrink-0 place-items-center rounded-[4px] bg-foreground text-[8.5px] font-semibold text-background">
              {entreprise[0]}
            </span>
            <span className="truncate">{entreprise}</span>
            <ChevronsUpDown className="ml-auto size-3 shrink-0 text-muted-foreground" />
          </div>
          {nav.map((label, i) => {
            const Icone = icones[i];
            return (
              <span
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1.5 py-[5px] text-[11.5px]",
                  i === 0 ? "bg-produit/10 font-medium text-produit" : "text-muted-foreground",
                )}
              >
                {Icone && <Icone className="size-3.5 shrink-0" strokeWidth={1.75} />}
                <span className="truncate">{label}</span>
              </span>
            );
          })}
        </aside>
        <div className="relative min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>

      {/* Le curseur, l'onde de ses clics, et le doigt des fenêtres étroites. */}
      <span data-d="anneau" className="pointer-events-none absolute left-0 top-0 z-40 -ml-3 -mt-3 size-6 rounded-full bg-foreground/20 opacity-0" />
      <span data-d="curseur" className="pointer-events-none absolute left-0 top-0 z-40 opacity-0">
        <MousePointer2
          className="-ml-[3px] -mt-[3.5px] size-[18px] fill-foreground text-card drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.3)]"
          strokeWidth={1.5}
        />
      </span>
      <span data-d="doigt" className="pointer-events-none absolute left-0 top-0 z-40 -ml-4 -mt-4 size-8 rounded-full bg-foreground/15 opacity-0 ring-2 ring-card" />
    </div>
  );
}

const TONS: Record<Ton, string> = {
  neutre: "bg-muted text-muted-foreground ring-border",
  produit: "bg-produit/10 text-produit ring-produit/20",
  succes: "bg-succes/10 text-succes ring-succes/25",
  attente: "bg-attente/10 text-attente ring-attente/25",
  retard: "bg-destructive/10 text-destructive ring-destructive/20",
};

/** Une pastille d'état : « En cours », « Terminé », « En retard ». */
export function Pastille({
  ton = "neutre",
  icone: Icone,
  className,
  children,
  ...props
}: { ton?: Ton; icone?: LucideIcon } & React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-[1.5px] text-[10.5px] font-medium ring-1 ring-inset",
        TONS[ton],
        className,
      )}
      {...props}
    >
      {Icone && <Icone className="size-2.5 shrink-0" strokeWidth={2.75} />}
      {children}
    </span>
  );
}

/** Une case à cocher. Cochée, elle prend la couleur du logiciel. */
export function Case({ fait = false, className, ...props }: { fait?: boolean } & React.ComponentProps<"span">) {
  return (
    <span
      data-d="case"
      className={cn("relative grid size-3.5 shrink-0 place-items-center rounded-[4px] bg-card ring-1 ring-inset ring-foreground/25", className)}
      {...props}
    >
      <span data-d="case-plein" className={cn("absolute inset-0 rounded-[4px] bg-produit", !fait && "opacity-0")} />
      <Check data-d="case-coche" className={cn("relative size-2.5 text-on-produit", !fait && "opacity-0")} strokeWidth={3.5} />
    </span>
  );
}

/** Des initiales dans un rond. `produit` : l'utilisateur ; `doux` : un membre de l'équipe. */
export function Avatar({ initiales, ton = "neutre", className }: { initiales: string; ton?: "neutre" | "produit" | "doux"; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full text-[8.5px] font-semibold tracking-normal ring-2 ring-card",
        ton === "produit" && "bg-produit text-on-produit",
        ton === "doux" && "bg-produit/15 text-produit",
        ton === "neutre" && "bg-secondary text-foreground/75",
        className,
      )}
    >
      {initiales}
    </span>
  );
}

/** Un bouton d'interface. `plein` : l'action principale ; `contour` : les autres. */
export function Bouton({
  variante = "plein",
  icone: Icone,
  className,
  children,
  ...props
}: { variante?: "plein" | "contour"; icone?: LucideIcon } & React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "relative inline-flex h-7 shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md px-2.5 text-[11.5px] font-medium",
        variante === "plein"
          ? "bg-produit text-on-produit shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]"
          : "bg-card text-foreground ring-1 ring-inset ring-border",
        className,
      )}
      {...props}
    >
      {Icone && <Icone className="size-3.5 shrink-0" strokeWidth={2} />}
      {children}
    </span>
  );
}

/** Une barre de progression, à la valeur donnée (0 à 100). Son remplissage porte `data-d`. */
export function Barre({ valeur, marque, className }: { valeur: number; marque?: string; className?: string }) {
  return (
    <span className={cn("relative block h-1 overflow-hidden rounded-full bg-muted", className)}>
      <span
        data-d={marque}
        className="absolute inset-0 origin-left rounded-full bg-produit"
        style={{ transform: `scaleX(${valeur / 100})` }}
      />
    </span>
  );
}

/** La notification qui monte dans le coin, quand une action aboutit. */
export function Notification({ icone: Icone = Check, children }: { icone?: LucideIcon; children: React.ReactNode }) {
  return (
    <div
      data-d="notification"
      className="pointer-events-none absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-lg bg-foreground py-2 pl-2 pr-3 text-[11.5px] font-medium text-background opacity-0 shadow-flottant"
    >
      <span className="grid size-4 place-items-center rounded-full bg-succes text-on-succes">
        <Icone className="size-2.5" strokeWidth={3} />
      </span>
      {children}
    </div>
  );
}
