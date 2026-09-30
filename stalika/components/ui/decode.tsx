"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MOUVEMENT } from "@/lib/mouvement";
import { useScene } from "@/components/ui/scene";

/* ---------------------------------------------------------------------------
   Decode : un mot qui se brouille puis se recompose en un autre.

   Les mots se succèdent entre `de` et `a`, à intervalles égaux. À chaque
   passage, les lettres se fixent de gauche à droite ; celles qui ne sont pas
   encore fixées tirent au sort un glyphe de `film.decode.glyphes`, `passes`
   fois chacune. Remonter rejoue à l'envers.

   Rendu serveur : le premier mot dans la copie visible (`aria-hidden`), le
   dernier mot dans la copie pour lecteurs d'écran : c'est lui, le message.
   La largeur est réservée sur le mot le plus long, pour que la ligne ne
   respire pas à chaque passage.
--------------------------------------------------------------------------- */

export type DecodeProps = React.ComponentProps<"span"> & {
  /** Au moins deux mots ; le premier est l'état de départ. */
  mots: readonly string[];
  de?: number;
  a?: number;
};

export function Decode({ mots, de = 0.2, a = 0.8, className, ...props }: DecodeProps) {
  const scene = useScene();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene || mots.length < 2) return;
    const zone = el.querySelector<HTMLElement>("[data-decode]");
    if (!zone) return;

    return scene.inscrire((tl) => {
      const { glyphes, passes } = MOUVEMENT.film.decode;
      const etapes = mots.length - 1;
      const largeur = (a - de) / etapes;
      const duree = largeur * 0.55;

      for (let k = 0; k < etapes; k++) {
        const depuis = mots[k];
        const vers = mots[k + 1];
        const longueur = Math.max(depuis.length, vers.length);
        const etat = { p: 0 };
        const rendre = () => {
          const fixees = etat.p * longueur;
          let sortie = "";
          for (let i = 0; i < longueur; i++) {
            if (i < fixees) sortie += vers[i] ?? "";
            else if (fixees + passes > i) {
              const graine = Math.floor(etat.p * longueur * passes + i * 7) % glyphes.length;
              sortie += vers[i] === " " ? " " : glyphes[graine];
            } else sortie += depuis[i] ?? "";
          }
          zone.textContent = sortie;
        };
        tl.to(etat, { p: 1, duration: duree, onUpdate: rendre }, de + k * largeur);
      }
    });
  }, [scene, mots, de, a]);

  const plusLong = mots.reduce((m, x) => (x.length > m.length ? x : m), "");

  return (
    <span ref={ref} className={cn("relative inline-block whitespace-nowrap", className)} {...props}>
      <span className="sr-only">{mots[mots.length - 1]}</span>
      {/* Réserve la largeur du mot le plus long. */}
      <span aria-hidden="true" className="invisible">
        {plusLong}
      </span>
      <span aria-hidden="true" data-decode className="absolute inset-0">
        {mots[0]}
      </span>
    </span>
  );
}
