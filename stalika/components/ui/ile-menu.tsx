"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Le menu du héros en « île dynamique » (demande de J, overlay 2026-10-02).

   Idée prise à la Dynamic Island d'iPhone, vue sur 21st (cult-ui, educalvolpz)
   et dans la table des matières « Dynamic Island TOC » : une capsule noire
   détachée du bord, qui naît toute petite puis s'étire en ressort jusqu'à sa
   largeur, ses liens apparaissant à mesure. Rien de leur code : on ne reprend
   que le mouvement, écrit en GSAP avec les jetons du site.

   Largeur animée, jamais une échelle : la capsule garde sa vraie boîte, donc
   le bouton qui s'y accroche (`BoutonChute`) mesure toujours le bon bord bas.
   Mouvement réduit : la capsule est là, entière, d'emblée.
--------------------------------------------------------------------------- */

export function IleMenu({ children, className, ...props }: React.ComponentProps<"nav">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || mouvementReduit()) return;
    const liens = Array.from(el.children).filter((c) => !c.classList.contains("sr-only"));
    const pleine = el.offsetWidth;

    const ctx = gsap.context(() => {
      gsap.set(el, { width: Math.round(pleine * 0.34), overflow: "hidden" });
      gsap.set(liens, { autoAlpha: 0 });
      const tl = gsap.timeline({ delay: 0.25 });
      tl.to(el, { width: pleine, duration: 1.1, ease: "elastic.out(1, 0.62)", clearProps: "width,overflow" }, 0);
      tl.to(liens, { autoAlpha: 1, duration: 0.35, ease: "power2.out", stagger: 0.07 }, 0.18);
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <nav
      ref={ref}
      className={cn(
        "ring-1 ring-foreground/10 shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--color-background)_90%,transparent)] transition-transform duration-200 active:scale-[0.97]",
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  );
}
