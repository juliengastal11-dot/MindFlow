"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger, mouvementReduit } from "@/lib/gsap";
import type { CacheEcran, CoinsEcran } from "@/lib/plongee-ecran";
import { creerGenie, type Boite, type Genie } from "@/lib/genie";
import { EcranMac } from "@/components/ui/ecran-mac";

/* ---------------------------------------------------------------------------
   Plongée : à la fin du ciel, on entre dans l'écran de l'ordinateur.

   Structure voulue par J : un seul plan du hero jusqu'ici (`Ciel`), dont
   l'heure change au défilement ; la lumière dorée du hero revenue à la fin
   mène au zoom dans l'ordinateur et au questionnaire. La plongée vit donc à l'intérieur de `Ciel`, après ses
   sections : son cadre se pose exactement sur celui du ciel (plein écran, même
   hauteur), qui reste en place derrière. Une suite d'images prend le relais, avancée au rythme du
   défilement : on s'approche du personnage, on passe derrière son épaule, et
   la caméra arrive sur l'écran de son ordinateur.

   Sur cet écran, un vrai bureau de Mac (`EcranMac`, J, 2026-10-17 : « tout ça
   dans l'ordinateur directement : un écran de Mac dessiné sur le Mac, et un
   effet Génie incroyable et naturel ») : le fond d'écran au logo, la barre des
   menus, le Dock, et la vraie fenêtre de discussion (`fenetre`). C'est un écran
   virtuel en pixels CSS, collé image par image sur l'écran du portable, en
   perspective : la transformation envoie ses quatre coins sur ceux de l'écran,
   mesurés hors ligne (`lib/plongee-ecran`). Quand l'épaule du personnage passe
   devant l'écran, le bureau est découpé à sa limite (mesurée elle aussi) :
   l'épaule reste devant.
   Pendant que la caméra arrive, l'icône de la conversation rebondit et la
   fenêtre en sort avec l'effet Génie (`lib/genie.ts`), dans le petit écran.
   Puis la caméra entre dans la fenêtre, sans s'arrêter : le zoom part à la
   vitesse où l'écran grandissait à la fin des images, le bureau se redresse et
   grandit jusqu'à ce que la fenêtre soit à sa taille, à 1 pour 1, et la scène
   autour (le canvas) suit exactement le même mouvement. C'est la vraie fenêtre
   depuis le début : pas d'échange d'image, elle est nette et utilisable dès
   qu'elle est posée. Au bout du défilement, tout reprend sa place dans la page.

   Deux leçons tirées de la première version du film :
   - pas d'épinglage GSAP (il ajoutait des sauts sur iPhone) : `sticky`,
     géré par le navigateur lui-même ;
   - pas de `<video>` qu'on fait avancer à la main (les recherches d'image
     saccadent sur iPhone) : des images dessinées sur un canvas selon la
     position de défilement, la méthode des pages produit d'Apple.

   Raccord : le dernier passage du ciel se termine sur la première image de
   la plongée (image d'arrivée imposée à Kling). Le `raccord` la pose
   exactement comme le ciel la cadre, puis le cadrage glisse vers celui de la
   plongée. Le téléphone a sa série verticale d'origine (`mobile`), sans raccord.

   Images sans à-coups (J, 2026-10-17 : « on voit trop les images défiler les unes
   après les autres ») : deux images voisines se fondent selon la position
   exacte, comme dans `Ciel`, et le défilement est réparti d'après `rythme` (de
   combien l'image change d'une image à la suivante) au lieu d'une image tous
   les mêmes pixels.

   Déroulé du défilement, de 0 à 1 :
   - 0 à `fondu` : le canvas apparaît en fondu par-dessus le ciel ;
   - `fondu` à `finVideo` : les images défilent ; le bureau s'allume sur l'écran
     dès qu'il est assez grand pour se lire ;
   - 0,665 à 0,715 : l'icône de la conversation rebondit deux fois ;
   - 0,70 à `finVideo` : la fenêtre sort de l'icône (effet Génie), pendant que la
     caméra finit d'arriver ;
   - `finVideo` à 0,96 : la caméra entre dans la fenêtre ;
   - 0,965 à 0,995 : le bureau et la scène s'effacent vers le fond de la page,
     la fenêtre reste ; la page reprend ensuite son cours sans raccord (J,
     2026-10-17, sur iPhone : une bande noire et un triangle blanc passaient
     sous la fenêtre, la part de l'écran cachée sous la barre de Safari).

   Mouvement réduit : le hero seul, immobile ; la fenêtre posée dans la page, sans bureau.
--------------------------------------------------------------------------- */

export type SerieImages = { dossier: string; nombre: number; extension?: string };

