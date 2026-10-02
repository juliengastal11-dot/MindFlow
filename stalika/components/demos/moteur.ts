import { gsap } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Le moteur des démos : ce que les trois partagent pour écrire leur film.

   Une démo est une fonction qui pose ses étapes, en secondes, sur une
   chronologie GSAP fournie par sa carte (`SaaSPreviewCard`), qui la joue en
   boucle. Elle trouve ses éléments par leur marque `data-d="…"`, jamais par
   leurs classes : la mise en page peut changer sans casser le film.

   Le curseur vise un point d'un élément, mesuré par la chaîne des
   `offsetLeft/offsetTop` jusqu'à la fenêtre : une mesure qui ignore les
   transformations, donc juste quand le panneau visé est encore hors champ,
   et quand le carrousel réduit la carte. Dans une fenêtre étroite (la mise en
   page du téléphone), pas de flèche : un doigt, qui touche sans voyager.

   La boucle. La fin de chaque démo ramène l'écran à son état de départ ;
   quand la chronologie repart de zéro, GSAP rembobine chaque tween à sa
   valeur d'avant, et rien ne saute. D'où la règle : tout ce qui change
   pendant la démo change PAR la chronologie, et ce qui doit entrer en scène
   est masqué dès la construction (`entrer` s'en charge).
--------------------------------------------------------------------------- */

const M = MOUVEMENT.demos;

type Chrono = gsap.core.Timeline;
type Point = { x: number; y: number };
/** Un point dans la boîte d'un élément, en fractions de sa largeur et de sa hauteur. */
export type Ancre = readonly [number, number];

export type OutilsDemo = {
  /** Tous les éléments marqués `data-d="nom"` dans la fenêtre, ou dans `dans`. */
  q: (nom: string, dans?: HTMLElement) => HTMLElement[];
  /** Le premier. Une marque absente lève une erreur : une démo cassée doit se voir. */
  un: (nom: string, dans?: HTMLElement) => HTMLElement;
  /** Fenêtre étroite : la mise en page du téléphone. */
  compact: boolean;
  /** Une couleur du thème telle que la fenêtre la résout (`foreground`, `muted-foreground`…). */
  couleur: (nom: string) => string;
  /** Le curseur va sur `cible` et y arrive à l'instant `a`. */
  aller: (tl: Chrono, cible: HTMLElement, a: number, ancre?: Ancre) => void;
  /** Il y va, et clique à l'instant `a`. */
  cliquer: (tl: Chrono, cible: HTMLElement, a: number, ancre?: Ancre) => void;
  /** Il revient à sa place de repos, à partir de l'instant `a`. */
  rentrer: (tl: Chrono, a: number) => void;
};

export type AnimationDemo = (tl: Chrono, o: OutilsDemo) => void;

/** La position d'un point d'un élément dans le repère de `fenetre`, transformations ignorées. */
function mesurer(el: HTMLElement, fenetre: HTMLElement, [fx, fy]: Ancre): Point {
  let x = el.offsetWidth * fx;
  let y = el.offsetHeight * fy;
  let n: HTMLElement | null = el;
  while (n && n !== fenetre) {
    const parent = n.offsetParent as HTMLElement | null;
    x += n.offsetLeft + (parent && parent !== fenetre ? parent.clientLeft : 0);
    y += n.offsetTop + (parent && parent !== fenetre ? parent.clientTop : 0);
    n = parent;
  }
  return { x, y };
}

export function creerOutils(fenetre: HTMLElement): OutilsDemo {
  const compact = fenetre.offsetWidth < 512;
  const styles = getComputedStyle(fenetre);
  const curseur = fenetre.querySelector<HTMLElement>('[data-d="curseur"]');
  const anneau = fenetre.querySelector<HTMLElement>('[data-d="anneau"]');
  const doigt = fenetre.querySelector<HTMLElement>('[data-d="doigt"]');
  const repos = { x: fenetre.offsetWidth * 0.86, y: fenetre.offsetHeight * 0.9 };

  const q = (nom: string, dans: HTMLElement = fenetre) =>
    Array.from(dans.querySelectorAll<HTMLElement>(`[data-d="${nom}"]`));
  const un = (nom: string, dans: HTMLElement = fenetre) => {
    const el = dans.querySelector<HTMLElement>(`[data-d="${nom}"]`);
    if (!el) throw new Error(`Démo : l'élément « ${nom} » est introuvable.`);
    return el;
  };

  if (curseur) gsap.set(curseur, { x: repos.x, y: repos.y, autoAlpha: compact ? 0 : 1 });
  if (anneau) gsap.set(anneau, { autoAlpha: 0 });
  if (doigt) gsap.set(doigt, { autoAlpha: 0 });

  const aller: OutilsDemo["aller"] = (tl, cible, a, ancre = [0.5, 0.55]) => {
    if (compact || !curseur) return;
    const p = mesurer(cible, fenetre, ancre);
    const depart = Math.max(0, a - M.curseur.trajet);
    // Deux courbes différentes en x et en y : la trajectoire s'incurve un peu, comme une main.
    tl.to(curseur, { x: p.x, duration: a - depart, ease: M.trajet }, depart);
    tl.to(curseur, { y: p.y, duration: a - depart, ease: "sine.inOut" }, depart);
  };

  const cliquer: OutilsDemo["cliquer"] = (tl, cible, a, ancre = [0.5, 0.55]) => {
    const p = mesurer(cible, fenetre, ancre);
    if (compact) {
      if (!doigt) return;
      tl.fromTo(
        doigt,
        { x: p.x, y: p.y, scale: 0.55, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.14, ease: "power2.out", immediateRender: false },
        a - 0.14,
      );
      tl.to(doigt, { scale: 1.3, autoAlpha: 0, duration: 0.34, ease: "power2.out" }, a + 0.06);
      return;
    }
    aller(tl, cible, a, ancre);
    if (!curseur) return;
    tl.to(curseur, { scale: 0.84, duration: M.curseur.appui * 0.45, ease: "power2.out" }, a);
    tl.to(curseur, { scale: 1, duration: M.curseur.appui, ease: "power2.out" }, a + M.curseur.appui * 0.45);
    if (anneau) {
      tl.fromTo(
        anneau,
        { x: p.x, y: p.y, scale: 0.3, autoAlpha: 0.5 },
        { scale: 1.5, autoAlpha: 0, duration: 0.42, ease: "power2.out", immediateRender: false },
        a,
      );
    }
  };

  const rentrer: OutilsDemo["rentrer"] = (tl, a) => {
    if (compact || !curseur) return;
    tl.to(curseur, { x: repos.x, duration: 0.75, ease: M.trajet }, a);
    tl.to(curseur, { y: repos.y, duration: 0.75, ease: "sine.inOut" }, a);
  };

  return {
    q,
    un,
    compact,
    couleur: (nom) => styles.getPropertyValue(`--color-${nom}`).trim(),
    aller,
    cliquer,
    rentrer,
  };
}

/* --- Les gestes communs ------------------------------------------------------ */

type Cible = gsap.TweenTarget;

/** Des éléments qui entrent en scène, l'un après l'autre. Masqués dès la construction. */
export function entrer(tl: Chrono, els: Cible, a: number, vars: gsap.TweenVars = {}) {
  const { y = 6, scale, ...reste } = vars;
  gsap.set(els, { autoAlpha: 0 });
  tl.fromTo(
    els,
    { autoAlpha: 0, y, ...(scale !== undefined ? { scale } : {}) },
    {
      autoAlpha: 1,
      y: 0,
      ...(scale !== undefined ? { scale: 1 } : {}),
      duration: M.apparition,
      ease: M.sortie,
      stagger: M.decalage,
      immediateRender: false,
      ...reste,
    },
    a,
  );
}

/** Un élément cède la place à un autre, au même endroit. */
export function echanger(tl: Chrono, sortant: Cible, entrant: Cible, a: number, duree = 0.24) {
  tl.to(sortant, { autoAlpha: 0, y: -3, duration: duree * 0.8, ease: "power2.in" }, a);
  tl.fromTo(
    entrant,
    { autoAlpha: 0, y: 4 },
    { autoAlpha: 1, y: 0, duration: duree, ease: M.sortie, immediateRender: false },
    a + duree * 0.5,
  );
}

/** Un appui : l'élément s'enfonce un instant. */
export function presser(tl: Chrono, el: Cible, a: number) {
  tl.to(el, { scale: 0.96, duration: 0.07, ease: "power2.out" }, a);
  tl.to(el, { scale: 1, duration: 0.22, ease: "power2.out" }, a + 0.07);
}

/** La notification : elle arrive à `de`, repart à `a`. Dans le coin, elle monte ;
    sur un téléphone, elle descend du haut de l'écran. */
export function notifier(tl: Chrono, el: HTMLElement, de: number, a: number) {
  const sens = el.closest("[data-telephone]") ? -1 : 1;
  tl.fromTo(
    el,
    { autoAlpha: 0, y: 10 * sens, scale: 0.98 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.36, ease: M.sortie, immediateRender: false },
    de,
  );
  tl.to(el, { autoAlpha: 0, y: 6 * sens, duration: 0.3, ease: "power2.in" }, a);
}

/** Une roue de chargement qui tourne pendant `duree`. */
export function tourner(tl: Chrono, el: Cible, a: number, duree: number) {
  tl.fromTo(el, { rotation: 0 }, { rotation: 360 * Math.max(1, Math.round(duree / 0.6)), duration: duree, ease: "none", immediateRender: false }, a);
}

/** Un panneau qui glisse depuis la droite, et l'écran qu'il recouvre qui s'efface un peu. */
export function ouvrir(tl: Chrono, o: OutilsDemo, panneau: HTMLElement, dessous: HTMLElement, a: number) {
  tl.to(panneau, { xPercent: 0, duration: M.panneau, ease: "power3.out" }, a);
  tl.to(dessous, { autoAlpha: o.compact ? 0.3 : 0.55, x: o.compact ? -18 : 0, duration: M.panneau, ease: "power3.out" }, a);
}

/** Le même panneau qui repart, et l'écran du dessous qui revient. */
export function refermer(tl: Chrono, panneau: HTMLElement, dessous: HTMLElement, a: number) {
  tl.to(panneau, { xPercent: 100, duration: 0.56, ease: M.trajet }, a);
  tl.to(dessous, { autoAlpha: 1, x: 0, duration: 0.56, ease: M.trajet }, a);
}
