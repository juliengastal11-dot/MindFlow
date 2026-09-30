"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { useScene } from "@/components/ui/scene";

/* ---------------------------------------------------------------------------
   Barre : un trait qui barre un mot, de gauche à droite, au défilement.

   L'élément signature du site (blueprint §1) : ce qu'on corrige. Le trait est
   un `span` absolu à mi-hauteur de ligne, tracé par `scaleX`. Rien d'autre ne
   bouge : le texte reste en place, lisible, avant comme après.

   Sémantique : un `<s>` sans décoration native. L'état final est la vérité
   du texte, donc le lecteur d'écran l'entend barré dès le départ.
--------------------------------------------------------------------------- */

export type BarreProps = React.ComponentProps<"s"> & {
  de?: number;
  a?: number;
  /** Couleur du trait, une classe Tailwind `bg-…`. Par défaut, celle du texte. */
  trait?: string;
};

export function Barre({ children, de = 0.4, a = 0.55, trait = "bg-current", className, ...props }: BarreProps) {
  const scene = useScene();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    const ligne = el.querySelector<HTMLElement>("[data-trait]");
    if (!ligne) return;

    return scene.inscrire((tl) => {
      gsap.set(ligne, { scaleX: 0, transformOrigin: "0% 50%" });
      tl.to(ligne, { scaleX: 1, duration: Math.max(a - de, 0.01) }, de);
    });
  }, [scene, de, a]);

  return (
    <s ref={ref} className={cn("relative inline no-underline", className)} {...props}>
      {children}
      <span
        aria-hidden="true"
        data-trait
        className={cn("pointer-events-none absolute left-0 right-0 top-1/2 rounded-full", trait)}
        style={{ height: `${MOUVEMENT.film.barre.epaisseur}em`, marginTop: `${-MOUVEMENT.film.barre.epaisseur / 2}em` }}
      />
    </s>
  );
}
