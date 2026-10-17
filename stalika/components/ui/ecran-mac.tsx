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

   Le fond d'écran : des dunes au crépuscule, dans les couleurs du site (vagues
   superposées dessinées à la main, à la façon de Haikei, et lueurs dorées),
   sombre pour que la fenêtre claire en sorte nettement pendant l'effet Génie,
   et qu'il se lise comme un écran de Mac même quand l'écran ne fait que
   200 px dans la scène. Le logo est un peu plus étroit que la fenêtre : une
   fois posée, elle le cache tout entier, sans lettres qui dépassent.

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

/** Le fond d'écran : un ciel qui passe du presque noir au brun doré, une lueur basse, trois dunes devant, chacune en dégradé
    et soulignée d'un fil de lumière sur sa crête. */
function FondEcran() {
  const arret = (couleur: string, opacite: number) => ({ stopColor: `var(--color-${couleur})`, stopOpacity: opacite });
  const dunes = [
    {
      d: "M0 590 C 210 532 430 640 700 604 C 980 566 1250 650 1600 574 L1600 1000 L0 1000 Z",
      de: arret("accent", 0.85),
      a: arret("encre", 0.55),
      crete: 0.55,
    },
    {
      d: "M0 712 C 260 646 540 772 860 718 C 1140 670 1380 752 1600 700 L1600 1000 L0 1000 Z",
      de: arret("encre", 0.95),
      a: arret("foreground", 0.75),
      crete: 0.4,
    },
    {
      d: "M0 836 C 320 778 620 884 930 838 C 1200 798 1420 866 1600 830 L1600 1000 L0 1000 Z",
      de: arret("foreground", 0.85),
      a: arret("foreground", 1),
      crete: 0.28,
    },
  ];
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden motion-reduce:hidden">
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(55% 40% at 50% 60%, color-mix(in oklab, var(--color-accent) 60%, transparent), transparent 75%)",
            "radial-gradient(40% 45% at 90% 18%, color-mix(in oklab, var(--color-encre) 45%, transparent), transparent 72%)",
            "linear-gradient(to bottom, var(--color-foreground) 0%, color-mix(in oklab, var(--color-foreground) 60%, var(--color-encre)) 62%, var(--color-encre) 100%)",
          ].join(", "),
        }}
      />
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <defs>
          {dunes.map((dune, i) => (
            <linearGradient key={i} id={`fond-mac-dune-${i}`} x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" style={dune.de} />
              <stop offset="1" style={dune.a} />
            </linearGradient>
          ))}
        </defs>
        {dunes.map((dune, i) => (
          <g key={i}>
            <path d={dune.d} fill={`url(#fond-mac-dune-${i})`} />
            <path
              d={dune.d.split(" L1600")[0]}
              fill="none"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              style={{ stroke: "var(--color-lin)", strokeOpacity: dune.crete }}
            />
          </g>
        ))}
      </svg>
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
