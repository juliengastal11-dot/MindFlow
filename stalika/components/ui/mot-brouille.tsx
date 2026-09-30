"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   MotBrouille : un mot qui se compose lettre par lettre, au chargement.

   Même mécanique que le logo qui s'ouvre (le composant « special text » que
   J a apporté), mais lettre par lettre et en grand : chaque lettre apparaît
   à son tour, fait défiler quelques caractères au hasard, puis se fige sur la
   bonne ; la suivante part un peu après. Joué une fois, au montage.

   Pas de tremblement : chaque lettre est une boîte dont la largeur est
   mesurée sur la lettre finale avant que le brouillage ne commence. Un « W »
   brouillé en « I » ne fait donc pas bouger le reste du mot.

   Rendu serveur, sans JavaScript et en mouvement réduit : le mot final, tel
   quel. Le mot est lu
   une fois par les lecteurs d'écran (`sr-only`) ; les lettres animées sont
   `aria-hidden`. Durées et glyphes dans `MOUVEMENT.film.brouille`.
--------------------------------------------------------------------------- */

export type MotBrouilleProps = React.ComponentProps<"span"> & {
  mot: string;
  /** Respiration avant la première lettre, en secondes. */
  delai?: number;
};

export function MotBrouille({ mot, delai = 0, className, ...props }: MotBrouilleProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lettres = Array.from(el.querySelectorAll<HTMLElement>("[data-lettre]"));
    // La feuille de style masque les lettres (`html.js [data-brouille]`) tant
    // que ce composant n'a pas pris la main : sans ça, le mot final
    // s'afficherait un instant avant de se brouiller.
    if (mouvementReduit()) {
      gsap.set(lettres, { autoAlpha: 1 });
      return;
    }
    const { glyphes, parLettre, decalage } = MOUVEMENT.film.brouille;

    // Largeur figée sur la lettre finale, avant tout brouillage.
    lettres.forEach((l) => {
      l.style.width = `${l.getBoundingClientRect().width}px`;
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: delai });
      lettres.forEach((l, i) => {
        const finale = l.dataset.lettre ?? "";
        if (finale.trim() === "") return;
        const etat = { p: 0 };
        gsap.set(l, { autoAlpha: 0 });
        tl.set(l, { autoAlpha: 1 }, i * decalage);
        tl.to(
          etat,
          {
            p: 1,
            duration: parLettre,
            ease: "none",
            onUpdate: () => {
              // Un nouveau glyphe tous les 1/12 de la course, jamais deux fois le même.
              const pas = Math.floor(etat.p * 12);
              l.textContent = etat.p >= 1 ? finale : glyphes[(pas * 7 + i * 3) % glyphes.length];
            },
            onComplete: () => {
              l.textContent = finale;
            },
          },
          i * decalage,
        );
      });
      tl.eventCallback("onComplete", () => {
        lettres.forEach((l) => (l.style.width = ""));
      });
    }, el);

    return () => ctx.revert();
  }, [mot, delai]);

  return (
    <span ref={ref} data-brouille className={cn("inline-flex", className)} {...props}>
      <span className="sr-only">{mot}</span>
      {Array.from(mot).map((c, i) => (
        <span key={i} aria-hidden="true" data-lettre={c} className="inline-block text-center">
          {c}
        </span>
      ))}
    </span>
  );
}
