"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useScene } from "@/components/ui/scene";

/* ---------------------------------------------------------------------------
   Rouleaux : un nombre dont chaque chiffre roule jusqu'à sa valeur, comme un
   compteur mécanique.

   Entre `de` et `a`, la valeur va de 0 à `valeur` ; chaque rouleau montre le
   chiffre de sa position et n'entraîne le suivant qu'au passage du 9 au 0,
   comme le vrai. Réservé au seul chiffre qu'on a le droit d'animer (« 72 h »,
   blueprint H13) : un prix ne se compte pas.

   Rendu serveur : la valeur finale, lisible, dans la copie `sr-only` ; les
   rouleaux sont `aria-hidden`.
--------------------------------------------------------------------------- */

export type RouleauxProps = React.ComponentProps<"span"> & {
  valeur: number;
  /** Nombre de rouleaux ; par défaut, le nombre de chiffres de la valeur. */
  chiffres?: number;
  de?: number;
  a?: number;
};

const COLONNE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const;

export function Rouleaux({ valeur, chiffres, de = 0.4, a = 0.8, className, ...props }: RouleauxProps) {
  const scene = useScene();
  const ref = useRef<HTMLSpanElement>(null);
  const cible = Math.max(0, Math.floor(valeur));
  const nb = chiffres ?? String(cible).length;

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    const rouleaux = Array.from(el.querySelectorAll<HTMLElement>("[data-rouleau]"));
    if (rouleaux.length === 0) return;

    return scene.inscrire((tl) => {
      const etat = { v: 0 };
      const rendre = () => {
        rouleaux.forEach((r, i) => {
          const puissance = 10 ** (rouleaux.length - 1 - i);
          const entier = Math.floor(etat.v / puissance) % 10;
          const reste = etat.v % puissance;
          const glisse = puissance > 1 && reste > puissance - 1 ? reste - (puissance - 1) : 0;
          const x = puissance === 1 ? etat.v % 10 : entier + glisse;
          r.style.transform = `translateY(${-x}em)`;
        });
      };
      rendre();
      tl.to(etat, { v: cible, duration: Math.max(a - de, 0.01), onUpdate: rendre }, de);
    });
  }, [scene, cible, de, a]);

  return (
    <span ref={ref} className={cn("inline-flex", className)} {...props}>
      <span className="sr-only">{cible}</span>
      <span aria-hidden="true" data-film-cache className="inline-flex h-[1em] overflow-hidden leading-none">
        {Array.from({ length: nb }).map((_, i) => (
          <span key={i} data-rouleau className="flex flex-col will-change-transform">
            {COLONNE.map((n, j) => (
              <span key={j} className="h-[1em] leading-none tabular-nums">
                {n}
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