/** Partie de l'image du hero visible dans la vidéo, en fractions (0 à 1). */
export type Cadrage = { x: number; y: number; l: number; h: number };

/** Raccord entre la dernière image du hero et la première de la plongée. */
export type Raccord = {
  /** Première image de la plongée ramenée sur le hero : agrandie de `echelle`
      autour de son centre, puis décalée de (x, y) en fractions de l'image. */
  echelle: number;
  x: number;
  y: number;
  /** Partie de l'image du hero montrée par la vidéo, ordinateur et téléphone. */
  bureau: Cadrage;
  mobile?: Cadrage;
  /** Largeur, en pixels, sous laquelle la vidéo mobile est servie (comme `VideoAdaptative`). */
  seuil?: number;
  /** Part des images pendant laquelle on glisse du cadrage du hero au cadrage de la plongée. */
  duree?: number;
};

export type PlongeeProps = {
  images: SerieImages;
  /** Point à garder au centre quand l'écran rogne l'image : au début, puis à la fin du plan. */
  focus: { debut: { x: number; y: number }; fin: { x: number; y: number } };
  /** Part du défilement consacrée au passage du hero figé à la première image. */
  fondu?: number;
  /** Fin des images ; le reste du défilement sert à plonger dans la fenêtre. */
  finVideo?: number;
  /** De combien l'image change entre deux images voisines (`nombre - 1` valeurs, mesurées par
      `outils/hero/rythme-plongee.py`). Le défilement est réparti pour que ce qui se voit avance au
      même pas ; sans lui, une image tous les mêmes pixels. */
  rythme?: readonly number[];
  /** Coins de l'écran de l'ordinateur dans chaque image (`null` : trop petit pour y poser le bureau). */
  coins?: readonly (CoinsEcran | null)[];
  /** Ce qui cache l'écran dans chaque image (l'épaule du personnage) : le bureau est découpé à sa limite. */
  caches?: readonly (CacheEcran | null)[];
  raccord?: Raccord;
  /** La version verticale d'origine, pour le téléphone (moins de 768 px) : ses images, son rythme, les coins de son écran
      et ce qui le cache, image par image. Ses images sont prises au cadre du ciel : ni raccord ni recadrage. */
  mobile?: {
    images: SerieImages;
    rythme?: readonly number[];
    coins?: readonly (CoinsEcran | null)[];
    caches?: readonly (CacheEcran | null)[];
  };
  /** Description de la scène, pour qui ne la voit pas. */
  alt: string;
  /** La fenêtre qui s'ouvre sur le Mac, à la fin de la plongée. */
  fenetre?: React.ReactNode;
  className?: string;
};

function chemin(s: SerieImages, i: number) {
  return `${s.dossier}/${String(i + 1).padStart(3, "0")}.${s.extension ?? "webp"}`;
}

/* Une transformation affine du plan, comme `matrix(a, b, c, d, e, f)` en CSS : x' = a·x + c·y + e, y' = b·x + d·y + f. */
type Matrice = [number, number, number, number, number, number];
const composer = (p: Matrice, q: Matrice): Matrice => [
  p[0] * q[0] + p[2] * q[1],
  p[1] * q[0] + p[3] * q[1],
  p[0] * q[2] + p[2] * q[3],
  p[1] * q[2] + p[3] * q[3],
  p[0] * q[4] + p[2] * q[5] + p[4],
  p[1] * q[4] + p[3] * q[5] + p[5],
];
const inverser = ([a, b, c, d, e, f]: Matrice): Matrice => {
  const det = a * d - b * c || 1e-9;
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
};
const appliquer = (m: Matrice, x: number, y: number) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]] as const;

/* Une homographie (la perspective), en 3 × 3 par rangées : x' = (m0·x + m1·y + m2) / w, y' = (m3·x + m4·y + m5) / w,
   avec w = m6·x + m7·y + m8. */
