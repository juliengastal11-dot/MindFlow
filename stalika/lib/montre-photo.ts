import { BOITES_PIECES, BOITES_PHOTOS, type Boite } from "@/lib/montre-photo-boites";

/* ---------------------------------------------------------------------------
   La montre en photo qui se fabrique (essai, 2026-10-19 ; J : « du réalisme, avec
   les vraies pièces », puis, sans payer : ses trois images ChatGPT, dans
   outils/montre). Une vue éclatée verticale, découpée pièce par pièce
   (public/montre/pieces), et deux photos de la montre assemblée, de face et de
   dos (public/montre).

   Tout se mesure dans le repère de la vue éclatée : ses pixels d'origine
   (941 × 1672). Les pièces y sont enfilées sur un axe vertical, x = 463 ; la
   carrure (le boîtier) ne bouge pas, tout vient se poser sur elle.

   Les pièces de la vue éclatée ne sont pas toutes vues sous le même angle (le
   cadran et le mouvement plus de face, la carrure plus de biais) : chacune
   prend, en glissant, l'échelle qui la fait entrer dans la carrure. Les
   ellipses ont été relevées à la main (outils/montre/ellipses.json).
--------------------------------------------------------------------------- */

export type IdPiece = keyof typeof BOITES_PIECES;

/** La carrure : le dessus de la lunette de boîte (bord extérieur), et son ouverture (bord intérieur). */
export const CARRURE = { cx: 462, cy: 1057, a: 182, b: 70 } as const;
export const OUVERTURE = { cx: 461, cy: 1058, a: 161, b: 59 } as const;
export const AXE_X = 463;
export const ECLATE = { l: 941, h: 1672 } as const;

export type PiecePhoto = {
  id: IdPiece;
  /** L'étape du processus où elle se pose (1 à 6), et sa fenêtre dans l'étape (fractions de l'étape). */
  etape: number;
  de: number;
  a: number;
  /** Le point de la pièce qui va au point d'arrivée, et l'échelle à l'arrivée (x, y). */
  origine: readonly [number, number];
  arrivee: readonly [number, number];
  echelle?: readonly [number, number];
  /** L'ordre d'empilement (du fond vers le devant). */
  couche: number;
  /** Elle entre dans la carrure : cachée par le bord de devant de l'ouverture. */
  dedans?: boolean;
};

/* L'ordre du montage, sur les sept étapes du texte :
   1. le premier message : le mouvement, le cœur, descend dans la carrure ;
   2. on en parle : le fond la ferme par-dessous, la couronne entre de côté ;
   3. la première ébauche : le cadran, le visage de la montre ;
   4. vous relisez : les aiguilles ;
   5. tout est vérifié : le verre et la lunette, qui la scellent ;
   6. la mise en ligne : les bracelets ; la montre se redresse face à nous ;
   7. et après : elle se retourne sur son fond saphir, le mouvement qu'on a vu poser. */
export const PIECES_PHOTO: readonly PiecePhoto[] = [
  { id: "mouvement", etape: 1, de: 0.12, a: 0.72, origine: [466, 840], arrivee: [461, 1078], echelle: [0.929, 0.527], couche: 4, dedans: true },
  { id: "fond", etape: 2, de: 0.1, a: 0.58, origine: [463, 1296], arrivee: [462, 1142], echelle: [1.03, 0.89], couche: 1 },
  { id: "couronne", etape: 2, de: 0.36, a: 0.8, origine: [735, 1088], arrivee: [666, 1086], couche: 2 },
  { id: "cadran", etape: 3, de: 0.12, a: 0.72, origine: [466, 614], arrivee: [461, 1064], echelle: [0.882, 0.538], couche: 5, dedans: true },
  { id: "aiguilles", etape: 4, de: 0.1, a: 0.6, origine: [463, 445], arrivee: [460, 1061], echelle: [0.882, 0.538], couche: 6 },
  { id: "petite-seconde", etape: 4, de: 0.3, a: 0.76, origine: [463, 493], arrivee: [460, 1092], echelle: [0.882, 0.538], couche: 6 },
  { id: "verre", etape: 5, de: 0.1, a: 0.58, origine: [463, 338], arrivee: [462, 1046], echelle: [0.98, 1.04], couche: 7 },
  { id: "lunette", etape: 5, de: 0.3, a: 0.8, origine: [464, 212], arrivee: [462, 1049], echelle: [1.1375, 1.13], couche: 8 },
  { id: "bracelet-haut", etape: 6, de: 0.06, a: 0.42, origine: [466, 136], arrivee: [462, 1004], couche: 2 },
  { id: "barrette-haut", etape: 6, de: 0.06, a: 0.42, origine: [466, 136], arrivee: [462, 1004], couche: 2 },
  { id: "barrette-bas", etape: 6, de: 0.06, a: 0.42, origine: [465, 1402], arrivee: [462, 1196], couche: 2 },
  { id: "bracelet-bas", etape: 6, de: 0.06, a: 0.42, origine: [465, 1402], arrivee: [462, 1196], couche: 2 },
];

/** Où poser une image de pièce dans l'éclaté : sa boîte. */
export const boitePiece = (id: IdPiece): Boite => BOITES_PIECES[id];

/* Les photos de la montre assemblée, calées sur la carrure : le centre du boîtier de chaque photo (mesuré) va au centre
   de la carrure, à l'échelle où son rayon (mesuré) devient celui de la carrure. */
