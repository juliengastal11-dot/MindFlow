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

   Une scène peut pourtant suivre le défilement (`defilement`) : « La
   relecture », refaite le 2026-10-07 à la demande de J (« avec le
   défilement, on change si ce n'est pas bien »). Cette fois sans épinglage
   par JavaScript : la scène contient une piste (`[data-piste]`), plus haute
   que l'écran, dans laquelle son contenu reste collé par `position: sticky`,
   donc par le navigateur, sans à-coup. La chronologie avance avec le
   défilement de la piste, de l'instant où le contenu se colle, au milieu de
   l'écran, jusqu'à celui où il se décolle. Pour revenir au déclenchement à
   l'arrivée, retirer `defilement` : la scène reprend sa hauteur d'un écran
   (`declencheur` règle alors le moment où elle se lance).

   Les primitives du film (`Frappe`, `Decode`, `Barre`, `Trace`, `Roue`,
   `Rouleaux`) s'inscrivent sur cette chronologie par le contexte
   `useScene()` : elles y posent leurs tweens entre deux positions, `de` et
   `a`, en fraction de la chronologie (0 = le début, 1 = la fin). Ce qui ne
   se tween pas (un état qui bascule à un seuil) lit la progression par
   `surProgres`.

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
  /** Reçoit la progression de la chronologie (de 0 à 1) à chaque image où elle
      change, et une fois à la création. Renvoie de quoi se désinscrire. */
  surProgres: (fn: (progres: number) => void) => () => void;
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
  /** La chronologie suit le défilement de la piste `[data-piste]` que la scène contient,
      au lieu de se jouer seule. La scène n'a plus de hauteur propre : c'est la piste qui
      la fait, et son contenu s'y colle (voir l'en-tête). */
  defilement?: boolean;
  /** Lecture à l'arrivée : la position (ScrollTrigger) qui la lance. Par défaut `MOUVEMENT.film.declencheur`. */
  declencheur?: string;
};

export function Scene({
  src,
  nuit = false,
  duree = MOUVEMENT.film.duree,
  defilement = false,
  declencheur = MOUVEMENT.film.declencheur,
  className,
  children,
  ...props
}: SceneProps) {
  const ref = useRef<HTMLElement>(null);
  const inscriptions = useRef<Inscription[]>([]);
  const abonnes = useRef<Set<(progres: number) => void>>(new Set());
  const chrono = useRef<gsap.core.Timeline | null>(null);

  const [contexte] = useState<Contexte>(() => ({
    inscrire(fn) {
      inscriptions.current.push(fn);
      if (chrono.current) fn(chrono.current);
      return () => {
        inscriptions.current = inscriptions.current.filter((f) => f !== fn);
      };
    },
    surProgres(fn) {
      abonnes.current.add(fn);
      if (chrono.current) fn(chrono.current.progress());
      return () => {
        abonnes.current.delete(fn);
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
      if (caches.length) gsap.set(caches, { visibility: "inherit" });

      // La progression, pour ce qui bascule à un seuil plutôt que de se tweener.
      const emettre = () => {
        const p = tl.progress();
        abonnes.current.forEach((f) => f(p));
      };
      tl.eventCallback("onUpdate", emettre);
      emettre();

      // En développement : la chronologie accrochée à la scène, pour l'avancer à la main depuis un test.
      if (process.env.NODE_ENV === "development") (section as HTMLElement & { __film?: gsap.core.Timeline }).__film = tl;

      if (mouvementReduit()) {
        tl.progress(1);
        return;
      }

      const piste = defilement ? section.querySelector<HTMLElement>("[data-piste]") : null;
      if (piste) {
        // Au défilement : la chronologie dure exactement 1, et suit la piste d'un bout à l'autre.
        tl.set({}, {}, 1);
        ScrollTrigger.create({
          trigger: piste,
          start: "top top",
          end: "bottom bottom",
          scrub: MOUVEMENT.relecture.lissage,
          animation: tl,
          invalidateOnRefresh: true,
        });
        return;
      }

      // La chronologie vaut 1 : on l'étire à `duree` secondes, puis on la
      // joue une fois, quand le haut de la scène atteint le bas de l'écran.
      tl.timeScale(1 / duree);
      if (caches.length) {
        gsap.set(caches, { willChange: "transform, opacity" });
        tl.eventCallback("onComplete", () => gsap.set(caches, { willChange: "auto" }));
      }
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
  }, [duree, defilement, declencheur]);

  return (
    <SceneContexte.Provider value={contexte}>
      <section
        ref={ref}
        data-src={src}
        data-scene=""
        className={cn(
          "relative bg-background text-foreground",
          !defilement && "flex min-h-svh items-center overflow-hidden",
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
