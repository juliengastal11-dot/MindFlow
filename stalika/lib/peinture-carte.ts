import type { Calques, Points } from "@/lib/realisations";

/* ---------------------------------------------------------------------------
   La peinture d'une carte de la roue.

   Une carte est un pan de cylindre, découpé en bandes horizontales (voir
   `components/ui/roue.tsx`) : chaque bande est un petit canevas, posé sur le
   cylindre par la CSS. Ce fichier sait remplir UNE bande : il reçoit la scène
   entière (le site tel qu'on le voit à plat, dans une carte de `l` × `h`
   pixels) et la fenêtre verticale `y0`–`y1` de la bande, et ne dessine que ce
   qui s'y trouve. Le canevas est réglé par l'appelant pour que ses
   coordonnées soient celles de la carte.

   Deux façons de composer un site :
   · « plat » : l'affiche, les tranches de la page, et par-dessus la vidéo du
     haut de page quand elle joue ;
   · « calques » (VTBON) : un FILM qui ne défile pas, avec son voile ; la page,
     transparente, défile par-dessus ; et l'entrée du héros est rejouée bloc
     par bloc. Le film avance avec le défilement, comme sur le site.

   Rien ici n'est lié à React : des fonctions pures sur un contexte 2D.
--------------------------------------------------------------------------- */

/** Largeur des tranches de la page, en pixels. */
export const LARGEUR_PAGE = 600;
/** Largeur de la capture dont viennent les mesures (en-têtes, boîtes du héros). */
export const LARGEUR_CAPTURE = 390;
/** Marge autour d'un bloc du héros qu'on anime, en pixels de la capture : un
    soulignement ou une ombre ne doit pas être coupé. */
const MARGE_BLOC = 6;

export type Tranche = { img: HTMLImageElement | null; haut: number; hauteur: number };

export type Scene = {
  /** Taille de la carte, en pixels CSS. */
  l: number;
  h: number;
  /** Rayon des coins, en pixels CSS. */
  rayon: number;
  fond: string;
  contour: string;
  /** Défilement dans la page, en pixels CSS de la carte. */
  defilement: number;
  affiche: HTMLImageElement | null;
  /** La vidéo du haut de page, quand elle a une image à montrer. */
  video: HTMLVideoElement | null;
  /** Les tranches de la page : position et hauteur en pixels d'une page de 600 de large. */
  tranches: Tranche[];
  calques?: {
    config: Calques;
    /** Les images du film : `null` tant qu'elles ne sont pas chargées. */
    images: (HTMLImageElement | null)[];
    /** Secondes depuis le début de l'entrée du héros ; négatif : pas commencée ; `Infinity` : finie. */
    entree: number;
  };
};

/* --- Outils --------------------------------------------------------------- */

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Interpole une courbe en points. */
export function interpoler(points: Points, x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return points[points.length - 1][1];
}

