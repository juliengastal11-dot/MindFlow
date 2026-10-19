/* ---------------------------------------------------------------------------
   La montre qui se fabrique au défilement (essai du 2026-10-19, J : « la
   montre avec toutes ses pièces posée en vrac sur une ligne au niveau du bas
   du texte, et au défilement les pièces montent et la montre se forme au fur
   et à mesure » ; un fil d'or pour la ligne ; l'assemblage remplace
   l'animation des étapes).

   Le plan de montage, dans l'ordre d'un horloger, une étape du récit par
   étage : la platine (le premier message), le rouage (on en parle, le plan),
   les ponts, le balancier, le rochet, les rubis et les vis (la première
   ébauche : le mouvement se met à battre), le boîtier puis le cadran (vous
   relisez : la face que le client voit), les index, les aiguilles et le
   verre (tout est vérifié), le bracelet (la mise en ligne), et le
   retournement sur le mouvement qu'on a vu se construire (et après : le code
   est à vous).

   Chaque pièce (`id`, le nom d'un `Porteur` de components/ui/montre-3d.tsx)
   vole pendant une fenêtre de son étape (`de` à `a`, en fractions de
   l'étape). `face` : le côté qu'elle montre quand elle repose sur le fil (1 :
   son dessus, vers le cadran ; -1 : son dessous, comme le mouvement vu par le
   fond). `vis` : elle se visse en arrivant.
--------------------------------------------------------------------------- */

export type PieceMontage = { id: string; etape: number; de: number; a: number; face: 1 | -1; vis?: boolean; couche?: boolean };

const serie = (prefixe: string, n: number, etape: number, de: number, a: number, duree: number, face: 1 | -1, extra: Partial<PieceMontage> = {}) =>
  Array.from({ length: n }, (_, i): PieceMontage => {
    const t = n > 1 ? i / (n - 1) : 0;
    const debut = de + (a - de - duree) * t;
    return { id: `${prefixe}-${i}`, etape, de: debut, a: debut + duree, face, ...extra };
  });

export const PLAN_MONTAGE: PieceMontage[] = [
  // 01 · la platine, le socle de tout
  { id: "platine", etape: 1, de: 0.08, a: 0.62, face: -1 },
  // 02 · le rouage : les roues dorées, l'échappement, l'ancre
  { id: "roue-0", etape: 2, de: 0.06, a: 0.4, face: -1 },
  { id: "roue-1", etape: 2, de: 0.16, a: 0.5, face: -1 },
  { id: "roue-2", etape: 2, de: 0.26, a: 0.58, face: -1 },
  { id: "echappement", etape: 2, de: 0.36, a: 0.66, face: -1 },
  { id: "ancre", etape: 2, de: 0.44, a: 0.72, face: -1 },
  // 03 · les ponts, le balancier sous son coq, le rochet et la roue de couronne, les rubis, puis les vis
  { id: "pont-0", etape: 3, de: 0.02, a: 0.26, face: -1 },
  { id: "pont-1", etape: 3, de: 0.06, a: 0.3, face: -1 },
  { id: "pont-2", etape: 3, de: 0.1, a: 0.34, face: -1 },
  { id: "balancier", etape: 3, de: 0.16, a: 0.4, face: -1 },
  { id: "coq", etape: 3, de: 0.24, a: 0.46, face: -1 },
  { id: "rochet", etape: 3, de: 0.28, a: 0.5, face: -1 },
  { id: "roue-couronne", etape: 3, de: 0.32, a: 0.54, face: -1 },
  ...serie("rubis", 7, 3, 0.38, 0.6, 0.14, -1),
  ...serie("vis", 10, 3, 0.46, 0.78, 0.18, -1, { vis: true }),
  // 04 · le boîtier vient entourer le mouvement ; la montre se tourne ; le cadran et la couronne se posent
  { id: "boitier", etape: 4, de: 0.04, a: 0.4, face: 1 },
  { id: "cadran", etape: 4, de: 0.5, a: 0.84, face: 1 },
  { id: "couronne", etape: 4, de: 0.6, a: 0.9, face: 1 },
  // 05 · les douze index un à un, les aiguilles, le verre
  ...serie("index", 12, 5, 0.04, 0.46, 0.12, 1),
  { id: "aiguille-petite", etape: 5, de: 0.4, a: 0.58, face: 1 },
  { id: "aiguille-heures", etape: 5, de: 0.46, a: 0.64, face: 1 },
  { id: "aiguille-minutes", etape: 5, de: 0.52, a: 0.7, face: 1 },
  { id: "aiguille-chrono", etape: 5, de: 0.58, a: 0.76, face: 1 },
  { id: "chapeau", etape: 5, de: 0.64, a: 0.8, face: 1 },
  { id: "verre", etape: 5, de: 0.7, a: 0.92, face: 1 },
  // 06 · le bracelet
  { id: "brin-haut", etape: 6, de: 0.04, a: 0.4, face: 1, couche: true },
  { id: "brin-bas", etape: 6, de: 0.14, a: 0.5, face: 1, couche: true },
];

/** Un hasard reproductible : le vrac est le même à chaque visite. */
export function hasard(graine: number) {
  let s = graine;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
