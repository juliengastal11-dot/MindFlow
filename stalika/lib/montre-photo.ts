import { BOITES_PIECES, BOITES_PHOTOS, type Boite } from "@/lib/montre-photo-boites";

/* ---------------------------------------------------------------------------
   La montre en photo qui se fabrique (2026-10-19 ; J : « du réalisme, avec les
   vraies pièces », puis, sans payer : ses images ChatGPT, dans outils/montre).
   Une vue éclatée verticale, découpée pièce par pièce (public/montre/pieces),
   et une photo de la montre finie, de trois quarts (public/montre).

   Tout se mesure dans le repère de la vue éclatée : ses pixels d'origine
   (941 × 1672). Les pièces y sont enfilées sur un axe vertical, x = 463 ; la
   carrure (le boîtier) ne bouge pas, tout vient se poser sur elle.

   Les pièces de la vue éclatée ne sont pas toutes vues sous le même angle (le
   cadran et le mouvement plus de face, la carrure plus de biais) : chacune
   prend, en glissant, l'échelle qui la fait entrer dans la carrure. Les
   ellipses ont été relevées à la main (outils/montre/ellipses.json).

   La montre finie se relève jusqu'à la photo de trois quarts (la quatrième
   image de J) par un morphing (lib/montre-photo-releve.ts) : la pile, telle
   qu'elle est à l'écran, se déforme vers la photo pendant que l'une passe à
   l'autre, les mêmes détails aux mêmes places, sans fondu visible (J : « c'est
   vraiment la montre qui se relève »).
--------------------------------------------------------------------------- */

export type IdPiece = keyof typeof BOITES_PIECES;

/** La carrure : le dessus de sa lunette (bord extérieur), et son ouverture (bord intérieur), vus de biais (b / a ≈ 0,46). */
export const CARRURE = { cx: 462, cy: 1070, a: 182, b: 83 } as const;
export const OUVERTURE = { cx: 461, cy: 1074, a: 161, b: 74 } as const;
/* Le bord de devant de l'ouverture, ce qui cache le bas de ce qui entre dans la carrure : la moitié basse de l'ouverture,
   relevée près des côtés là où le trou de la pièce (son alpha) se referme plus tôt. De gauche à droite, (x, y). */
export const BORD_DEVANT: readonly (readonly [number, number])[] = [[300, 1074.0], [306, 1094.0], [312, 1102.0], [318, 1108.0], [324, 1112.9], [330, 1107], [336, 1114], [342, 1119], [348, 1122], [354, 1126], [360, 1130], [366, 1132], [372, 1134], [378, 1136], [384, 1138], [390, 1139], [396, 1141], [402, 1142], [408, 1143.9], [414, 1144.8], [420, 1145], [426, 1146], [432, 1146.8], [438, 1147], [444, 1147.6], [450, 1147.8], [456, 1148.0], [462, 1148.0], [468, 1147.9], [474, 1147.8], [480, 1147.5], [486, 1147], [492, 1146], [498, 1146], [504, 1145], [510, 1144], [516, 1143], [522, 1142], [528, 1140], [534, 1139], [540, 1137], [546, 1135], [552, 1133], [558, 1131], [564, 1128], [570, 1125], [576, 1122], [582, 1117], [588, 1112], [594, 1107], [600, 1098], [606, 1106.2], [612, 1099.7], [618, 1090.4], [624, 1074.0], [624, 1074.0]];
/* Le haut du trou de la carrure (son alpha), aux mêmes abscisses : le bas de la paroi intérieure du fond de la carrure. Ce
   qui entre dans la carrure n'en montre que le dessous d'une ligne tirée entre le haut de cette paroi (l'ouverture) et son
   bas, selon sa profondeur (components/ui/montre-photo.tsx) : enfoncé, il laisse voir la paroi au-dessus de lui. */
export const HAUT_TROU: readonly (readonly [number, number])[] = [[300, 1074.0], [306, 1094.0], [312, 1102.0], [318, 1108.0], [324, 1112.9], [330, 1077.0], [336, 1071.0], [342, 1066.0], [348, 1062.0], [354, 1059.0], [360, 1055.0], [366, 1053.0], [372, 1050.0], [378, 1048.0], [384, 1046.0], [390, 1044.0], [396, 1043.0], [402, 1041.0], [408, 1040.0], [414, 1039.0], [420, 1038.0], [426, 1037.0], [432, 1037.0], [438, 1036.0], [444, 1036.0], [450, 1035.0], [456, 1035.0], [462, 1035.0], [468, 1035.0], [474, 1035.0], [480, 1036.0], [486, 1036.0], [492, 1037.0], [498, 1037.0], [504, 1038.0], [510, 1039.0], [516, 1040.0], [522, 1042.0], [528, 1043.0], [534, 1045.0], [540, 1047.0], [546, 1049.0], [552, 1051.0], [558, 1054.0], [564, 1057.0], [570, 1060.0], [576, 1064.0], [582, 1070.0], [588, 1074.0], [594, 1080.0], [600, 1090.0], [606, 1106.2], [612, 1099.7], [618, 1090.4], [624, 1074.0], [624, 1074.0]];
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
   6. la mise en ligne : les bracelets ; la montre finie se relève ;
   7. et après : la caméra s'approche d'elle, à peine (J : « le retournement ne sert à rien finalement »). */