/** Une courbe d'accélération `cubic-bezier(x1, y1, x2, y2)`, comme en CSS. */
export function courbeBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x;
      if (Math.abs(e) < 1e-5) return Y(t);
      const d = dX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    // Newton a échoué : on coupe en deux.
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      if (X(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
}

function cheminArrondi(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

type Source = HTMLImageElement | HTMLVideoElement;

function dimensions(s: Source): [number, number] {
  return s instanceof HTMLVideoElement ? [s.videoWidth, s.videoHeight] : [s.naturalWidth, s.naturalHeight];
}

/**
 * Pose une partie d'une source dans un rectangle de la carte, en ne dessinant
 * que ce qui tombe dans la fenêtre `y0`–`y1` de la bande.
 * `sy`/`sh` : les lignes de la source ; `dy`/`dh` : où elles vont (en pixels de la carte).
 */
function tracerLignes(
  ctx: CanvasRenderingContext2D,
  src: Source,
  sy: number,
  sh: number,
  dy: number,
  dh: number,
  l: number,
  y0: number,
  y1: number,
  alpha = 1,
) {
  const [sw] = dimensions(src);
  if (!sw || dh <= 0 || sh <= 0) return;
  const haut = Math.max(dy, y0);
  const bas = Math.min(dy + dh, y1);
  if (bas <= haut) return;
  const k = sh / dh;
  if (alpha !== 1) ctx.globalAlpha = alpha;
  ctx.drawImage(src, 0, sy + (haut - dy) * k, sw, (bas - haut) * k, 0, haut, l, bas - haut);
  if (alpha !== 1) ctx.globalAlpha = 1;
}

/** Pose une source entière dans le rectangle `dy`/`dh`, pleine largeur. */
function tracer(ctx: CanvasRenderingContext2D, src: Source, dy: number, dh: number, l: number, y0: number, y1: number, alpha = 1) {
  const [, sh] = dimensions(src);
  tracerLignes(ctx, src, 0, sh, dy, dh, l, y0, y1, alpha);
}

/** L'image chargée la plus proche de `i`, ou `null` s'il n'y en a aucune. */
function plusProche(images: (HTMLImageElement | null)[], i: number): HTMLImageElement | null {
  for (let d = 0; d < images.length; d++) {
    const a = images[i - d];
    if (a) return a;
    const b = images[i + d];
    if (b) return b;
  }
  return null;
}

/* --- Les deux compositions ------------------------------------------------ */

function peindrePlat(ctx: CanvasRenderingContext2D, s: Scene, y0: number, y1: number) {
  const k = s.l / LARGEUR_PAGE;
  // Le haut de page : même format que la carte (0,6), donc sa hauteur est celle de la carte.
  if (s.affiche) tracer(ctx, s.affiche, -s.defilement, s.h, s.l, y0, y1);
  for (const t of s.tranches) {
    if (t.img) tracer(ctx, t.img, t.haut * k - s.defilement, t.hauteur * k, s.l, y0, y1);
  }
  if (s.video) tracer(ctx, s.video, -s.defilement, s.h, s.l, y0, y1);
}

function peindreCalques(ctx: CanvasRenderingContext2D, s: Scene, y0: number, y1: number) {
  const c = s.calques;
  if (!c) return;
  const cfg = c.config;
  const kc = s.l / LARGEUR_CAPTURE; // pixels de la capture → pixels de la carte
  const kp = s.l / LARGEUR_PAGE; // pixels d'une tranche → pixels de la carte
  const p = borne(s.defilement / kc / cfg.finPage, 0, 1);

  // 1. Le film, fixe derrière la page : l'image du moment, fondue dans la suivante.
  const idx = interpoler(cfg.courbe, p) * (cfg.images - 1);
  const i0 = Math.floor(idx);
  const f = idx - i0;
  const a = plusProche(c.images, i0);
  const b = plusProche(c.images, Math.min(cfg.images - 1, i0 + 1));
  if (a) tracer(ctx, a, 0, s.h, s.l, y0, y1);
  if (b && b !== a && f > 0.003) tracer(ctx, b, 0, s.h, s.l, y0, y1, f);
  // Le voile s'approfondit à mesure qu'on descend.
  ctx.fillStyle = `rgba(0,0,0,${interpoler(cfg.voile, p).toFixed(3)})`;
  ctx.fillRect(0, y0, s.l, y1 - y0);

  // 2. La page, transparente, par-dessus. L'entrée du héros ne concerne que la première tranche.
  const ent = cfg.entree;
  const courbe = courbeBezier(...ent.courbe);
  const blocs = cfg.hero;
  s.tranches.forEach((t, rang) => {
    if (!t.img) return;
    const dyT = t.haut * kp - s.defilement;
    const dhT = t.hauteur * kp;
    if (rang !== 0 || c.entree === Infinity || blocs.length === 0) {
      tracer(ctx, t.img, dyT, dhT, s.l, y0, y1);
      return;
    }
    // La première tranche, pendant l'entrée : ce qui n'est pas un bloc du héros est là d'emblée ;
    // chaque bloc monte de `distance` pixels en apparaissant, l'un après l'autre.
    const ligne = (ya: number, yb: number, decale: number, alpha: number) => {
      // ya, yb : lignes de la page, en pixels de la capture
      const sy = ya * (LARGEUR_PAGE / LARGEUR_CAPTURE);
      const sh = (yb - ya) * (LARGEUR_PAGE / LARGEUR_CAPTURE);
      tracerLignes(ctx, t.img as HTMLImageElement, sy, sh, dyT + ya * kc + decale, (yb - ya) * kc, s.l, y0, y1, alpha);
    };
    const hautTranche = (t.hauteur * LARGEUR_CAPTURE) / LARGEUR_PAGE;
    let reprise = 0;
    for (const bloc of blocs) {
      const ya = Math.max(reprise, bloc.y0 - MARGE_BLOC);
      const yb = Math.min(hautTranche, bloc.y1 + MARGE_BLOC);
      if (ya > reprise) ligne(reprise, ya, 0, 1);
      const debut = ent.delai + bloc.rang * ent.decalage;
      const v = c.entree < 0 ? 0 : courbe(borne((c.entree - debut) / ent.duree, 0, 1));
      if (v > 0) ligne(ya, yb, (1 - v) * ent.distance * kc, v);
      reprise = yb;
    }
    if (reprise < hautTranche) ligne(reprise, hautTranche, 0, 1);
  });
}

/* --- La bande ------------------------------------------------------------- */

/**
 * Peint la bande qui couvre les lignes `y0`–`y1` de la carte. Le contexte doit
 * déjà avoir pour coordonnées celles de la carte (en pixels CSS), la ligne `y0`
 * en haut du canevas.
 */
export function peindreBande(ctx: CanvasRenderingContext2D, s: Scene, y0: number, y1: number) {
  // Les images sont réduites (la page à 600 px, la carte à 150 ou 290) : le lissage haut
  // garde le texte net. Il retombe à chaque changement de taille du canevas : on le redit.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, y0, s.l, y1 - y0);
  ctx.save();
  cheminArrondi(ctx, 0, 0, s.l, s.h, s.rayon);
  ctx.clip();
  ctx.fillStyle = s.fond;
  ctx.fillRect(0, y0, s.l, y1 - y0);
  if (s.calques) peindreCalques(ctx, s, y0, y1);
  else peindrePlat(ctx, s, y0, y1);
  ctx.restore();
  // Le filet clair du bord, comme l'anneau d'une carte.
  ctx.lineWidth = 1;
  ctx.strokeStyle = s.contour;
  cheminArrondi(ctx, 0.5, 0.5, s.l - 1, s.h - 1, s.rayon - 0.5);
  ctx.stroke();
}