const calerPhoto = (b: Boite, cx: number, cy: number, rayon: number) => {
  const s = CARRURE.a / rayon;
  return {
    x: CARRURE.cx + (b.x - cx) * s,
    y: CARRURE.cy + (b.y - cy) * s,
    l: b.l * s,
    h: b.h * s,
    // le centre du boîtier, dans l'image posée (pour la tourner autour de lui)
    ox: (cx - b.x) * s,
    oy: (cy - b.y) * s,
  };
};
export const PHOTO_FACE = calerPhoto(BOITES_PHOTOS.face, 464, 708, 330);
export const PHOTO_DOS = calerPhoto(BOITES_PHOTOS.dos, 469, 708, 343);
/** La montre finie, de trois quarts (la lunette : centre 461, 652, demi-axes 342 × 232) : on y voit son épaisseur. */
export const PHOTO_TROIS_QUARTS = calerPhoto(BOITES_PHOTOS["trois-quarts"], 461, 652, 342);

const degres = (r: number) => (r * 180) / Math.PI;
/** L'inclinaison de la photo de trois quarts (sa lunette : b / a ≈ 0,68), en degrés depuis la vue de face. */
export const INCLINAISON = degres(Math.acos(232 / 342));
/* La vue éclatée est plus rasante (la carrure : b / a ≈ 0,38) : la photo de trois quarts part donc couchée d'autant
   (rotateX), puis se relève jusqu'à sa vue à elle, quand elle prend le relais de la pile. */
export const BASCULE = degres(Math.acos(CARRURE.b / CARRURE.a / Math.cos((INCLINAISON * Math.PI) / 180)));

/* La montre qui se retourne a une épaisseur (J, 2026-10-19 : « la montre est toute plate dans tes vidéos ») : les photos
   de face et de dos en sont les deux faces, écartées de son épaisseur, et une tranche d'or les relie, faite de bandes
   posées en cercle, chacune éclairée selon son orientation (components/ui/montre-photo.tsx). Le dégradé de la tranche
   (`.photo-bande`, app/globals.css) est relevé sur le flanc du boîtier de la photo de trois quarts. */
export const TRANCHE = { epaisseur: 58, rayon: 178, bandes: 48 } as const;

/* Les plans de la caméra : à chaque instant (fraction de la chronologie), la hauteur d'éclaté à montrer (h), la largeur à
   faire tenir (l), le point de l'éclaté (fy, sur l'axe) qui se pose au point d'ancrage de l'écran (ax, ay, fractions).
   Entre deux plans, la caméra glisse en douceur. */
export type Plan = { t: number; h: number; l: number; fy: number; ay: number };
export type Cadrage = { ax: number; largeurUtile: number; plans: Plan[] };

const S = 1 / 8;
const d = (k: number) => k * S;

export const CADRAGES: { bureau: Cadrage; mobile: Cadrage } = {
  bureau: {
    ax: 0.69,
    largeurUtile: 0.58,
    plans: [
      { t: 0, h: 1720, l: 560, fy: 834, ay: 0.5 },
      { t: d(1) + S * 0.05, h: 1720, l: 560, fy: 834, ay: 0.5 },
      { t: d(1) + S * 0.8, h: 1320, l: 560, fy: 1036, ay: 0.5 },
      // puis la caméra s'approche à peine, de pièce en pièce
      { t: d(6) + S * 0.4, h: 1140, l: 560, fy: 1046, ay: 0.5 },
      { t: d(6) + S * 0.95, h: 700, l: 470, fy: 1060, ay: 0.5 },
      { t: d(7) + S * 0.3, h: 760, l: 500, fy: 1057, ay: 0.5 },
      { t: 1, h: 720, l: 470, fy: 1057, ay: 0.5 },
    ],
  },
  mobile: {
    ax: 0.5,
    largeurUtile: 0.92,
    plans: [
      { t: 0, h: 1720, l: 560, fy: 834, ay: 0.5 },
      { t: d(1) + S * 0.05, h: 1720, l: 560, fy: 834, ay: 0.5 },
      { t: d(1) + S * 0.8, h: 1320, l: 560, fy: 1057, ay: 0.37 },
      { t: d(6) + S * 0.4, h: 1200, l: 520, fy: 1057, ay: 0.37 },
      { t: d(6) + S * 0.95, h: 740, l: 470, fy: 1060, ay: 0.31 },
      { t: d(7) + S * 0.3, h: 800, l: 500, fy: 1057, ay: 0.31 },
      { t: 1, h: 760, l: 470, fy: 1057, ay: 0.31 },
    ],
  },
};

/** Les fenêtres des mouvements d'ensemble (fractions de la chronologie). */
export const TEMPS = {
  // l'arrivée : les pièces se rangent sur le fil
  arrivee: { de: 0, a: d(0) + S * 0.8 },
  // la montre complète se relève, la photo de trois quarts prend le relais de la pile
  bascule: { de: d(6) + S * 0.44, a: d(6) + S * 0.86 },
  // la lumière glisse sur l'or de la montre finie
  reflet: { de: d(6) + S * 0.7, a: d(7) + S * 0.02 },
  // le fil d'or s'efface quand la montre est montée
  fil: { de: d(6) + S * 0.32, a: d(6) + S * 0.6 },
  // elle se retourne sur son fond : la montre en volume prend le relais de la photo, se retourne, se pose
  relais: { de: d(7) + S * 0.02, a: d(7) + S * 0.12 },
  retournement: { de: d(7) + S * 0.04, a: d(7) + S * 0.56 },
} as const;

export const finEtape = (piece: PiecePhoto) => d(piece.etape) + S * piece.a;
export const debutEtape = (piece: PiecePhoto) => d(piece.etape) + S * piece.de;
