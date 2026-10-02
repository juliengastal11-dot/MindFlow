import { gsap } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { echanger, entrer, notifier, ouvrir, presser, refermer, tourner, type AnimationDemo } from "./moteur";

/* ---------------------------------------------------------------------------
   RelancePro, en douze secondes (scénario de J, 2026-10-02) :

   0–2 s    le tableau de bord, « À relancer aujourd'hui » ; le curseur ouvre
            la facture de M. Martin ;
   2–4 s    la facture n°124 : échéance dépassée, le retard se signale ;
   4–6 s    la fenêtre du message de relance ;
   6–8 s    clic sur « Envoyer la relance » : le statut devient « Relance envoyée » ;
   8–10 s   l'historique : la relance du jour s'inscrit en tête ;
   10–12 s  retour au tableau de bord, la boucle repart.

   L'interface est dans `relance-preview.tsx`.
--------------------------------------------------------------------------- */

const M = MOUVEMENT.demos;

export const animerRelance: AnimationDemo = (tl, o) => {
  const { un, q } = o;
  const tableau = un("tableau");
  const ligne = q("facture")[0];
  const survol = un("facture-survol", ligne);
  const panneau = un("panneau");
  const contenu = un("fiche-contenu");
  const fil = un("fil-suite");
  const relancer = un("fiche-relancer");
  const voile = un("voile");
  const message = un("message");
  const envoyer = un("envoyer");
  const nouvelle = un("histo-nouvelle");
  const anciennes = q("histo-ancienne");

  // L'état de départ : la fiche hors champ ; dans son historique, la place de
  // la relance du jour est réservée, les lignes plus anciennes la recouvrent.
  gsap.set(panneau, { xPercent: 100, autoAlpha: 1 });
  gsap.set(nouvelle, { autoAlpha: 0 });
  gsap.set(anciennes, { y: -nouvelle.offsetHeight });

  // 0–2 s : le tableau ; le curseur ouvre la facture de M. Martin.
  tl.to(survol, { autoAlpha: 1, duration: 0.2 }, 1.05);
  o.cliquer(tl, ligne, 1.3, [0.25, 0.5]);
  ouvrir(tl, o, panneau, tableau, 1.45);
  tl.to(fil, { autoAlpha: 1, duration: 0.3 }, 1.55);

  // 2–4 s : la facture n°124 ; l'échéance est dépassée et le retard se signale.
  entrer(tl, un("fiche-alerte"), 2.15, { y: 4 });
  tl.to(un("fiche-retard"), { scale: 1.08, duration: 0.16, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.35);

  // 4–6 s : la fenêtre du message de relance.
  o.cliquer(tl, relancer, 3.7);
  presser(tl, relancer, 3.7);
  tl.to(voile, { autoAlpha: 1, duration: 0.3 }, 3.82);
  tl.fromTo(
    message,
    { autoAlpha: 0, y: 10, scale: 0.97 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: M.sortie, immediateRender: false },
    3.85,
  );

  // 6–8 s : « Envoyer la relance » ; le bouton, puis la facture, passent à « Relance envoyée ».
  o.cliquer(tl, envoyer, 6.05);
  presser(tl, envoyer, 6.05);
  echanger(tl, un("envoyer-label"), un("envoyer-attente"), 6.1, 0.18);
  tourner(tl, un("envoyer-roue"), 6.12, 0.55);
  tl.to(un("envoyer-fond"), { autoAlpha: 1, duration: 0.25 }, 6.62);
  echanger(tl, un("envoyer-attente"), un("envoyer-fait"), 6.62, 0.2);
  tl.to(message, { autoAlpha: 0, y: 6, scale: 0.98, duration: 0.3, ease: "power2.in" }, 7.2);
  tl.to(voile, { autoAlpha: 0, duration: 0.3 }, 7.25);
  echanger(tl, un("fiche-retard"), un("fiche-relancee"), 7.45);
  notifier(tl, un("notification"), 7.5, 8.8);

  // 8–10 s : l'historique ; la relance du jour s'inscrit en tête, les anciennes descendent.
  const reste = Math.max(0, contenu.offsetHeight - panneau.offsetHeight);
  if (reste > 0) tl.to(contenu, { y: -reste, duration: 0.5, ease: M.trajet }, 7.75);
  tl.to(anciennes, { y: 0, duration: 0.4, ease: "power2.out" }, 7.95);
  tl.fromTo(nouvelle, { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: M.sortie, immediateRender: false }, 8.1);
  tl.fromTo(un("histo-point"), { scale: 1 }, { scale: 1.9, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut", immediateRender: false }, 8.25);
  tl.addLabel("pose", 9.4);

  // 10–12 s : retour au tableau de bord.
  o.rentrer(tl, 10.75);
  refermer(tl, panneau, tableau, 10.9);
  tl.to(fil, { autoAlpha: 0, duration: 0.25 }, 10.9);
  tl.to(survol, { autoAlpha: 0, duration: 0.3 }, 11.05);
};
