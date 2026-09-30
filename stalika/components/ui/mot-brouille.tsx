"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   MotBrouille : un mot qui se compose lettre par lettre, au chargement.

   Même mécanique que le logo qui s'ouvre (le composant « special text » que
   J a apporté), mais lettre par lettre et en grand : chaque lettre apparaît
   à son tour, fait tourner une série de symboles au hasard, puis se fige sur
   la bonne ; la suivante part un peu après. Une fois le mot complet, il
   scintille sans fin : une lettre au hasard se rebrouille un instant et
   retombe juste, puis une autre, une seule à la fois.

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
    const { glyphes, parLettre, changements, decalage, scintille } = MOUVEMENT.film.brouille;
    const auHasard = (sauf?: string) => {
      let g = glyphes[Math.floor(Math.random() * glyphes.length)];
      if (g === sauf) g = glyphes[(glyphes.indexOf(g) + 1) % glyphes.length];
      return g;
    };

    // Largeur figée sur la lettre finale, pour tout le temps de vie du mot :
    // le scintillement continue après l'entrée, le mot ne doit jamais bouger.
    lettres.forEach((l) => {
      l.style.width = `${l.getBoundingClientRect().width}px`;
    });

    /* Brouille une lettre : `n` glyphes au hasard sur `duree` secondes, puis
       la bonne lettre. Renvoie le tween, pour l'enchaîner. */
    const brouiller = (l: HTMLElement, duree: number, n: number) => {
      const finale = l.dataset.lettre ?? "";
      const etat = { p: 0 };
      let dernier = -1;
      return gsap.to(etat, {
        p: 1,
        duration: duree,
        ease: "none",
        onUpdate: () => {
          const pas = Math.min(n - 1, Math.floor(etat.p * n));
          if (pas === dernier) return;
          dernier = pas;
          l.textContent = auHasard(l.textContent ?? undefined);
        },
        onComplete: () => {
          l.textContent = finale;
        },
      });
    };

    const ctx = gsap.context(() => {
      // L'entrée : chaque lettre apparaît à son tour, tourne longtemps, se fige.
      const tl = gsap.timeline({ delay: delai });
      lettres.forEach((l, i) => {
        if ((l.dataset.lettre ?? "").trim() === "") return;
        gsap.set(l, { autoAlpha: 0 });
        tl.set(l, { autoAlpha: 1 }, i * decalage);
        tl.add(brouiller(l, parLettre, changements), i * decalage);
      });

      // Ensuite, sans fin : une lettre au hasard se rebrouille, puis se refige.
      // Jamais deux fois de suite la même, une seule à la fois.
      // `ctx.add` rattache au contexte ce qui naît plus tard, dans un rappel :
      // sans lui, le scintillement survivrait au démontage du composant.
      let precedente = -1;
      const suivante = () =>
        ctx.add(() => {
          let i = Math.floor(Math.random() * lettres.length);
          if (i === precedente) i = (i + 1) % lettres.length;
          precedente = i;
          brouiller(lettres[i], scintille.duree, scintille.changements);
          const pause = scintille.pauseMin + Math.random() * (scintille.pauseMax - scintille.pauseMin);
          gsap.delayedCall(scintille.duree + pause, suivante);
        });
      tl.eventCallback("onComplete", () => {
        ctx.add(() => gsap.delayedCall(scintille.pauseMin, suivante));
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
