"use client";

import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Le texte du hero sort de la brume (J, 2026-10-18 : « que le texte et le
   bouton apparaissent de manière stylée », piste choisie parmi quatre) :
   chaque mot arrive flou et transparent, puis devient net, en vague de gauche
   à droite, paragraphe par paragraphe : le suivant part quand le précédent finit
   de s'éclaircir. Quand le dernier a presque fini, il appelle le bouton
   (l'évènement `HERO_TEXTE`, attendu par `EntreeFil`). Doux, dans l'esprit
   de la brume dorée de la scène, et sans disputer la vedette au logo, qui se
   compose avant.

   Idées : le « blur-in » mot par mot des catalogues d'animation (Kinetics,
   les exemples SplitText de Motion), redit avec SplitText de GSAP 3.13 (inclus
   dans le paquet, gratuit) et les réglages de `MOUVEMENT.hero.brume`.

   Les mots ne sont découpés que le temps de l'entrée : à la fin, le texte
   redevient un texte ordinaire (`revert`), pour les lecteurs d'écran, la
   sélection et les rebonds du bouton qui tombe (`data-rebond`).
   Avant le JavaScript, les lignes sont cachées par `data-mouvement="hero"`
   (app/globals.css). Mouvement réduit : le texte est là d'emblée.
--------------------------------------------------------------------------- */

const R = MOUVEMENT.hero.brume;

/** Le texte du hero a (presque) fini d'entrer : le bouton peut venir. */
export const HERO_TEXTE = "stalika:hero-texte";

export function MotsBrume({ children, className, ...props }: React.ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lignes = Array.from(el.children) as HTMLElement[];
    if (lignes.length === 0) return;
    gsap.registerPlugin(SplitText);
    const coupes: SplitText[] = [];

    const ctx = gsap.context(() => {
      gsap.set(lignes, { autoAlpha: 1 });
      if (mouvementReduit()) return;
      const tl = gsap.timeline({ delay: R.debut });
      lignes.forEach((ligne, i) => {
        const coupe = SplitText.create(ligne, { type: "words", wordsClass: "inline-block will-change-[filter,opacity]" });
        coupes.push(coupe);
        tl.from(
          coupe.words,
          {
            autoAlpha: 0,
            filter: `blur(${R.flou}px)`,
            y: R.monte,
            duration: R.duree,
            ease: "power2.out",
            stagger: R.entreMots,
            // le paragraphe redevient un texte ordinaire
            onComplete: () => coupe.revert(),
          },
          // paragraphe par paragraphe : le suivant part quand le précédent finit de s'éclaircir
          i === 0 ? 0 : `>-${R.chevauchement}`,
        );
      });
      tl.call(() => document.dispatchEvent(new CustomEvent(HERO_TEXTE)), [], Math.max(0, tl.duration() - R.boutonAvantFin));
    }, ref);

    return () => {
      ctx.revert();
      coupes.forEach((c) => c.revert());
    };
  }, []);

  return (
    <div ref={ref} data-mouvement="hero" className={cn(className)} {...props}>
      {children}
    </div>
  );
}
