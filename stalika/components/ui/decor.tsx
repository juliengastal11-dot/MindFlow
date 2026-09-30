"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Décor : le paysage du hero derrière une section seule, à une autre heure.

   Les images gardent le cadrage exact du hero (générées à partir de sa
   première image, gpt_image_2_5, le 2026-09-30). Même cadre que le hero : un
   grand rectangle arrondi, à 8 px (12 px dès `sm`) des bords de la section.
   L'image recule doucement (léger zoom arrière) quand la section arrive.

   Pour plusieurs sections d'affilée, c'est `Ciel` qu'il faut : un seul plan
   dont l'heure avance avec le défilement, au lieu d'une image par section.

   Mouvement réduit : l'image, immobile.
--------------------------------------------------------------------------- */

export type DecorProps = {
  image: string;
  /** Classes de position de l'image dans son cadre (le téléphone rogne les côtés). */
  cadrage?: string;
  /** Classes du voile qui pose le texte sur l'image, dans les jetons du thème. */
  voile?: string;
  className?: string;
};

export function Decor({ image, cadrage = "object-[30%_50%] md:object-center", voile, className }: DecorProps) {
  const photo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = photo.current;
    if (!el || mouvementReduit()) return;
    const obs = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        gsap.fromTo(el, { scale: 1.08 }, { scale: 1, duration: 14, ease: "power2.out" });
      },
      // Quand le haut du cadre atteint 65 % de l'écran, comme les scènes.
      { rootMargin: "0px 0px -35% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      aria-hidden="true"
      data-src="components/ui/decor.tsx"
      className={cn(
        "pointer-events-none absolute inset-2 overflow-hidden rounded-[1.5rem] sm:inset-3 sm:rounded-[2rem]",
        className,
      )}
    >
      <div ref={photo} className="absolute inset-0">
        <Image src={image} alt="" fill sizes="100vw" className={cn("object-cover", cadrage)} />
      </div>
      {voile && <div className={cn("absolute inset-0", voile)} />}
    </div>
  );
}
