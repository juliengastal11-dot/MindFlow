"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Scène : une section dont la chronologie se joue une fois, quand elle arrive
   à l'écran.

   Première version : la scène était épinglée et la chronologie suivait la
   molette. J l'a refusée à l'essai sur son téléphone : la page semblait
   buguer, elle s'arrêtait et repartait. Désormais la page défile toujours
   normalement ; chaque scène joue son animation en `film.duree` secondes, au
   moment où elle entre dans l'écran, et ne la rejoue pas.

   Les primitives du film (`Frappe`, `Decode`, `Barre`, `Trace`, `Champ3D`,
   `Rouleaux`) s'inscrivent sur cette chronologie par le contexte
   `useScene()` : elles y posent leurs tweens entre deux positions, `de` et
   `a`, en fraction de la chronologie (0 = le début, 1 = la fin).

   Ordre d'exécution, à connaître : les effets des enfants courent avant celui
   du parent. Les primitives s'inscrivent donc AVANT que la chronologie
   n'existe ; la scène la construit ensuite et rejoue les inscriptions dans
   l'ordre du document. Une primitive montée plus tard s'ajoute au vol.

   Ce qui est marqué `data-film-cache` est masqué par la feuille de style tant
   que la chronologie n'est pas construite (`html.js [data-film-cache]`), puis
   révélé dans son état de départ.

   Mouvement réduit : la chronologie est posée à 1, la scène affiche son état
   final. Sans JavaScript : tout le texte est là, dans l'ordre de lecture.
--------------------------------------------------------------------------- */

export type Inscription = (chrono: gsap.core.Timeline) => void;

type Contexte = {
  /** Ajoute des tweens à la chronologie. Renvoie de quoi se désinscrire. */
  inscrire: (fn: Inscription) => () => void;
};

const SceneContexte = createContext<Contexte | null>(null);

/** Le contexte de la scène englobante, ou `null` hors d'une scène. */
export function useScene(): Contexte | null {
  return useContext(SceneContexte);
}

export type SceneProps = React.ComponentProps<"section"> & {
  /** Chemin du fichier qui définit la scène, posé en `data-src` pour l'overlay. */
  src?: string;
  /** Passe la scène dans le monde du logo : la classe `.nuit` remappe le thème. */
  nuit?: boolean;
  /** Durée de la chronologie, en secondes. Par défaut `MOUVEMENT.film.duree`. */
  duree?: number;
  /** Quand la jouer (syntaxe ScrollTrigger). Par défaut `MOUVEMENT.film.declencheur`. */
  declencheur?: string;
};

export function Scene({
  src,
  nuit = false,
  duree = MOUVEMENT.film.duree,
  declencheur = MOUVEMENT.film.declencheur,
  className,
  children,
  ...props
}: SceneProps) {
  const ref = useRef<HTMLElement>(null);
  const inscriptions = useRef<Inscription[]>([]);
  const chrono = useRef<gsap.core.Timeline | null>(null);

  const [contexte] = useState<Contexte>(() => ({
    inscrire(fn) {
      inscriptions.current.push(fn);
      if (chrono.current) fn(chrono.current);
      return () => {
        inscriptions.current = inscriptions.current.filter((f) => f !== fn);
      };
    },
  }));

  useEffect(() => {
    const section = ref.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      chrono.current = tl;
      for (const fn of inscriptions.current) fn(tl);

      const caches = section.querySelectorAll<HTMLElement>("[data-film-cache]");
      gsap.set(caches, { visibility: "inherit" });

      if (mouvementReduit()) {
        tl.progress(1);
        return;
      }

      // La chronologie vaut 1 : on l'étire à `duree` secondes, puis on la
      // joue une fois, quand le haut de la scène atteint le bas de l'écran.
      tl.timeScale(1 / duree);
      gsap.set(caches, { willChange: "transform, opacity" });
      tl.eventCallback("onComplete", () => gsap.set(caches, { willChange: "auto" }));
      ScrollTrigger.create({
        trigger: section,
        start: declencheur,
        once: true,
        onEnter: () => tl.play(),
      });
    }, section);

    return () => {
      ctx.revert();
      chrono.current = null;
    };
  }, [duree, declencheur]);

  return (
    <SceneContexte.Provider value={contexte}>
      <section
        ref={ref}
        data-src={src}
        data-scene=""
        className={cn(
          "relative flex min-h-svh items-center overflow-hidden bg-background text-foreground",
          nuit && "nuit",
          className,
        )}
        {...props}
      >
        {children}
      </section>
    </SceneContexte.Provider>
  );
}
