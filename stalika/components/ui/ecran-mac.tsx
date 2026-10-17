"use client";

import { useEffect, useState } from "react";
import { BatteryMedium, Search, Wifi } from "lucide-react";
import { DockMac } from "@/components/ui/dock-mac";
import { LogoStalika } from "@/components/ui/logo-stalika";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Le bureau d'un Mac, dessiné sur l'écran de l'ordinateur de la plongée
   (J, 2026-10-17 : « il faut que tout ça soit dans l'ordinateur directement ;
   un écran de Mac dessiné sur le Mac, et un effet Génie incroyable et
   naturel »). Le fond d'écran (le logo Stalika), la barre des menus, le Dock,
   et la vraie fenêtre de discussion, posée là où elle s'ouvrira.

   Le fond d'écran : l'heure dorée du site, en abstrait (J, le même soir : « trop
   bateau, plus élégant, dans la DA du site »). Les dunes vectorielles qu'il y
   avait d'abord faisaient « fond d'écran de banque d'images ». Ici, un noir
   chaud, une seule lueur ambrée qui monte derrière des bancs de brume, une lumière
   d'angle, du grain, et jamais un trait dur : un filet de 1 px, sur un écran
   qui n'en fait que 200 dans la scène, scintille dès que la perspective bouge ; les
   lueurs, elles, rapetissent sans broncher. Les teintes sont celles du thème
   (accent, encre, lin) et l'ambre de `attente`. Pistes écartées en regardant
   quatre rendus côte à côte : la photo du site floutée (le fond d'écran qu'on voit
   partout), des arcs fins (la montre de luxe), un filet d'horizon (il scintille).
   Idée de départ : les fonds statiques de bg.ibelick (halo radial masqué), sans
   leur violet ni leurs grilles.
   Sombre, pour que la fenêtre claire en sorte nettement pendant l'effet Génie,
   et qu'il se lise comme un écran de Mac même quand l'écran ne fait que 200 px
   dans la scène. Le logo est un peu plus étroit que la fenêtre : une fois
   posée, elle le cache tout entier, sans lettres qui dépassent.

   C'est un écran virtuel, en vrais pixels CSS, que `Plongee` colle image par
   image sur l'écran du portable (une perspective qui suit ses coins), puis
   redresse et agrandit jusqu'à ce que la fenêtre soit à sa taille, à 1 pour 1 :
   à la fin, c'est la vraie fenêtre, nette et utilisable, sans échange d'image.
   Ses tailles viennent de `Plongee`, par des variables CSS (--ecran-l,
   --ecran-h, --fenetre-x, --fenetre-y, --fenetre-l, --fenetre-h).

   Mouvement réduit : ni bureau ni Dock, la fenêtre seule, dans le cours de la page.
--------------------------------------------------------------------------- */

const MENUS = ["Fichier", "Édition", "Présentation", "Fenêtre", "Aide"];

