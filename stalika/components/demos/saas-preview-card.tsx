"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { creerOutils, type AnimationDemo } from "./moteur";
import { EcranTelephone } from "./interface";

/* ---------------------------------------------------------------------------
   SaaSPreviewCard : un logiciel, vivant, sur l'écran d'un iPhone du carrousel
   (components/ui/phone-mockups-1-utils, choisi par J le 2026-10-02).

   La carte pose sa couleur (`accent`, en `--color-produit`), dessine
   l'écran à la taille qu'il a dans un iPhone de 350 px (315 × 682) puis le
   met à l'échelle du téléphone réel, et fait tourner le film de `animation`
   sur sa fenêtre. L'application occupe le haut de l'écran : le carrousel
   coupe ses téléphones au bas de la scène et pose ses boutons par-dessus.

   `etat` vient du carrousel : `joue` (le téléphone de face), `pause` (le
   bouton pause, ou le carrousel hors de l'écran : le film s'arrête là où il
   en est), `repos` (un téléphone de côté : le film revient à son départ, et
   repartira du début quand il passera de face).

   Mouvement réduit : pas de film ; l'écran montre l'étape la plus parlante
   (le repère « pose »), sans curseur ni doigt.

   Le nom, la description et le statut se lisent dans la légende du
   carrousel ; ici, ils décrivent l'écran aux lecteurs d'écran.
--------------------------------------------------------------------------- */

const M = MOUVEMENT.demos;

/** L'écran d'un iPhone de 350 px dans le dessin du carrousel. */
const ECRAN = { largeur: 315, hauteur: 682 };
/** La part de l'écran que la scène laisse voir au-dessus des boutons du carrousel. */
const HAUTEUR_APPLI = 420;

export type EtatDemo = "joue" | "pause" | "repos";

export type SaaSPreviewCardProps = {
  nom: string;
  description: string;
  /** Ce que la démo montre, en une phrase : l'écran le dit aux lecteurs d'écran. */
  resume?: string;
  /** La couleur du logiciel : une valeur CSS, en général `var(--produit-…)`. */
  accent: string;
  /** Une étiquette à côté du nom : « Démo », « Disponible »… */
  statut?: string;
  /** L'heure de la barre d'état du téléphone. */
  heure: string;
  /** Le film de la démo, joué en boucle sur la fenêtre. */
  animation: AnimationDemo;
  etat: EtatDemo;
  /** L'interface de la démo : une `Fenetre` (components/demos/interface). */
  children: React.ReactNode;
};

export function SaaSPreviewCard({ nom, description, resume, accent, statut, heure, animation, etat, children }: SaaSPreviewCardProps) {
  const ecran = useRef<HTMLDivElement>(null);
  const film = useRef<gsap.core.Timeline | null>(null);
  const etatRef = useRef(etat);
  const [echelle, setEchelle] = useState(1);

  // L'écran dessiné à 315 px de large, mis à l'échelle du téléphone réel.
  useLayoutEffect(() => {
    const el = ecran.current;
    if (!el) return;
    const mesurer = () => setEchelle(el.clientWidth / ECRAN.largeur || 1);
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  // Le film : construit une fois la fenêtre en place, reconstruit au même instant
  // quand les polices arrivent (les largeurs du texte changent les positions visées).
  useEffect(() => {
    const fenetre = ecran.current?.querySelector<HTMLElement>("[data-fenetre]");
    if (!fenetre) return;
    const reduit = mouvementReduit();
    let ctx: gsap.Context | undefined;
    let vivant = true;

    const construire = () => {
      if (!vivant) return;
      const instant = film.current?.time() ?? 0;
      ctx?.revert();
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ paused: true, repeat: -1 });
        animation(tl, creerOutils(fenetre));
        if (tl.duration() < M.boucle) tl.to({}, { duration: M.boucle - tl.duration() });
        film.current = tl;
        // En développement : le film accroché à sa fenêtre, pour l'avancer à la main depuis un test.
        if (process.env.NODE_ENV === "development") (fenetre as HTMLElement & { __film?: gsap.core.Timeline }).__film = tl;
        if (reduit) {
          tl.seek(tl.labels.pose ?? tl.duration() * 0.8);
          gsap.set(fenetre.querySelectorAll('[data-d="curseur"], [data-d="anneau"], [data-d="doigt"]'), { autoAlpha: 0 });
          return;
        }
        tl.time(etatRef.current === "repos" ? 0 : instant);
        if (etatRef.current === "joue") tl.play();
      }, fenetre);
    };

    construire();
    document.fonts?.ready.then(() => {
      if (vivant && document.fonts.status === "loaded") construire();
    });

    return () => {
      vivant = false;
      ctx?.revert();
      film.current = null;
    };
  }, [animation]);

  // Le carrousel dit quoi faire : jouer, s'arrêter là, ou revenir au départ.
  useEffect(() => {
    const avant = etatRef.current;
    etatRef.current = etat;
    const tl = film.current;
    if (!tl || mouvementReduit()) return;
    if (etat === "joue") {
      if (avant === "repos") tl.restart();
      else tl.play();
    } else if (etat === "pause") {
      tl.pause();
    } else {
      tl.pause(0);
    }
  }, [etat]);

  // Pour un lecteur d'écran, l'écran est une image décrite : ce que montre la démo.
  return (
    <div
      ref={ecran}
      role="img"
      aria-label={`${nom}${statut ? ` (${statut})` : ""} : ${resume ?? description}`}
      className="jour absolute inset-0 bg-card"
    >
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 origin-top-left"
        style={
          {
            width: ECRAN.largeur,
            height: HAUTEUR_APPLI,
            transform: `scale(${echelle})`,
            "--color-produit": accent,
          } as React.CSSProperties
        }
      >
        <EcranTelephone.Provider value={{ heure }}>{children}</EcranTelephone.Provider>
      </div>
    </div>
  );
}
