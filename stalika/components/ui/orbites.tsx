"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Orbites : le décor des scènes de nuit. Deux grands arcs fins, concentriques,
   qui dépassent du bas de l'écran et tournent lentement avec la page.

   Indépendantes de la chronologie d'une scène : elles suivent le défilement
   de leur parent, du moment où il entre à celui où il sort. Posées dans une
   section `relative overflow-hidden`, derrière le contenu. Purement
   décoratives (`aria-hidden`), et immobiles en mouvement réduit.
--------------------------------------------------------------------------- */

export type OrbitesProps = React.ComponentProps<"div">;

export function Orbites({ className, ...props }: OrbitesProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent || mouvementReduit()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { rotate: 0 },
        {
          rotate: MOUVEMENT.film.orbites.rotation,
          ease: "none",
          scrollTrigger: { trigger: parent, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-1/2 top-[62%] aspect-square w-[160vmax] -translate-x-1/2 will-change-transform",
        className,
      )}
      style={{ opacity: MOUVEMENT.film.orbites.opacite }}
      {...props}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
        <circle cx="50" cy="50" r="48" className="stroke-foreground" strokeWidth="0.12" />
        <circle cx="50" cy="50" r="38" className="stroke-accent" strokeWidth="0.1" strokeDasharray="0.6 1.4" />
      </svg>
    </div>
  );
}
