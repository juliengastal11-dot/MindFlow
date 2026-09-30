"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/gsap";
import { useScene } from "@/components/ui/scene";

/* ---------------------------------------------------------------------------
   Trace : un tracé SVG qui se dessine au défilement.

   Le classique `stroke-dasharray` / `stroke-dashoffset` : la longueur du
   tracé est mesurée au montage, le trait part entièrement masqué et se
   découvre entre `de` et `a`. Une courbe qui monte, un contour, une coche.

   Rendu serveur : le tracé complet (l'état final). Le `viewBox` est celui du
   dessin, le cadre prend la largeur qu'on lui donne.
--------------------------------------------------------------------------- */

export type TraceProps = Omit<React.ComponentProps<"svg">, "children"> & {
  /** L'attribut `d` du tracé. */
  d: string;
  viewBox: string;
  de?: number;
  a?: number;
  epaisseur?: number;
  /** Classe de couleur du trait, `stroke-…`. */
  trait?: string;
  /** Un titre pour les lecteurs d'écran ; sans lui, le dessin est décoratif. */
  titre?: string;
};

export function Trace({
  d,
  viewBox,
  de = 0,
  a = 1,
  epaisseur = 3,
  trait = "stroke-accent",
  titre,
  className,
  ...props
}: TraceProps) {
  const scene = useScene();
  const ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const chemin = ref.current;
    if (!chemin || !scene) return;

    return scene.inscrire((tl) => {
      const longueur = chemin.getTotalLength();
      /* Le vide est plus long que le trait de deux unités : sans ça, la limite
         entre les deux tombe pile au départ du tracé et le bout rond y laisse
         un point visible avant même que le trait ne commence. */
      gsap.set(chemin, { strokeDasharray: `${longueur} ${longueur + 2}`, strokeDashoffset: longueur });
      tl.to(chemin, { strokeDashoffset: 0, duration: Math.max(a - de, 0.01) }, de);
    });
  }, [scene, de, a, d]);

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      role={titre ? "img" : undefined}
      aria-hidden={titre ? undefined : true}
      className={cn("block", className)}
      {...props}
    >
      {titre && <title>{titre}</title>}
      <path
        ref={ref}
        d={d}
        strokeWidth={epaisseur}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={trait}
      />
    </svg>
  );
}
