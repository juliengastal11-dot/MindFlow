"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { mouvementReduit } from "@/lib/gsap";
import type { EtatDemo } from "./saas-preview-card";
import { creerLecteur, type Lecteur } from "./vtbon/moteur";
import "./vtbon/vtbon.css";

/* ---------------------------------------------------------------------------
   VTBON sur l'écran d'un iPhone du carrousel de la section 02 (demande de J,
   2026-10-07 : il remplace RelancePro).

   Ce n'est pas une imitation : ce sont les deux maquettes animées du site
   vtbon.fr, celles que J a faites (le bon de transport dicté à la voix, puis
   la facture qui passe en retard et reçoit sa relance), mises l'une après
   l'autre. Le moteur (`vtbon/moteur.ts`) joue le bon, un fondu, la facture,
   un fondu, et recommence ; le markup et le CSS sont ceux du site (`vtbon/`).

   L'écran est dessiné à la taille qu'il a dans le téléphone de vtbon.fr
   (276 px de large), puis mis à l'échelle du téléphone du carrousel. Sa
   hauteur est celle que le carrousel laisse voir avant que le bas ne s'estompe
   (les autres logiciels font de même : `HAUTEUR_APPLI` dans
   `saas-preview-card.tsx`, 420 px pour 315 de large) ; la barre du bas et les
   feuilles qui montent restent donc dans le cadre.

   `etat` vient du carrousel, comme pour les autres démos : `joue` (le
   téléphone de face), `pause` (un appui sur le téléphone, ou le carrousel hors de
   l'écran : tout se gèle là où il en est), `repos` (un téléphone de côté :
   retour au départ). Mouvement réduit : l'écran montre le bon prêt à être
   partagé, sans rien qui bouge.
--------------------------------------------------------------------------- */

/** Le gabarit de l'écran de VTBON (vtbon.css), et la part de hauteur visible : 420 px à l'échelle de 315/276. */
const ECRAN = { largeur: 276, hauteur: 368 };
/** La largeur de l'écran d'un iPhone du carrousel quand il est à 350 px (la base des autres démos). */
const LARGEUR_REFERENCE = 315;

export type VtbonEcranProps = {
  nom: string;
  description: string;
  resume?: string;
  statut?: string;
  etat: EtatDemo;
};

export function VtbonEcran({ nom, description, resume, statut, etat }: VtbonEcranProps) {
  const cadre = useRef<HTMLDivElement>(null);
  const racine = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const etatRef = useRef(etat);
  const [echelle, setEchelle] = useState(LARGEUR_REFERENCE / ECRAN.largeur);

  // L'écran dessiné à 276 px de large, mis à l'échelle de l'écran du téléphone réel.
  useLayoutEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const mesurer = () => setEchelle(el.clientWidth / ECRAN.largeur || 1);
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  // Le lecteur : monté avec l'écran, démonté avec lui.
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const l = creerLecteur(el, { reduit: mouvementReduit() });
    lecteur.current = l;
    if (etatRef.current === "joue") l.jouer();
    return () => {
      l.detruire();
      lecteur.current = null;
    };
  }, []);

  // Le carrousel dit quoi faire : jouer, s'arrêter là, ou revenir au départ.
  useEffect(() => {
    const avant = etatRef.current;
    etatRef.current = etat;
    const l = lecteur.current;
    if (!l) return;
    if (etat === "joue") {
      if (avant === "repos") l.remettre();
      l.jouer();
    } else if (etat === "pause") {
      l.pause();
    } else {
      l.remettre();
    }
  }, [etat]);

  // Pour un lecteur d'écran, l'écran est une image décrite : ce que montre la démo.
  return (
    <div
      ref={cadre}
      role="img"
      aria-label={`${nom}${statut ? ` (${statut})` : ""} : ${resume ?? description}`}
      className="vt-fond absolute inset-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ width: ECRAN.largeur, height: ECRAN.hauteur, transform: `scale(${echelle})` }}
      >
        <div ref={racine} className="vtui-root vt-scale size-full" data-theme="dark">
          <div className="vt-viewport" />
        </div>
      </div>
    </div>
  );
}