type Homographie = readonly [number, number, number, number, number, number, number, number, number];
type Point = readonly [number, number];
/** Du rectangle (0, 0)-(l, h) au quadrilatère de coins hg, hd, bg, bd (la construction de Heckbert, depuis le carré unité). */
const versQuad = (l: number, h: number, hg: Point, hd: Point, bg: Point, bd: Point): Homographie => {
  const [x0, y0] = hg;
  const [x1, y1] = hd;
  const [x2, y2] = bd;
  const [x3, y3] = bg;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const k = (dx1 * dy3 - dx3 * dy1) / den;
  return [(x1 - x0 + g * x1) / l, (x3 - x0 + k * x3) / h, x0, (y1 - y0 + g * y1) / l, (y3 - y0 + k * y3) / h, y0, g / l, k / h, 1];
};
const multiplier = (p: Homographie, q: Homographie): Homographie => [
  p[0] * q[0] + p[1] * q[3] + p[2] * q[6],
  p[0] * q[1] + p[1] * q[4] + p[2] * q[7],
  p[0] * q[2] + p[1] * q[5] + p[2] * q[8],
  p[3] * q[0] + p[4] * q[3] + p[5] * q[6],
  p[3] * q[1] + p[4] * q[4] + p[5] * q[7],
  p[3] * q[2] + p[4] * q[5] + p[5] * q[8],
  p[6] * q[0] + p[7] * q[3] + p[8] * q[6],
  p[6] * q[1] + p[7] * q[4] + p[8] * q[7],
  p[6] * q[2] + p[7] * q[5] + p[8] * q[8],
];
const inverse = ([a, b, c, d, e, f, g, h, i]: Homographie): Homographie => {
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C || 1e-12;
  return [
    A / det,
    (c * h - b * i) / det,
    (b * f - c * e) / det,
    B / det,
    (a * i - c * g) / det,
    (c * d - a * f) / det,
    C / det,
    (b * g - a * h) / det,
    (a * e - b * d) / det,
  ];
};
const projeter = (m: Homographie, x: number, y: number): Point => {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
};
const enHomographie = (m: Matrice): Homographie => [m[0], m[2], m[4], m[1], m[3], m[5], 0, 0, 1];
/** La même transformation pour CSS (`matrix3d` se lit par colonnes). */
const css3d = (m: Homographie) =>
  `matrix3d(${m[0]},${m[3]},0,${m[6]},${m[1]},${m[4]},0,${m[7]},0,0,1,0,${m[2]},${m[5]},0,${m[8]})`;

/* Les moments du déroulé, en part du défilement de la zone (voir l'en-tête). */
const SAUT = { de: 0.665, a: 0.715 };
const GENIE = { de: 0.7 };
const PLONGEE_FIN = 0.96;
const EFFACE = { de: 0.965, a: 0.995 };

/* Le bureau du Mac, en pixels CSS, construit autour de la fenêtre : la barre des menus en haut (`EcranMac`), la fenêtre à la
   taille qu'elle aura à la fin, le Dock dessous (84 px de haut, posé à 14 px du bas). */
const DOCK = 116;