export const PIECES_PHOTO: readonly PiecePhoto[] = [
  { id: "mouvement", etape: 1, de: 0.12, a: 0.72, origine: [466, 840], arrivee: [461, 1092], echelle: [0.93, 0.82], couche: 4, dedans: true },
  { id: "fond", etape: 2, de: 0.1, a: 0.58, origine: [463, 1296], arrivee: [462, 1150], echelle: [1.03, 1.05], couche: 1 },
  { id: "couronne", etape: 2, de: 0.36, a: 0.8, origine: [735, 1088], arrivee: [666, 1086], couche: 2 },
  { id: "cadran", etape: 3, de: 0.12, a: 0.72, origine: [466, 614], arrivee: [461, 1077], echelle: [0.904, 0.698], couche: 5, dedans: true },
  { id: "aiguilles", etape: 4, de: 0.1, a: 0.6, origine: [463, 445], arrivee: [460, 1075], echelle: [0.904, 0.698], couche: 6 },
  { id: "petite-seconde", etape: 4, de: 0.3, a: 0.76, origine: [463, 493], arrivee: [460, 1114], echelle: [0.904, 0.698], couche: 6 },
  { id: "verre", etape: 5, de: 0.1, a: 0.58, origine: [463, 338], arrivee: [462, 1063], echelle: [0.988, 1.259], couche: 7 },
  { id: "lunette", etape: 5, de: 0.3, a: 0.8, origine: [464, 212], arrivee: [462, 1066], echelle: [1.1375, 1.339], couche: 8 },
  { id: "bracelet-haut", etape: 6, de: 0.06, a: 0.42, origine: [466, 136], arrivee: [462, 1004], couche: 2 },
  { id: "barrette-haut", etape: 6, de: 0.06, a: 0.42, origine: [466, 136], arrivee: [462, 1004], couche: 2 },
  { id: "barrette-bas", etape: 6, de: 0.06, a: 0.42, origine: [465, 1402], arrivee: [462, 1196], couche: 2 },
  { id: "bracelet-bas", etape: 6, de: 0.06, a: 0.42, origine: [465, 1402], arrivee: [462, 1196], couche: 2 },
];

/** Où poser une image de pièce dans l'éclaté : sa boîte. */
export const boitePiece = (id: IdPiece): Boite => BOITES_PIECES[id];

/* La montre finie, de trois quarts (la quatrième image de J ; sa lunette : centre 461, 652, demi-axes 342 × 232) : on y voit
   son épaisseur. Calée sur la carrure : le centre de sa lunette va au centre de la carrure, à l'échelle où son rayon
   devient celui de la carrure. */
const calerPhoto = (b: Boite, cx: number, cy: number, rayon: number) => {
  const s = CARRURE.a / rayon;
  return { x: CARRURE.cx + (b.x - cx) * s, y: CARRURE.cy + (b.y - cy) * s, l: b.l * s, h: b.h * s };
};
export const PHOTO_TROIS_QUARTS = calerPhoto(BOITES_PHOTOS["trois-quarts"], 461, 652, 342);

/* L'intérieur de la carrure, sombre : on le voit par les jours, une fois le mouvement posé (avant, la carrure vide est un
   anneau, on voit le ciel au travers). Et l'ombre que le bord de la carrure jette sur le mouvement : il paraît au fond. */
export const INTERIEUR = { cx: 461, cy: 1078, a: 166, b: 82 } as const;

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
      // et après : un léger zoom sur la montre finie
      { t: d(7) + S * 0.08, h: 700, l: 470, fy: 1060, ay: 0.5 },
      { t: 1, h: 600, l: 430, fy: 1052, ay: 0.5 },
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
      { t: d(7) + S * 0.08, h: 740, l: 470, fy: 1060, ay: 0.31 },
      { t: 1, h: 650, l: 440, fy: 1054, ay: 0.31 },
    ],
  },
};

/** Les fenêtres des mouvements d'ensemble (fractions de la chronologie). */
export const TEMPS = {
  // l'arrivée : les pièces se rangent sur le fil
  arrivee: { de: 0, a: d(0) + S * 0.8 },
  // le fil d'or s'efface quand la montre est montée, avant qu'elle se relève
  fil: { de: d(6) + S * 0.24, a: d(6) + S * 0.42 },
  // la montre finie se relève : la pile devient la photo de trois quarts
  releve: { de: d(6) + S * 0.44, a: d(6) + S * 0.88 },
  // la lumière glisse sur l'or de la montre finie
  reflet: { de: d(6) + S * 0.9, a: d(7) + S * 0.45 },
} as const;

export const finEtape = (piece: PiecePhoto) => d(piece.etape) + S * piece.a;
export const debutEtape = (piece: PiecePhoto) => d(piece.etape) + S * piece.de;
