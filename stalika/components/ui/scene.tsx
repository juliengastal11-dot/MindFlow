"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Scène : une section épinglée dont la chronologie suit le défilement.

   Descendre joue, remonter rembobine. La scène reste collée à l'écran le temps
   de `film.hauteur` hauteurs d'écran (moins sur téléphone), puis la page
   reprend. Les primitives du film (`Frappe`, `Decode`, `Barre`, `Trace`,
   `Champ3D`, `Rouleaux`, `Paysage`) s'inscrivent sur cette chronologie par le
   contexte `useScene()` : elles y posent leurs tweens entre deux positions,
   `de` et `a`, exprimées en fraction de la scène (0 = l'entrée, 1 = la sortie).

   Ordre d'exécution, à connaître : les effets des enfants courent avant celui
   du parent. Les primitives s'inscrivent donc AVANT que la chronologie
   n'existe ; la scène la construit ensuite et rejoue les inscriptions dans
   l'ordre du document. Une primitive montée plus tard (un rendu conditionnel)
   s'ajoute au vol.

   Ce qui est marqué `data-film-cache` est masqué par la feuille de style tant
   que la chronologie n'est pas construite (`html.js [data-film-cache]`), puis
   révélé dans son état de départ : sans ça, le texte complet apparaîtrait un
   instant avant de s'effacer pour se retaper.

   Mouvement réduit : rien n'est épinglé, la chronologie est posée à 1, la
   scène affiche son état final et le défilement reste natif. Sans
   JavaScript : tout le texte est là, dans l'ordre de lecture.

   Sur tactile, `ScrollTrigger.normalizeScroll` est activé une fois pour toutes
   les scènes : la barre d'adresse de Safari fait sauter les épinglages,
   c'est le risque connu de cette page, à tester sur un vrai téléphone.
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

let tactileNormalise = false;

export type SceneProps = React.ComponentProps<"section"> & {
  /** Chemin du fichier qui définit la scène, posé en `data-src` pour l'overlay. */
  src?: string;
  /** Passe la scène dans le monde du logo : la classe `.nuit` remappe le thème. */
  nuit?: boolean;
  /** Hauteur de défilement, en écrans. Par défaut `MOUVEMENT.film.hauteur`. */
  hauteur?: number;
  hauteurMobile?: number;
};

export function Scene({
  src,
  nuit = false,
  hauteur = MOUVEMENT.film.hauteur,
  hauteurMobile = MOUVEMENT.film.hauteurMobile,
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

      if (ScrollTrigger.isTouch === 1 && !tactileNormalise) {
        ScrollTrigger.normalizeScroll(true);
        tactileNormalise = true;
      }

      const seuil = MOUVEMENT.film.seuilMobile;
      const mm = gsap.matchMedia();
      mm.add(
        { mobile: `(max-width: ${seuil - 1}px)`, bureau: `(min-width: ${seuil}px)` },
        (c) => {
          const ecrans = c.conditions?.mobile ? hauteurMobile : hauteur;
          ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: `+=${Math.round(ecrans * 100)}%`,
            pin: true,
            anticipatePin: 1,
            scrub: MOUVEMENT.film.lissage,
            animation: tl,
            invalidateOnRefresh: true,
            onToggle: (st) =>
              gsap.set(caches, { willChange: st.isActive ? "transform, opacity" : "auto" }),
          });
        },
      );
    }, section);

    return () => {
      ctx.revert();
      chrono.current = null;
    };
  }, [hauteur, hauteurMobile]);

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
