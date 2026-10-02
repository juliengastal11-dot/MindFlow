import { gsap } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { echanger, entrer, notifier, ouvrir, presser, refermer, type AnimationDemo } from "./moteur";

/* ---------------------------------------------------------------------------
   Contrôle, en douze secondes (scénario de J, 2026-10-02) :

   0–2 s    la checklist de fermeture : tout est coché sauf la température du
            frigo n°2, qu'on saisit ;
   2–4 s    9,2 °C, hors seuil : l'anomalie se signale ;
   4–6 s    l'incident #248 s'ouvre ; une photo et un commentaire s'y ajoutent ;
   6–8 s    l'attribution : Thomas, « Vérifier le frigo », demain 10:00 ;
   8–10 s   l'historique de l'incident se complète ;
   10–12 s  retour progressif à la checklist de départ, la boucle repart.

   L'interface est dans `controle-preview.tsx`.
--------------------------------------------------------------------------- */

const M = MOUVEMENT.demos;

export const animerControle: AnimationDemo = (tl, o) => {
  const { un, q } = o;
  const liste = un("liste");
  const champ = un("releve-champ");
  const valeur = un("releve-valeur");
  const actif = un("releve-actif");
  const fond = un("releve-fond");
  const caracteres = q("releve-car");
  const unite = un("releve-unite");
  const panneau = un("panneau");
  const contenu = un("incident-contenu");
  const fil = un("fil-suite");
  const menu = un("incident-menu");
  const option = un("incident-option");

  // L'état de départ : la fiche d'incident attend hors champ, à droite.
  gsap.set(panneau, { xPercent: 100, autoAlpha: 1 });

  // 0–2 s : la checklist ; on saisit la température du frigo n°2.
  o.cliquer(tl, champ, 1.2);
  tl.to(actif, { autoAlpha: 1, duration: 0.2 }, 1.2);
  tl.to(un("releve-vide"), { autoAlpha: 0, duration: 0.1 }, 1.3);
  tl.to(caracteres, { autoAlpha: 1, duration: 0.01, stagger: 0.12 }, 1.45);
  tl.to(unite, { autoAlpha: 1, duration: 0.01 }, 1.85);

  // 2–4 s : 9,2 °C, hors seuil : l'anomalie se signale.
  tl.to(actif, { autoAlpha: 0, duration: 0.25 }, 2.2);
  tl.to(fond, { autoAlpha: 1, duration: 0.3 }, 2.2);
  tl.to(valeur, { color: o.couleur("destructive"), duration: 0.3 }, 2.2);
  echanger(tl, un("releve-seuil"), un("releve-hors"), 2.3);

  // 4–6 s : « Signaler » ouvre l'incident ; une photo et un commentaire s'y ajoutent.
  const signaler = un("signaler");
  o.cliquer(tl, signaler, 3.55);
  presser(tl, signaler, 3.55);
  ouvrir(tl, o, panneau, liste, 3.7);
  tl.to(fil, { autoAlpha: 1, duration: 0.3 }, 3.8);
  entrer(tl, un("incident-photo"), 4.3, { y: 0, scale: 0.9 });
  tl.fromTo(un("incident-envoi-barre"), { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power1.inOut", immediateRender: false }, 4.4);
  tl.to(un("incident-envoi"), { autoAlpha: 0, duration: 0.2 }, 4.92);
  tl.fromTo(un("incident-image"), { filter: "blur(4px)" }, { filter: "blur(0px)", duration: 0.45, ease: "power2.out", immediateRender: false }, 4.85);
  entrer(tl, un("incident-commentaire"), 5.05);

  // 6–8 s : l'attribution ; Thomas, puis l'action et l'échéance.
  o.cliquer(tl, un("incident-select"), 5.95);
  tl.fromTo(menu, { autoAlpha: 0, y: -4, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: M.sortie, immediateRender: false }, 6.0);
  tl.to(option, { backgroundColor: o.couleur("muted"), duration: 0.12 }, 6.4);
  o.cliquer(tl, option, 6.55, [0.3, 0.5]);
  tl.to(menu, { autoAlpha: 0, duration: 0.15 }, 6.68);
  echanger(tl, un("incident-choisir"), un("incident-thomas"), 6.68);
  entrer(tl, q("incident-valeur"), 6.95, { y: 0, stagger: 0.28 });
  echanger(tl, un("incident-ouvert"), un("incident-encours"), 7.55);
  notifier(tl, un("notification"), 7.6, 8.65);

  // 8–10 s : l'historique de l'incident ; la fiche défile s'il le faut.
  const reste = Math.max(0, contenu.offsetHeight - panneau.offsetHeight);
  if (reste > 0) tl.to(contenu, { y: -reste, duration: 0.5, ease: M.trajet }, 7.95);
  entrer(tl, q("histo-ligne"), 8.35, { y: 4, stagger: 0.3 });
  tl.addLabel("pose", 9.1);

  // 10–12 s : la fiche se referme ; la checklist redevient, en douceur, celle du départ.
  o.rentrer(tl, 10.6);
  refermer(tl, panneau, liste, 10.75);
  tl.to(fil, { autoAlpha: 0, duration: 0.25 }, 10.75);
  tl.to([fond, ...caracteres, unite], { autoAlpha: 0, duration: 0.35 }, 11.15);
  echanger(tl, un("releve-hors"), un("releve-seuil"), 11.15);
  tl.to(un("releve-vide"), { autoAlpha: 1, duration: 0.3 }, 11.35);
  tl.set(valeur, { color: o.couleur("foreground") }, 11.55);
};