function Heure() {
  // L'heure du visiteur, comme sur un vrai Mac ; posée après le montage (le serveur ne la connaît pas).
  const [texte, setTexte] = useState("");
  useEffect(() => {
    const poser = () => {
      const d = new Date();
      const jour = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
      const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      setTexte(`${jour} ${heure}`);
    };
    poser();
    const id = window.setInterval(poser, 20_000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="tabular-nums">{texte}</span>;
}

/* Le grain : du bruit fractal, en un petit carreau répété, sans ressource à charger. Il casse les aplats des dégradés (sans lui, des
   bandes de couleur se voient dans le noir) et donne du papier au fond. Pas de mode de fusion : trop coûteux dans une perspective. */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.2'/></filter><rect width='180' height='180' filter='url(#n)'/></svg>",
)}")`;

const teinte = (couleur: string, part: number) => `color-mix(in oklab, var(--color-${couleur}) ${part}%, transparent)`;

/** Le fond d'écran : un noir chaud, une lueur ambrée basse (l'heure dorée qui monte derrière les nuages, un peu décentrée),
    deux bancs de brume, une lumière d'angle, un souffle de clarté derrière le logo, une vignette, du grain. */
function FondEcran() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden motion-reduce:hidden">
      <div
        className="absolute inset-0"
        style={{
          background: [
            // la vignette : le bord de l'écran s'éteint
            "radial-gradient(125% 105% at 50% 42%, transparent 50%, rgb(0 0 0 / 0.5) 100%)",
            // un souffle de clarté derrière le logo
            `radial-gradient(34% 22% at 50% 40%, ${teinte("lin", 6)}, transparent 72%)`,
            // la lueur : l'ambre au cœur, le doré du thème autour ; assez haut pour que le Dock ne la cache pas
            `radial-gradient(60% 28% at 56% 80%, ${teinte("attente", 74)}, ${teinte("accent", 26)} 44%, transparent 80%)`,
            // deux bancs de brume : doré pâle à gauche, encre à droite
            `radial-gradient(46% 10% at 24% 70%, ${teinte("accent", 17)}, transparent 72%)`,
            `radial-gradient(42% 9% at 82% 75%, ${teinte("encre", 46)}, transparent 74%)`,
            // la lumière d'angle, en haut à droite
            `radial-gradient(60% 46% at 92% 0%, ${teinte("encre", 38)}, transparent 70%)`,
            // le noir chaud, un peu plus brun en bas
            `linear-gradient(to bottom, color-mix(in oklab, var(--color-foreground) 55%, black), color-mix(in oklab, var(--color-foreground) 72%, var(--color-encre)))`,
          ].join(", "),
        }}
      />
      <div className="absolute inset-0 opacity-[0.09]" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

export function EcranMac({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-ecran-mac=""
      className={cn(
        "jour invisible absolute left-0 top-0 origin-top-left overflow-hidden bg-foreground text-foreground",
        "motion-reduce:visible motion-reduce:relative motion-reduce:h-full motion-reduce:overflow-visible motion-reduce:bg-transparent",
        className,
      )}
      style={{ width: "var(--ecran-l)", height: "var(--ecran-h)" }}
    >
      <FondEcran />
      {/* Le logo, au milieu du fond d'écran : un peu plus étroit que la fenêtre, qui le cache une fois posée. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden"
        style={{ width: "min(30%, calc(var(--fenetre-l) * 0.9))" }}
      >
        <LogoStalika fond="nuit" nom="Stalika" entree="jamais" />
      </div>

      {/* La barre des menus, translucide sur le fond sombre : le nom de l'appli au lieu de la pomme, les menus, l'état, l'heure. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 flex h-[30px] items-center gap-6 bg-foreground/35 px-5 text-[14px] text-lin shadow-[0_1px_0_color-mix(in_oklab,var(--color-lin)_10%,transparent)] motion-reduce:hidden"
      >
        <span className="font-semibold">Stalika</span>
        <span className="font-medium">Discussion</span>
        {MENUS.map((m) => (
          <span key={m} className="text-lin/85">
            {m}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-4 text-lin/90">
          <BatteryMedium className="size-[18px]" strokeWidth={1.8} />
          <Wifi className="size-[18px]" strokeWidth={2} />
          <Search className="size-4" strokeWidth={2.2} />
          <Heure />
        </span>
      </div>

      {/* Le Dock, au bas de l'écran (84 px de haut, à 14 px du bas : `Plongee` lui garde cette place sous la fenêtre). */}
      <div data-ecran-dock="" className="absolute inset-x-0 bottom-[14px] flex justify-center motion-reduce:hidden">
        <DockMac />
      </div>

      {/* À la toute fin, le bureau s'efface vers le fond de la page (`Plongee` règle son opacité) : la fenêtre reste, et la
          page reprend son cours sans raccord visible. */}
      <div data-ecran-voile="" aria-hidden="true" className="absolute inset-0 bg-lin opacity-0 motion-reduce:hidden" />

      {/* La fenêtre, à sa place sur le bureau. Elle n'est montrée qu'à la fin de l'effet Génie. */}
      <div
        data-ecran-fenetre=""
        className="invisible absolute motion-reduce:visible motion-reduce:static motion-reduce:h-full"
        style={{ left: "var(--fenetre-x)", top: "var(--fenetre-y)", width: "var(--fenetre-l)", height: "var(--fenetre-h)" }}
      >
        {children}
      </div>
    </div>
  );
}
