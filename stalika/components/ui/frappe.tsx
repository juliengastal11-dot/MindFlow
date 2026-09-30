"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { useScene } from "@/components/ui/scene";

/* ---------------------------------------------------------------------------
   Frappe : un texte qui se tape lettre à lettre, au rythme du défilement.

   Entre les positions `de` et `a` de la scène, le texte passe de vide à
   complet ; un curseur clignote pendant la frappe et s'éteint juste après.
   Remonter efface. La vitesse ne se règle pas : elle est celle de la molette.

   Rendu serveur : le texte complet, deux fois. Une copie pour les lecteurs
   d'écran (`sr-only`, jamais modifiée), une copie visible (`aria-hidden`) que
   la chronologie réécrit. Sans JavaScript, la copie visible reste complète.

   Hors d'une `Scene`, rien ne bouge : le texte s'affiche tel quel.
--------------------------------------------------------------------------- */

export type FrappeProps = React.ComponentProps<"span"> & {
  texte: string;
  /** Début de la frappe, en fraction de la scène. */
  de?: number;
  /** Fin de la frappe, en fraction de la scène. */
  a?: number;
  curseur?: boolean;
};

export function Frappe({ texte, de = 0, a = 0.5, curseur = true, className, ...props }: FrappeProps) {
  const scene = useScene();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    const zone = el.querySelector<HTMLElement>("[data-frappe]");
    const cur = el.querySelector<HTMLElement>("[data-curseur]");
    if (!zone) return;

    return scene.inscrire((tl) => {
      const etat = { n: 0 };
      const rendre = () => {
        zone.textContent = texte.slice(0, Math.round(etat.n));
      };
      rendre();
      tl.to(etat, { n: texte.length, duration: Math.max(a - de, 0.01), onUpdate: rendre }, de);
      if (cur) {
        gsap.set(cur, { autoAlpha: 1 });
        tl.to(cur, { autoAlpha: 0, duration: 0.02 }, Math.min(a + 0.06, 0.99));
      }
    });
  }, [scene, texte, de, a]);

  return (
    <span ref={ref} data-film-cache className={cn("inline", className)} {...props}>
      <span className="sr-only">{texte}</span>
      <span aria-hidden="true" data-frappe>
        {texte}
      </span>
      {curseur && (
        <span
          aria-hidden="true"
          data-curseur
          className="frappe-curseur"
          style={{ ["--film-curseur" as string]: `${MOUVEMENT.film.frappe.curseur}s` }}
        />
      )}
    </span>
  );
}