export function Plongee({
  images: serieBureau,
  focus: focusBureau,
  fondu = 0.1,
  finVideo = 0.8,
  rythme: rythmeBureau,
  coins: coinsBureau,
  caches: cachesBureau,
  raccord: raccordBureau,
  mobile,
  alt,
  fenetre,
  className,
}: PlongeeProps) {
  const zone = useRef<HTMLDivElement>(null);
  const calque = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const bureau = useRef<HTMLDivElement>(null);
  const voile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = zone.current;
    const cadre = calque.current;
    const canvas = toile.current;
    const vue = bureau.current;
    if (!el || !cadre || !canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    if (mouvementReduit()) return;

    // Sur téléphone, la série verticale d'origine, quand il y en a une : son rythme, ses coins, et pas de recadrage.
    const surMobile = !!mobile && window.matchMedia("(max-width: 767px)").matches;
    const serie = surMobile ? mobile.images : serieBureau;
    const focus = surMobile ? { debut: { x: 0.5, y: 0.5 }, fin: { x: 0.5, y: 0.5 } } : focusBureau;
    const rythme = surMobile ? mobile.rythme : rythmeBureau;
    const raccord = surMobile ? undefined : raccordBureau;
    const coinsSerie = surMobile && mobile.coins ? mobile.coins : coinsBureau;
    const cachesSerie = surMobile ? mobile.caches : cachesBureau;
    const images: HTMLImageElement[] = [];
    let courante = -1;
    let avance = 0; // progression dans les images, de 0 à 1, pour le recadrage
    let plongee = 0; // plongée dans la fenêtre, de 0 à 1, selon le défilement (l'élan est appliqué au dessin)
    const borne = (x: number) => Math.min(1, Math.max(0, x));
    const douce = (x: number) => x * x * (3 - 2 * x);
    canvas.style.transformOrigin = "0 0";

    // Les coins de l'écran à l'image fractionnaire f : ceux des deux images voisines, fondus selon la fraction.
    const coinsA = (f: number): CoinsEcran | null => {
      if (!coinsSerie) return null;
      const i = Math.min(serie.nombre - 1, Math.max(0, Math.floor(f)));
      const j = Math.min(serie.nombre - 1, i + 1);
      const a = f - i;
      const p = coinsSerie[i];
      const q = coinsSerie[j];
      if (p && q && a > 0 && p.length === q.length) return p.map((v, k) => v + (q[k] - v) * a) as unknown as CoinsEcran;
      return p ?? (a > 0.5 ? q : null);
    };
    // Ce que cache l'épaule, de même ; une image sans rien de caché compte pour zéro.
    const cacheA = (f: number): readonly number[] | null => {
      if (!cachesSerie) return null;
      const i = Math.min(serie.nombre - 1, Math.max(0, Math.floor(f)));
      const j = Math.min(serie.nombre - 1, i + 1);
      const a = f - i;
      const p = cachesSerie[i];
      const q = cachesSerie[j];
      const n = (p ?? q)?.length;
      if (!n) return null;
      return Array.from({ length: n }, (_, k) => (p?.[k] ?? 0) * (1 - a) + (q?.[k] ?? 0) * a);
    };

    /* ---- Le bureau du Mac : ses mesures ---------------------------------- */

    const ecran = vue?.querySelector<HTMLElement>("[data-ecran-mac]") ?? null;
    const place = ecran?.querySelector<HTMLElement>("[data-ecran-fenetre]") ?? null;
    const icone = ecran?.querySelector<HTMLElement>("[data-dock-conversation] > span") ?? null;
    const point = ecran?.querySelector<HTMLElement>("[data-dock-point]") ?? null;
    const voileEcran = ecran?.querySelector<HTMLElement>("[data-ecran-voile]") ?? null;
    const tranches = surMobile ? 32 : 40;
    let genie: Genie | null = null;
    // L'écran virtuel (en pixels CSS) et la fenêtre dedans. La fenêtre a exactement la taille qu'elle aura à la fin, posée
    // dans la vue : la feuille d'avant (pleine largeur sous l'île du menu sur téléphone, 768 px au milieu sur ordinateur).
    const geo = { l: 1, h: 1, fenetre: { x: 0, y: 0, l: 1, h: 1 } as Boite, cible: { x: 0, y: 0, l: 1, h: 1 } as Boite };
    // La fenêtre attend d'être posée pour commencer sa conversation (`Discussion` lit cet attribut sur son parent).
    place?.setAttribute("data-fenetre-attente", "");
    const mesurer = (rapportEcran: number) => {
      if (!vue || !ecran) return;
      const lv = vue.clientWidth;
      const hv = vue.clientHeight;
      const haut = lv < 768 ? 44 : 56;
      const lf = lv < 768 ? lv : Math.min(768, lv);
      geo.cible = { x: (lv - lf) / 2, y: haut, l: lf, h: hv - haut };
      // À la fin, le haut de l'écran est au haut de la vue : la barre des menus sous l'île du menu, la fenêtre juste dessous,
      // le Dock sous le bas de la vue.
      geo.h = haut + geo.cible.h + DOCK;
      geo.l = Math.max(geo.h * rapportEcran, lf + 160);
      geo.fenetre = { x: (geo.l - lf) / 2, y: haut, l: lf, h: geo.cible.h };
      const s = ecran.style;
      s.setProperty("--ecran-l", `${geo.l}px`);
      s.setProperty("--ecran-h", `${geo.h}px`);
      s.setProperty("--fenetre-x", `${geo.fenetre.x}px`);
      s.setProperty("--fenetre-y", `${geo.fenetre.y}px`);
      s.setProperty("--fenetre-l", `${geo.fenetre.l}px`);
      s.setProperty("--fenetre-h", `${geo.fenetre.h}px`);
      // La fenêtre change de taille : le Génie se refait sur la nouvelle.
      genie?.detruire();
      genie = null;
    };
    // Le format de l'écran du portable, lu dans la dernière image (largeur sur hauteur, en pixels de l'image).
    let rapportEcran = 1.6;
    const lireRapport = (img: HTMLImageElement) => {
      const q = coinsSerie?.[serie.nombre - 1];
      if (!q) return;
      const ux = (q[2] - q[0]) * img.naturalWidth;
      const uy = (q[3] - q[1]) * img.naturalHeight;
      const vx = (q[4] - q[0]) * img.naturalWidth;
      const vy = (q[5] - q[1]) * img.naturalHeight;
      rapportEcran = Math.hypot(ux, uy) / Math.hypot(vx, vy);
      mesurer(rapportEcran);
    };
    mesurer(rapportEcran);

    // La place d'un élément du bureau, dans le repère de l'écran virtuel (sans sa transformation).
    const dansEcran = (n: HTMLElement): Boite => {
      let x = 0;
      let y = 0;
      let e: HTMLElement | null = n;
      while (e && e !== ecran) {
        x += e.offsetLeft;
        y += e.offsetTop;
        e = e.offsetParent as HTMLElement | null;
      }
      return { x, y, l: n.offsetWidth, h: n.offsetHeight };
    };

    // Le bureau déborde un peu de la zone blanche mesurée, qui s'arrête juste avant le bord de l'écran, et que deux images
    // fondues l'une dans l'autre élargissent d'un fantôme : sans cela, un liseré blanc l'entoure. Le cadre noir de l'écran
    // est plus large que ce débord.
    const MARGE = 0.025;
    // De même, la découpe de l'épaule mord un peu sur elle : le passage de l'épaule à l'écran blanc (et son fantôme d'une
    // image à l'autre) reste sous le bureau.
    const MORSURE = 0.006;
    // À la fin, la fenêtre à sa place dans la vue, à 1 pour 1.
    const finale = (): Matrice => [1, 0, 0, 1, geo.cible.x - geo.fenetre.x, geo.cible.y - geo.fenetre.y];
    // Entre les deux : l'échelle grandit en proportion (comme un zoom), l'écran se redresse, et le centre de la fenêtre va
    // vers sa place à mesure que l'échelle grandit.
    const entre = (m0: Matrice, m1: Matrice, t: number): Matrice => {
      if (t <= 0) return m0;
      if (t >= 1) return m1;
      const s0 = Math.sqrt(Math.abs(m0[0] * m0[3] - m0[1] * m0[2]));
      const s1 = Math.sqrt(Math.abs(m1[0] * m1[3] - m1[1] * m1[2]));
      const s = s0 * Math.pow(s1 / s0, t);
      const lin = [0, 1, 2, 3].map((k) => (m0[k] / s0) * (1 - t) + (m1[k] / s1) * t);
      const cx = geo.fenetre.x + geo.fenetre.l / 2;
      const cy = geo.fenetre.y + geo.fenetre.h / 2;
      const [x0, y0] = appliquer(m0, cx, cy);
      const [x1, y1] = appliquer(m1, cx, cy);
      const k = (s - s0) / (s1 - s0 || 1);
      const px = x0 + (x1 - x0) * k;
      const py = y0 + (y1 - y0) * k;
      const a = lin[0] * s;
      const b = lin[1] * s;
      const c = lin[2] * s;
      const d = lin[3] * s;
      return [a, b, c, d, px - (a * cx + c * cy), py - (b * cx + d * cy)];
    };
    // Le bureau découpé là où l'épaule passe devant l'écran : le polygone de ce qui reste visible, dans le repère du bureau.
    // Les rangées mesurées vont de v = 0,01 à 0,99 de la zone blanche ; le bureau la déborde de MARGE de chaque côté.
    const decoupe = (c: readonly number[] | null) => {
      if (!c || !c.some((u) => u > 0)) return "none";
      const n = c.length;
      const k = 1 + 2 * MARGE;
      const rangee = (i: number) => 0.01 + (0.98 * i) / (n - 1);
      const X = (u: number) => (u > 0 ? (Math.max(0, u - MORSURE + MARGE) / k) * geo.l : 0);
      const Y = (v: number) => ((v + MARGE) / k) * geo.h;
      // prolongée jusqu'au bas du bureau, dans la direction des deux dernières rangées
      const pente = (c[n - 1] - c[n - 2]) / (rangee(n - 1) - rangee(n - 2));
      const bas = c[n - 1] > 0 ? Math.max(0, c[n - 1] + pente * (1 + MARGE - rangee(n - 1))) : 0;
      const points = [`0px 0px`, `${geo.l}px 0px`, `${geo.l}px ${geo.h}px`, `${X(bas)}px ${geo.h}px`];
      for (let i = n - 1; i >= 0; i--) points.push(`${X(c[i])}px ${Y(rangee(i))}px`);
      return `polygon(${points.join(",")})`;
    };

    /* ---- Le dessin --------------------------------------------------------- */

    // Du défilement (0 à 1 sur les images) à l'image, fractionnaire : à pas égal de ce qui se voit.
    const nombre = serie.nombre;
    const cumul: number[] = [0];
    for (let k = 0; k < nombre - 1; k++) cumul.push(cumul[k] + Math.pow(Math.max(0.5, rythme?.[k] ?? 1), 0.9));
    const total = cumul[nombre - 1];
    const rang = (pv: number) => {
      if (!rythme) return pv * (nombre - 1);
      const c = pv * total;
      let bas = 0;
      let haut = nombre - 1;
      while (haut - bas > 1) {
        const milieu = (bas + haut) >> 1;
        if (cumul[milieu] <= c) bas = milieu;
        else haut = milieu;
      }
      return bas + (c - cumul[bas]) / (cumul[haut] - cumul[bas]);
    };
    const prete = (k: number) => !!images[k]?.complete && images[k].naturalWidth > 0;

    // L'élan de la plongée : elle part à la vitesse où l'écran grandissait à la fin des images (pas d'arrêt entre le vol et le
    // zoom), accélère sans à-coup, puis se pose. `a` est la vitesse de départ, en part de la vitesse moyenne :
    // e(t) = a·t + (10 − 6a)·t³ + (8a − 15)·t⁴ + (6 − 3a)·t⁵, soit e(0) = 0, e'(0) = a, e''(0) = 0, e(1) = 1, e'(1) = e''(1) = 0
    // (avec a = 0, la courbe douce habituelle).
    let vitesseFin = -1; // la croissance de l'écran à la fin des images, en logarithme de sa largeur par unité de défilement
    const lireVitesse = (dw: number, dh: number) => {
      const avant = finVideo - 0.02;
      const a = coinsA(rang((avant - fondu) / (finVideo - fondu)));
      const b = coinsA(nombre - 1);
      if (!a || !b) return 0;
      const largeur = (q: CoinsEcran) => Math.hypot((q[2] - q[0]) * dw, (q[3] - q[1]) * dh);
      return Math.max(0, Math.log(largeur(b) / largeur(a)) / 0.02);
    };
    const elan = (t: number, s0: number) => {
      const zoom = Math.log(1 / Math.max(1e-3, s0));
      const a = zoom > 0.05 ? Math.min(2, (vitesseFin * (PLONGEE_FIN - finVideo)) / zoom) : 0;
      return a * t + (10 - 6 * a) * t ** 3 + (8 * a - 15) * t ** 4 + (6 - 3 * a) * t ** 5;
    };

    // Dessine l'image f (fractionnaire : la suivante, en fondu) en « cover » dans le canvas, et pose le bureau sur son écran.
    const dessiner = (f: number) => {
      f = Math.min(nombre - 1, Math.max(0, f));
      const base = Math.floor(f);
      // Si l'image voulue n'est pas encore là, on garde la plus proche déjà chargée.
      let i = base;
      while (i > 0 && !prete(i)) i--;
      if (!prete(i)) return;
      const j = Math.min(nombre - 1, base + 1);
      const melange = i === base && j !== i && prete(j) ? f - base : 0;
      const img = images[i];
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const echelle = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * echelle;
      const dh = img.naturalHeight * echelle;
      // Recadrage qui suit l'action : le point de focus glisse du personnage
      // à l'écran ; on le garde au centre autant que les bords le permettent.
      const fx = focus.debut.x + (focus.fin.x - focus.debut.x) * avance;
      const fy = focus.debut.y + (focus.fin.y - focus.debut.y) * avance;
      let dx = Math.min(0, Math.max(w - dw, w / 2 - fx * dw));
      let dy = Math.min(0, Math.max(h - dh, h / 2 - fy * dh));
      let dw2 = dw;
      let dh2 = dh;
      // Au départ, la première image est posée exactement où la vidéo figée
      // montrait la même scène, puis glisse vers le cadrage de la plongée.
      if (raccord) {
        const r = window.matchMedia(`(max-width: ${(raccord.seuil ?? 768) - 1}px)`).matches && raccord.mobile
          ? raccord.mobile
          : raccord.bureau;
        const k = Math.max(w / (r.l * img.naturalWidth), h / (r.h * img.naturalHeight));
        const HW = img.naturalWidth * k;
        const HH = img.naturalHeight * k;
        const X0 = w / 2 - (r.x + r.l / 2) * HW;
        const Y0 = h / 2 - (r.y + r.h / 2) * HH;
        const e = raccord.echelle;
        const rx = X0 + (0.5 - 0.5 * e + raccord.x) * HW;
        const ry = Y0 + (0.5 - 0.5 * e + raccord.y) * HH;
        const t = Math.min(1, avance / (raccord.duree ?? 0.25));
        const m = 1 - t * t * (3 - 2 * t); // poids du cadrage du hero
        dx += (rx - dx) * m;
        dy += (ry - dy) * m;
        dw2 += (HW * e - dw) * m;
        dh2 += (HH * e - dh) * m;
      }

      // Le bureau sur l'écran, en perspective, à ses quatre coins (un peu au-delà de la zone blanche mesurée) ; puis, en
      // plongeant, redressé et agrandi jusqu'à la fenêtre à sa place. Le canvas suit exactement le même mouvement :
      // l'ordinateur, la scène et l'écran restent ensemble.
      const q = coinsA(f);
      let bureauCss = "";
      let toileCss = "";
      let image: Matrice = [1, 0, 0, 1, 0, 0];
      let largeur = 0;
      if (q && ecran) {
        const pt = (x: number, y: number): Point => [dx + x * dw2, dy + y * dh2];
        const hg = pt(q[0], q[1]);
        const hd = pt(q[2], q[3]);
        const bg = pt(q[4], q[5]);
        const bd: Point = q.length === 8 ? pt(q[6], q[7]) : [hd[0] + bg[0] - hg[0], hd[1] + bg[1] - hg[1]];
        const mesure = versQuad(1, 1, hg, hd, bg, bd);
        const c = [
          projeter(mesure, -MARGE, -MARGE),
          projeter(mesure, 1 + MARGE, -MARGE),
          projeter(mesure, -MARGE, 1 + MARGE),
          projeter(mesure, 1 + MARGE, 1 + MARGE),
        ] as const;
        largeur = Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]);
        if (plongee <= 0) {
          bureauCss = css3d(versQuad(geo.l, geo.h, c[0], c[1], c[2], c[3]));
        } else {
          // La part affine du collage (trois coins) va vers la fenêtre à sa place, à la façon d'un zoom ; le quatrième coin,
          // celui de la perspective, rejoint le rectangle au même pas. Le canvas dessine la part affine (nette, depuis
          // l'image en pleine taille) ; la perspective qui reste lui est donnée par une transformation CSS, proche de
          // l'identité.
          if (vitesseFin < 0) vitesseFin = lireVitesse(dw2, dh2);
          const colle: Matrice = [
            (c[1][0] - c[0][0]) / geo.l,
            (c[1][1] - c[0][1]) / geo.l,
            (c[2][0] - c[0][0]) / geo.h,
            (c[2][1] - c[0][1]) / geo.h,
            c[0][0],
            c[0][1],
          ];
          const t = elan(plongee, Math.sqrt(Math.abs(colle[0] * colle[3] - colle[1] * colle[2])));
          const vers = entre(colle, finale(), t);
          image = composer(vers, inverser(colle));
          const [bx, by] = appliquer(inverser(colle), c[3][0], c[3][1]);
          const coin = (u: number) =>
            versQuad(geo.l, geo.h, [0, 0], [geo.l, 0], [0, geo.h], [bx + (geo.l - bx) * u, by + (geo.h - by) * u]);
          const reste = coin(t);
          const V = enHomographie(vers);
          bureauCss = plongee >= 1 ? `matrix(${vers.join(",")})` : css3d(multiplier(V, reste));
          toileCss = css3d(multiplier(multiplier(V, multiplier(reste, inverse(coin(0)))), enHomographie(inverser(vers))));
          largeur = Math.hypot(vers[0], vers[1]) * geo.l;
        }
      }
      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      ctx2d.setTransform(dpr * image[0], dpr * image[1], dpr * image[2], dpr * image[3], dpr * image[4], dpr * image[5]);
      ctx2d.imageSmoothingQuality = "high";
      ctx2d.globalAlpha = 1;
      ctx2d.drawImage(img, dx, dy, dw2, dh2);
      if (melange > 0.004) {
        ctx2d.globalAlpha = melange;
        ctx2d.drawImage(images[j], dx, dy, dw2, dh2);
        ctx2d.globalAlpha = 1;
      }
      canvas.style.transform = toileCss;
      if (ecran) {
        if (q) {
          // Sous quelques pixels, l'écran n'est qu'une tache : le bureau s'allume avec la taille.
          ecran.style.transform = bureauCss;
          ecran.style.opacity = String(borne((largeur - 30) / 50));
          ecran.style.visibility = largeur > 30 ? "visible" : "hidden";
          ecran.style.clipPath = plongee > 0 ? "none" : decoupe(cacheA(f));
        } else {
          ecran.style.visibility = "hidden";
        }
      }
      courante = f;
    };

    /* ---- Le Génie et le rebond, au défilement ------------------------------ */

    const poserFenetre = (p: number) => {
      if (!ecran || !place || !icone) return;
      // L'icône rebondit deux fois, comme une appli qui se lance (sur un Mac, presque de sa hauteur).
      const u = borne((p - SAUT.de) / (SAUT.a - SAUT.de));
      gsap.set(icone, { y: -0.8 * icone.offsetHeight * Math.abs(Math.sin(2 * Math.PI * u)) * (1 - 0.35 * u) });
      if (point) gsap.set(point, { opacity: p >= SAUT.de + 0.01 ? 1 : 0 });
      const g = douce(borne((p - GENIE.de) / (finVideo - GENIE.de)));
      // Les copies de la fenêtre sont faites un peu avant l'effet et gardées un peu après : les faire au moment où il
      // commence coûtait une image saccadée sur iPhone.
      if (p > SAUT.de - 0.04 && p < finVideo + 0.04) {
        genie ??= creerGenie(place, ecran, tranches);
        genie.poser(g, geo.fenetre, dansEcran(icone));
      } else if (genie) {
        genie.detruire();
        genie = null;
      }
      gsap.set(place, { autoAlpha: g >= 1 ? 1 : 0 });
      // Posée à 1 pour 1 : elle devient utilisable, et sa conversation peut commencer.
      const posee = plongee >= 1;
      place.style.pointerEvents = posee ? "auto" : "none";
      if (posee) place.removeAttribute("data-fenetre-attente");
    };

    // Chargement à l'approche : toute la série, la première image dessinée dès qu'elle arrive.
    const charger = () => {
      for (let i = 0; i < serie.nombre; i++) {
        const img = new Image();
        img.decoding = "async";
        img.src = chemin(serie, i);
        images[i] = img;
        if (i === 0) img.onload = () => courante < 0 && dessiner(0);
        if (i === serie.nombre - 1) img.onload = () => lireRapport(img);
      }
    };
    let charge = false;
    const obs = new IntersectionObserver(
      (entrees) => {
        if (!charge && entrees.some((e) => e.isIntersecting)) {
          charge = true;
          charger();
          obs.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    obs.observe(el);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        // Le canvas apparaît par-dessus le ciel.
        const pf = Math.min(1, p / fondu);
        gsap.set(cadre, { autoAlpha: pf * pf * (3 - 2 * pf) });
        const pv = Math.min(1, Math.max(0, (p - fondu) / (finVideo - fondu)));
        plongee = borne((p - finVideo) / (PLONGEE_FIN - finVideo));
        avance = pv;
        dessiner(rang(pv));
        poserFenetre(p);
        // La fenêtre posée, le bureau et la scène s'effacent vers le fond de la page.
        const efface = douce(borne((p - EFFACE.de) / (EFFACE.a - EFFACE.de)));
        if (voile.current) gsap.set(voile.current, { autoAlpha: efface });
        if (voileEcran) voileEcran.style.opacity = String(efface);
      },
    });

    const redessiner = () => {
      mesurer(rapportEcran);
      if (courante >= 0) dessiner(courante);
    };
    window.addEventListener("resize", redessiner);
    return () => {
      genie?.detruire();
      st.kill();
      obs.disconnect();
      window.removeEventListener("resize", redessiner);
    };
  }, [serieBureau, focusBureau, fondu, finVideo, rythmeBureau, coinsBureau, cachesBureau, raccordBureau, mobile]);

  return (
    <div
      ref={zone}
      data-src="components/ui/plongee.tsx"
      className={cn("nuit relative h-[380svh] motion-reduce:h-auto", className)}
    >
      {/* `data-plongee-colle` : là où se pose ce qui reste collé au plan quand la plongée commence (le bouton tombé près de l'ordinateur). */}
      <div data-plongee-colle="" className="sticky top-0 h-lvh motion-reduce:static motion-reduce:h-auto">
        {/* La plongée, posée exactement sur le cadre du hero : plein écran, même hauteur (`lvh`). */}
        <div
          ref={calque}
          className="pointer-events-none invisible absolute inset-0 overflow-hidden bg-background opacity-0 motion-reduce:hidden"
        >
          <canvas ref={toile} role="img" aria-label={alt} className="absolute inset-0 h-full w-full" />
        </div>
        {/* À la toute fin, le fond de la page recouvre la scène : sur iPhone, la bande entre la hauteur visible et la hauteur
            pleine de l'écran (sous la barre de Safari) passe sous la fenêtre quand la page reprend son cours. */}
        <div ref={voile} aria-hidden="true" className="pointer-events-none invisible absolute inset-0 bg-lin opacity-0 motion-reduce:hidden" />
        {/* Le bureau du Mac, collé sur l'écran de l'ordinateur, avec la fenêtre dedans. La zone a la hauteur de ce qu'on voit
            (`dvh`) et non celle du plan (`lvh`) : sur iPhone, le pied de la fenêtre (le champ de saisie) passerait sous la
            barre de Safari. Mouvement réduit : la fenêtre est posée sous le hero, dans le cours de la page, sans bureau. */}
        {fenetre && (
          <div
            ref={bureau}
            className="pointer-events-none absolute inset-x-0 top-0 h-dvh overflow-hidden motion-reduce:pointer-events-auto motion-reduce:relative motion-reduce:inset-auto motion-reduce:mx-2 motion-reduce:h-[85svh] motion-reduce:overflow-visible sm:motion-reduce:mx-3"
          >
            <EcranMac>{fenetre}</EcranMac>
          </div>
        )}
      </div>
    </div>
  );
}
