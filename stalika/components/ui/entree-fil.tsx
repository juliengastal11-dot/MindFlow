"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Le bouton du hero descend au bout de son fil (J, 2026-10-18, piste choisie
   parmi trois) : il arrive d'en haut, suspendu à un fil doré, se pose en se
   balançant un peu, puis le fil remonte et disparaît. C'est le même bouton qui,
   au clic, se décroche et tombe jusqu'à l'ordinateur (`BoutonChute`) : son
   entrée annonce la suite.

   Le balancement pivote au haut du fil, comme un pendule, et s'amortit en
   trois allers-retours. Idée : les entrées à ressort de Kinetics (« Stagger
   Entrance », « spring ») et le pendule déjà calculé pour la chute
   (`lib/chute.ts`), redits avec GSAP et `MOUVEMENT.hero.fil`.

   À la fin, toutes les transformations sont retirées : le bouton qui tombe
   mesure sa place au clic, il doit la trouver nette. Avant le JavaScript, il
   est caché par `data-mouvement="hero"` ; mouvement réduit : il est là
   d'emblée, sans fil.
--------------------------------------------------------------------------- */

const R = MOUVEMENT.hero.fil;

export function EntreeFil({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const suspendu = el?.firstElementChild as HTMLElement | null;
    const fil = el?.querySelector<HTMLElement>("[data-fil]");
    if (!el || !suspendu || !fil) return;

    const ctx = gsap.context(() => {
      if (mouvementReduit()) {
        gsap.set(suspendu, { autoAlpha: 1 });
        gsap.set(fil, { display: "none" });
        return;
      }
      // le pivot : le haut du fil, au-dessus du milieu du bouton
      gsap.set(suspendu, { transformOrigin: `50% ${-R.longueur}px` });
      const a = R.angle;
      gsap
        .timeline({ delay: R.debut, onComplete: () => gsap.set(suspendu, { clearProps: "transform,transformOrigin" }) })
        // la descente : il arrive d'en haut, déjà un peu penché, et ralentit
        // (de peu : sur téléphone, le texte est juste au-dessus, il ne doit pas le traverser)
        .fromTo(
          suspendu,
          { y: -R.chute, rotation: a * 1.4 },
          { y: 0, rotation: -a, duration: R.descente, ease: "power2.out" },
        )
        .fromTo(suspendu, { autoAlpha: 0 }, { autoAlpha: 1, duration: R.descente * 0.5, ease: "none" }, "<")
        // le balancement, amorti
        .to(suspendu, {
          keyframes: { rotation: [a * 0.6, -a * 0.32, a * 0.14, 0], ease: "sine.inOut" },
          duration: R.balance,
          ease: "none",
        })
        // le fil remonte
        .to(fil, { scaleY: 0, autoAlpha: 0, duration: R.retrait, ease: "power2.in" }, ">-0.1");
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} data-mouvement="hero" className={cn("relative flex justify-center", className)}>
      <div className="relative">
        <span
          data-fil=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-1/2 w-px origin-top -translate-x-1/2 bg-linear-to-b from-transparent via-accent/50 to-accent motion-reduce:hidden"
          style={{ height: R.longueur }}
        />
        {children}
      </div>
    </div>
  );
}
