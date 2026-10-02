import { gsap } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { echanger, entrer, notifier, ouvrir, presser, refermer, tourner, type AnimationDemo } from "./moteur";

const M = MOUVEMENT.demos;

/* ---------------------------------------------------------------------------
   Carnet, en douze secondes (scénario de J, 2026-10-02) :

   0–2 s    le tableau des chantiers ; le curseur ouvre celui de M. Dupont ;
   2–4 s    la fiche : les tâches, la progression qui avance jusqu'à 72 % ;
   4–6 s    deux tâches passent de « À faire » à « Terminé » ;
   6–8 s    les photos du chantier, et une nouvelle qui s'ajoute ;
   8–10 s   le compte-rendu se crée à partir du chantier ;
   10–12 s  la fiche se referme : retour au tableau, la boucle repart.

   L'interface est dans `carnet-preview.tsx`.
--------------------------------------------------------------------------- */

export const animerCarnet: AnimationDemo = (tl, o) => {
  const { un, q } = o;
  const liste = un("liste");
  const ligne = q("chantier")[0];
  const survol = un("chantier-survol", ligne);
  const panneau = un("panneau");
  const fil = un("fil-suite");
  const onglets = q("onglet");
  const trait = un("onglet-trait");
  const volets = [un("volet-taches"), un("volet-photos"), un("volet-cr")];
  const taches = q("tache");
  const muet = o.couleur("muted-foreground");
  const encre = o.couleur("foreground");

  // L'état de départ : la fiche attend hors champ, à droite ; le trait sous « Tâches ».
  gsap.set(panneau, { xPercent: 100, autoAlpha: 1 });
  gsap.set(trait, { x: onglets[0].offsetLeft, scaleX: onglets[0].offsetWidth });
  gsap.set(volets.slice(1), { autoAlpha: 0 });

  let ongletActif = 0;
  const allerOnglet = (i: number, a: number) => {
    o.cliquer(tl, onglets[i], a, [0.5, 0.4]);
    tl.to(trait, { x: onglets[i].offsetLeft, scaleX: onglets[i].offsetWidth, duration: 0.4, ease: "power3.inOut" }, a + 0.02);
    tl.to(onglets[ongletActif], { color: muet, duration: 0.2 }, a + 0.02);
    tl.to(onglets[i], { color: encre, duration: 0.2 }, a + 0.02);
    echanger(tl, volets[ongletActif], volets[i], a + 0.05);
    ongletActif = i;
  };

  const terminer = (tache: HTMLElement, a: number) => {
    o.cliquer(tl, un("case", tache), a);
    tl.to(un("case-plein", tache), { autoAlpha: 1, duration: 0.14, ease: "power1.out" }, a + 0.02);
    tl.fromTo(
      un("case-coche", tache),
      { autoAlpha: 0, scale: 0.4 },
      { autoAlpha: 1, scale: 1, duration: 0.34, ease: "back.out(2.2)", immediateRender: false },
      a + 0.04,
    );
    tl.to(un("tache-rature", tache), { scaleX: 1, duration: 0.34, ease: "power2.out" }, a + 0.12);
    tl.to(un("tache-label", tache), { color: muet, duration: 0.3 }, a + 0.12);
    echanger(tl, un("tache-afaire", tache), un("tache-fait", tache), a + 0.16);
  };

  // 0–2 s : le tableau des chantiers ; le curseur ouvre celui de M. Dupont.
  tl.to(survol, { autoAlpha: 1, duration: 0.2 }, 1.08);
  o.cliquer(tl, ligne, 1.35, [0.2, 0.5]);
  ouvrir(tl, o, panneau, liste, 1.5);
  tl.to(fil, { autoAlpha: 1, duration: 0.3 }, 1.62);

  // 2–4 s : la fiche. Les tâches arrivent ; la progression avance jusqu'à 72 %.
  entrer(tl, taches, 1.8);
  tl.to(un("fiche-barre"), { scaleX: 0.72, duration: 1.2, ease: "power2.out" }, 2.15);

  // 4–6 s : « Installation douche », puis « Pose carrelage », passent à Terminé.
  terminer(taches[1], 3.95);
  terminer(taches[0], 4.8);

  // 6–8 s : les photos du chantier ; une nouvelle s'ajoute.
  allerOnglet(1, 5.7);
  entrer(tl, q("photo"), 6.0, { y: 8, scale: 0.96 });
  const ajouter = un("photo-ajouter");
  o.cliquer(tl, ajouter, 6.7);
  presser(tl, ajouter, 6.7);
  entrer(tl, un("photo-neuve"), 6.8, { y: 0, scale: 0.94 });
  tl.fromTo(un("photo-envoi-barre"), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power1.inOut", immediateRender: false }, 6.9);
  tl.to(un("photo-envoi"), { autoAlpha: 0, duration: 0.25 }, 7.5);
  tl.fromTo(un("photo-image"), { filter: "blur(5px)" }, { filter: "blur(0px)", duration: 0.5, ease: "power2.out", immediateRender: false }, 7.45);

  // 8–10 s : le compte-rendu se crée à partir du chantier.
  allerOnglet(2, 7.95);
  const bouton = un("cr-bouton");
  o.cliquer(tl, bouton, 8.6);
  presser(tl, bouton, 8.6);
  echanger(tl, un("cr-bouton-label"), un("cr-bouton-attente"), 8.66, 0.2);
  tourner(tl, un("cr-roue"), 8.7, 0.6);
  const doc = un("cr-doc");
  echanger(tl, un("cr-vide"), doc, 9.25, 0.3);
  entrer(tl, q("cr-ligne"), 9.32, { stagger: 0.055 });
  // Dans une fenêtre basse (tablette), le volet défile pour montrer le bas du compte-rendu.
  const reste = doc.offsetTop + doc.offsetHeight + 10 - volets[2].clientHeight;
  if (reste > 0) tl.to(doc, { y: -reste, duration: 0.45, ease: M.trajet }, 9.95);
  notifier(tl, un("notification"), 9.85, 11.05);
  tl.addLabel("pose", 10.1);

  // 10–12 s : la fiche se referme ; retour au tableau, la boucle repart.
  o.rentrer(tl, 11.0);
  refermer(tl, panneau, liste, 11.1);
  tl.to(fil, { autoAlpha: 0, duration: 0.25 }, 11.1);
  tl.to(survol, { autoAlpha: 0, duration: 0.3 }, 11.25);
};
