"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Paysage : l'illustration de l'ouverture, en calques qui glissent à des
   vitesses différentes au défilement.

   Trois vitesses, réglées dans `film.paysage` : le ciel bouge à peine, le
   lointain un peu, le premier plan franchement. Chaque calque est plus haut
   que le cadre de sa propre course, pour ne jamais découvrir le bord.

   Le voile, un dégradé vers la couleur de fond, pose le texte par-dessus
   l'image ; il est là dès le rendu serveur et ne bouge pas.

   Les calques sont des fichiers de `public/paysage/`. Un SVG passe en
   `unoptimized` : next/image ne le retouche pas. Hors d'une `Scene`, ou en
   mouvement réduit, l'image est simplement posée.
--------------------------------------------------------------------------- */

export type Calque = {
  src: string;
  vitesse: keyof typeof MOUVEMENT.film.paysage;
  /** Position verticale du calque dans le cadre, en pourcentage (object-position). */
  position?: string;
};

export type PaysageProps = React.ComponentProps<"div"> & {
  calques: readonly Calque[];
  /** Description de l'image entière, pour les lecteurs d'écran. */
  alt: string;
  /** Dégradé vers la couleur de fond, pour poser le texte sur l'image. */
  voile?: boolean;
};

export function Paysage({ calques, alt, voile = true, className, ...props }: PaysageProps) {
  const ref = useRef<HTMLDivElement>(null);

  /* Parallaxe classique : chaque calque suit le défilement normal de la
     page, à sa vitesse, du haut de page jusqu'à ce que le paysage sorte de
     l'écran. Rien n'est épinglé, rien ne bouge tant qu'on ne défile pas. */
  useEffect(() => {
    const el = ref.current;
    if (!el || mouvementReduit()) return;
    const couches = Array.from(el.querySelectorAll<HTMLElement>("[data-calque]"));

    const ctx = gsap.context(() => {
      couches.forEach((couche) => {
        const v = Number(couche.dataset.vitesse ?? 0);
        const borne = (v / (1 + v)) * 100;
        gsap.fromTo(
          couche,
          { yPercent: 0 },
          {
            yPercent: -borne,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
          },
        );
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={alt}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      {calques.map((c) => {
        const v = MOUVEMENT.film.paysage[c.vitesse];
        return (
          <div
            key={c.src}
            data-calque
            data-vitesse={v}
            className="absolute inset-x-0 top-0 will-change-transform"
            style={{ height: `${100 + v * 100}%` }}
          >
            <Image
              src={c.src}
              alt=""
              fill
              priority
              sizes="100vw"
              unoptimized={c.src.endsWith(".svg")}
              className="object-cover"
              style={{ objectPosition: c.position ?? "50% 100%" }}
            />
          </div>
        );
      })}
      {voile && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-background/10 via-background/35 to-background"
        />
      )}
    </div>
  );
}
