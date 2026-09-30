"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { useScene } from "@/components/ui/scene";

/* ---------------------------------------------------------------------------
   Champ3D : un plan incliné de cartes, vu en perspective, qui glisse sous la
   caméra pendant que chaque carte change de visage.

   Chaque élément a deux faces : `avant` (posée par-dessus) et `apres`. Entre
   `de` et `a`, le plan avance et les faces se croisent, une carte sur deux
   d'abord, puis les autres : le champ « tous pareils » devient un champ
   « tous différents ». C'est la scène 2, et rien ne répond au curseur : les
   cartes ne mènent nulle part.

   Le nombre de cartes vient de `film.champ3d` : neuf sur ordinateur, six sur
   téléphone (les suivantes sont masquées en CSS, pas retirées du DOM, pour
   que le rendu serveur soit le même partout).

   Rendu serveur : les deux faces présentes, `avant` par-dessus. Le tout est
   un `role="img"` avec un libellé : le contenu des cartes est décoratif.
--------------------------------------------------------------------------- */

export type Champ3DProps = React.ComponentProps<"div"> & {
  items: readonly { avant: React.ReactNode; apres: React.ReactNode }[];
  /** Libellé accessible du champ entier. */
  label: string;
  de?: number;
  a?: number;
};

export function Champ3D({ items, label, de = 0, a = 0.9, className, ...props }: Champ3DProps) {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);
  const { cartes, cartesMobile, perspective, inclinaison, vrille } = MOUVEMENT.film.champ3d;

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    const plan = el.querySelector<HTMLElement>("[data-plan]");
    const lesCartes = Array.from(el.querySelectorAll<HTMLElement>("[data-carte]"));
    if (!plan) return;

    return scene.inscrire((tl) => {
      gsap.set(plan, { rotateX: inclinaison, rotateZ: vrille, yPercent: 14, transformOrigin: "50% 50%" });
      tl.to(plan, { yPercent: -22, duration: Math.max(a - de, 0.01) }, de);

      const ordre = [
        ...lesCartes.filter((_, i) => i % 2 === 0),
        ...lesCartes.filter((_, i) => i % 2 === 1),
      ];
      const fenetre = a - de;
      ordre.forEach((carte, k) => {
        const avant = carte.querySelector<HTMLElement>("[data-avant]");
        const apres = carte.querySelector<HTMLElement>("[data-apres]");
        if (!avant || !apres) return;
        gsap.set(apres, { autoAlpha: 0, y: 12 });
        const position = de + fenetre * (0.22 + (0.66 * k) / ordre.length);
        tl.to(avant, { autoAlpha: 0, y: -12, duration: fenetre * 0.06 }, position);
        tl.to(apres, { autoAlpha: 1, y: 0, duration: fenetre * 0.06 }, position);
      });
    });
  }, [scene, de, a, inclinaison, vrille]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-film-cache
      className={cn("relative", className)}
      style={{ perspective: `${perspective}px` }}
      {...props}
    >
      <div data-plan className="grid grid-cols-2 gap-4 will-change-transform md:grid-cols-3 md:gap-6">
        {items.slice(0, cartes).map((item, i) => (
          <div key={i} data-carte className={cn("relative", i >= cartesMobile && "hidden md:block")}>
            <div data-apres>{item.apres}</div>
            <div data-avant className="absolute inset-0">
              {item.avant}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
