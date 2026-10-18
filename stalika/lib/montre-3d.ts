import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ---------------------------------------------------------------------------
   La montre de la section 04, en volume : ses pièces, en millimètres, comme
   une vraie (J, 2026-10-18 : « il faut que la montre soit en 3D et surtout
   qu'elle ait l'épaisseur d'une vraie montre, pareil pour le bracelet »).
   Montre habillée de 38 mm, près de 7 mm d'épaisseur avec son verre bombé et son fond ;
   bracelet de 20 mm aux cornes, 17 mm au bout, 3,4 mm d'épaisseur, courbé
   comme autour d'un poignet.

   Repère : le cadran dans le plan XY, midi vers +Y, la face vers +Z (vers la
   caméra) ; le fond regarde -Z.

   Rien ne se charge : les géométries sont calculées ici, et les textures
   (cadran, cuir, mouvement, gravure) peintes dans des canvas, au premier
   affichage. L'or vient du doré du thème (`--color-accent`, lu sur la page),
   poussé vers l'or jaune ; les autres couleurs sont celles des matières.
--------------------------------------------------------------------------- */

export const COTE = {
  rayon: 19, // le boîtier
  cadran: 15.6,
  hauteurCadran: 4.6,
  verre: 6.15, // le sommet du verre bombé
  fenetre: -0.55, // le saphir du fond
  bracelet: { largeur: 20, bout: 17, epaisseur: 3.4, finale: 2.6 },
} as const;

/** Des normales lissées sur les courbes, nettes sur les arêtes (un biseau reste un biseau). */
function lisse(g: THREE.BufferGeometry, angle = Math.PI / 5) {
  return toCreasedNormals(g, angle);
}

/* ---- Le boîtier : un profil tourné, de la lunette au fond ------------------ */

/** Le profil (rayon, hauteur) du boîtier, de la fenêtre du fond jusqu'au bord du cadran : le fond plat (où se pose la
    gravure), la carrure haute, la lunette large et polie, le rehaut. Tourné autour de l'axe des Z. Le sens du parcours
    compte : il met l'extérieur du côté visible. En deux pièces : le fond, satiné, et le reste, poli miroir. */
const PROFIL_FOND: [number, number][] = [
  [12.9, COTE.fenetre], // la fenêtre saphir
  [13.25, -0.5],
  [13.5, -0.36],
  [13.9, -0.26], // le fond, plat
  [17.5, -0.26],
  [17.85, -0.2],
  [18.25, 0.02],
];

function tour(p: [number, number][]) {
  const g = new THREE.LatheGeometry(
    p.map(([r, h]) => new THREE.Vector2(r, h)),
    192,
  );
  // l'axe du tour (Y) devient l'axe de la montre (Z) ; on garde les normales du tour, qui n'ont pas de couture
  g.rotateX(Math.PI / 2);
  return g;
}

export function fond(): THREE.BufferGeometry {
  return tour(PROFIL_FOND);
}

export function boitier(): THREE.BufferGeometry {
  const p: [number, number][] = [
    PROFIL_FOND[PROFIL_FOND.length - 1],
    [18.65, 0.4],
    [18.98, 0.95],
    [19.1, 1.7], // la carrure
    [19.1, 4.0],
    [19.06, 4.75],
    [18.95, 5.3],
    [18.75, 5.82], // la lunette
    [18.3, 6.08],
    [17.6, 6.12],
    [16.8, 5.95],
    [15.95, 5.52],
    [15.65, 5.3], // le rehaut
    [15.55, 4.5], // sous le bord du cadran
  ];
  return tour(p);
}

/** Une corne : son profil de côté (elle sort de la carrure, sous la lunette, et plonge vers le bracelet), large de
    3 mm à la racine, effilée vers le bout, toutes arêtes adoucies. */
export function corne(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(13.6, 4.85);
  s.bezierCurveTo(19.0, 4.95, 22.0, 4.2, 23.6, 2.95);
  s.quadraticCurveTo(24.25, 2.35, 23.95, 1.75);
  s.lineTo(23.3, 1.3);
  s.bezierCurveTo(21.8, 1.75, 19.6, 2.15, 13.6, 2.15);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 2.4, bevelEnabled: true, bevelThickness: 0.32, bevelSize: 0.3, bevelSegments: 4, curveSegments: 32 });
  // la forme est dessinée en (distance au centre, hauteur) : elle devient (Y, Z), l'épaisseur va sur X
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  g.translate(-1.2, 0, 0);
  // effilée : 30 % plus étroite au bout qu'à la sortie du boîtier
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp((p.getY(i) - 17) / 7, 0, 1);
    p.setX(i, p.getX(i) * (1 - 0.3 * t * t * (3 - 2 * t)));
  }
  return lisse(g);
}

/** La couronne cannelée : une étoile à 30 côtes arrondies, extrudée sur 2 mm, posée sur l'axe X. */
export function couronne(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const n = 30;
  for (let i = 0; i <= n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2;
    const r = 2.25 - 0.12 * (0.5 + 0.5 * Math.cos(a * n));
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 4, curveSegments: 4 });
  g.rotateY(Math.PI / 2);
  return lisse(g);
}

/** Un bâton (index, aiguille) : un rectangle arrondi, effilé, en relief, biseauté pour accrocher la lumière. */
export function baton(longueur: number, large: number, bout: number, epaisseur: number, queue = 0): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-large / 2, -queue);
  s.lineTo(large / 2, -queue);
  s.lineTo(bout / 2, longueur);
  s.lineTo(-bout / 2, longueur);
  s.closePath();
  const b = Math.min(large, bout) * 0.32;
  const g = new THREE.ExtrudeGeometry(s, { depth: epaisseur, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.9, bevelSegments: 2, curveSegments: 2 });
  return lisse(g, Math.PI / 9);
}

/* ---- Le bracelet : un ruban épais, galbé, balayé le long d'une courbe ------ */

/** Un brin de bracelet. `sens` : +1 vers midi, -1 vers 6 h. Il naît dans la carrure (son bout coupé droit s'y cache),
    sort à plat entre les cornes, puis s'enroule vers l'arrière, comme autour d'un poignet : un arc de 13 mm de rayon,
    sur `arc` radians. Section : dessus bombé, dessous plat, bords arrondis ; il s'affine vers le bout, qui est arrondi.
    Coordonnées de texture : u en travers (0 à 1), v le long, en unités de 40 mm. */
export function brin(sens: 1 | -1, arc = 2.6): THREE.BufferGeometry {
  const { largeur, bout, epaisseur, finale } = COTE.bracelet;
  const R = 13;
  const sortie = 21; // là où il quitte les cornes, à plat
  const z0 = 2.05;
  const pts: THREE.Vector3[] = [new THREE.Vector3(0, 16.8 * sens, z0 + 0.05), new THREE.Vector3(0, 19 * sens, z0 + 0.02)];
  const N = 30;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI / 2 - (arc * i) / N;
    pts.push(new THREE.Vector3(0, sens * (sortie + R * Math.cos(a)), z0 - R + R * Math.sin(a)));
  }
  const courbe = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const longueur = courbe.getLength() / 40;

  const ANNEAUX = 120;
  const DESSUS = 18; // points sur le dessus bombé
  const pos: number[] = [];
  const uv: number[] = [];
  const dessus: number[] = [];
  const dessous: number[] = [];
  const B = new THREE.Vector3(1, 0, 0);
  let anneau = 0;
  for (let i = 0; i <= ANNEAUX; i++) {
    const t = i / ANNEAUX;
    const P = courbe.getPointAt(t);
    const T = courbe.getTangentAt(t).normalize();
    const Nn = new THREE.Vector3().crossVectors(B, T).multiplyScalar(sens).normalize();
    // l'affinement, et le bout arrondi sur les 7 derniers %
    let w = largeur + (bout - largeur) * t;
    let e = epaisseur + (finale - epaisseur) * t;
    if (t > 0.93) {
      const k = (t - 0.93) / 0.07;
      w *= Math.sqrt(Math.max(0.0001, 1 - k * k));
      e *= 0.6 + 0.4 * Math.sqrt(Math.max(0, 1 - k * k));
    }
    // la section : le dessus bombé de gauche à droite, le bord droit, le dessous plat, le bord gauche
    const section: [number, number, number][] = [];
    for (let j = 0; j <= DESSUS; j++) {
      const x = -w / 2 + (w * j) / DESSUS;
      const q = (2 * x) / w;
      const bord = Math.abs(q) > 0.86 ? Math.sqrt(Math.max(0, 1 - ((Math.abs(q) - 0.86) / 0.14) ** 2)) : 1;
      section.push([x, -e / 2 + e * (0.62 + 0.38 * (1 - q * q)) * (0.35 + 0.65 * bord), 0.03 + 0.94 * (x / w + 0.5)]);
    }
    for (let j = DESSUS - 1; j >= 1; j--) {
      const x = -w / 2 + (w * j) / DESSUS;
      section.push([x, -e / 2, 0.03 + 0.94 * (x / w + 0.5)]);
    }
    for (const [x, y, u] of section) {
      const v = P.clone().addScaledVector(B, x).addScaledVector(Nn, y);
      pos.push(v.x, v.y, v.z);
      uv.push(u, t * longueur);
    }
    if (i > 0) {
      const m = section.length;
      const a = (anneau - 1) * m;
      const b = anneau * m;
      for (let j = 0; j < m; j++) {
        const j2 = (j + 1) % m;
        const idx = j < DESSUS ? dessus : dessous;
        // le sens des triangles met le dessus vers l'extérieur (il dépend du sens de parcours du brin)
        if (sens < 0) idx.push(a + j, b + j, b + j2, a + j, b + j2, a + j2);
        else idx.push(a + j, b + j2, b + j, a + j, a + j2, b + j2);
      }
    }
    anneau++;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([...dessus, ...dessous]);
  // deux matières : l'alligator dessus et sur les bords, la doublure lisse dessous
  g.addGroup(0, dessus.length, 0);
  g.addGroup(dessus.length, dessous.length, 1);
  g.computeVertexNormals();
  return g;
}

/* ---- Le mouvement, en volume (d'après la photo d'un calibre à remontage manuel envoyée par J) ----------------
   Vu par le fond : des ponts en acier anguleux, vissés ; des roues en laiton doré à bras ; un grand rochet en acier
   soleillé, sa roue de couronne ; le balancier et son spiral ; des rubis. Rayon 12,6 mm. Les coordonnées sont données
   telles qu'on les voit par le fond (x vers la droite du spectateur) : la pièce posée les retourne (x = -x). */

/** Une roue dentée : `dents` dents au rayon `r`, `bras` bras (0 : pleine), un trou au centre. Épaisseur `e`, sur Z. */
export function roueDentee(r: number, dents: number, bras: number, e: number, hauteurDent = 0.035): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const h = Math.max(0.12, r * hauteurDent * 3);
  for (let i = 0; i < dents; i++) {
    const a = (k: number) => ((i + k) / dents) * Math.PI * 2;
    const p = (rr: number, aa: number) => [rr * Math.cos(aa), rr * Math.sin(aa)] as const;
    const pts = [p(r - h, a(0)), p(r, a(0.2)), p(r, a(0.45)), p(r - h, a(0.62))];
    pts.forEach(([x, y], k) => (i === 0 && k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  }
  s.closePath();
  const moyeu = Math.max(0.3, r * 0.2);
  const jante = r - h - Math.max(0.25, r * 0.13);
  if (bras > 0) {
    // les jours entre les bras
    for (let k = 0; k < bras; k++) {
      const a0 = (k / bras) * Math.PI * 2 + 0.16 * (6 / bras);
      const a1 = ((k + 1) / bras) * Math.PI * 2 - 0.16 * (6 / bras);
      const trou = new THREE.Path();
      trou.absarc(0, 0, jante, a0, a1, false);
      trou.absarc(0, 0, moyeu + 0.18, a1, a0, true);
      trou.closePath();
      s.holes.push(trou);
    }
  }
  const axe = new THREE.Path();
  axe.absarc(0, 0, Math.max(0.12, r * 0.06), 0, Math.PI * 2, true);
  s.holes.push(axe);
  const g = new THREE.ExtrudeGeometry(s, { depth: e, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1, curveSegments: 10 });
  g.computeVertexNormals();
  return g;
}

/** Un pont : un polygone anguleux, aux angles adoucis, épais de `e`, biseauté (l'anglage qui accroche la lumière). */
export function pont(points: readonly (readonly [number, number])[], e: number, trous: readonly (readonly [number, number, number])[] = []): THREE.BufferGeometry {
  const s = new THREE.Shape();
  points.forEach(([x, y], k) => (k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  for (const [x, y, r] of trous) {
    const t = new THREE.Path();
    t.absarc(x, y, r, 0, Math.PI * 2, true);
    s.holes.push(t);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: e, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 16 });
  g.computeVertexNormals();
  return g;
}

/** Le spiral du balancier : un fil plat enroulé, en tube très fin. */
export function spiral(tours = 11, r0 = 0.35, r1 = 2.2): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const n = tours * 48;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * tours * Math.PI * 2;
    const r = r0 + ((r1 - r0) * i) / n;
    pts.push(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), 0));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, 0.022, 4, false);
}

export const MOUVEMENT_3D = {
  // les ponts (vus par le fond), en millimètres
  ponts: [
    // le grand pont de rouage, à gauche
    {
      points: [[-11.6, 2.8], [-6.2, 4.6], [-2.4, 2.2], [-0.6, -1.6], [-3.4, -3.6], [-9.0, -4.4], [-11.9, -1.2]],
      trous: [[-4.2, 1.0, 0.55], [-8.6, -1.6, 0.4]],
    },
    // le pont de barillet, en bas
    {
      points: [[-8.2, -5.4], [-3.0, -4.2], [3.4, -3.4], [7.6, -5.0], [6.4, -9.6], [0.4, -12.2], [-5.8, -10.6]],
      trous: [],
    },
    // le pont de droite
    {
      points: [[5.0, 9.8], [9.8, 6.4], [12.0, 1.0], [11.2, -3.2], [7.8, -2.6], [4.6, 1.4], [2.8, 6.0]],
      trous: [[7.4, 3.2, 0.45]],
    },
    // le coq du balancier, en haut à gauche
    {
      points: [[-9.2, 6.4], [-6.4, 6.0], [-3.8, 8.6], [-4.6, 10.6], [-7.6, 10.4]],
      trous: [],
    },
  ],
  // les roues en laiton : x, y, rayon, dents, bras
  roues: [
    [0.0, 1.2, 3.9, 80, 5],
    [3.6, 4.4, 3.2, 72, 4],
    [-3.4, 4.4, 2.6, 60, 5],
  ],
  // le rochet (acier soleillé) et la roue de couronne
  rochet: [-1.2, -6.0, 4.6, 96],
  couronne: [5.6, -4.4, 2.5, 52],
  balancier: [-6.4, 6.6, 2.7],
  rubis: [[0.0, 1.2], [3.6, 4.4], [-3.4, 4.4], [-6.4, 6.6], [-4.2, 1.0], [7.4, 3.2], [2.2, -1.0], [-8.6, -1.6]],
  vis: [[-10.2, 1.6], [-5.4, -3.6], [-6.8, -8.4], [4.6, -8.2], [9.6, 4.4], [10.2, -1.8], [-6.0, 8.6], [3.8, 7.6]],
} as const;

/* ---- Les textures, peintes dans des canvas ---------------------------------- */

function toile(l: number, h = l) {
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas 2D indisponible");
  return { c, ctx };
}

function texture(c: HTMLCanvasElement, couleur = true) {
  const t = new THREE.CanvasTexture(c);
  if (couleur) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** La police du site (Inter, servie par next/font : son nom de famille est généré), pour écrire sur le cadran. */
function police(): string {
  return getComputedStyle(document.body).fontFamily || "sans-serif";
}

/** Le cadran champagne : la couleur, les inscriptions, le compteur des 72 heures. Et la carte du brossage soleil (pour
    `anisotropyMap` : la direction du brossage, en rouge et vert, est radiale). */
export function texturesCadran(champagne: string, encre: string) {
  const L = 2048;
  const { c, ctx } = toile(L);
  const C = L / 2;
  const mm = L / (2 * COTE.cadran); // pixels par millimètre
  const g = ctx.createRadialGradient(C * 0.8, C * 0.7, 0, C, C, C);
  g.addColorStop(0, champagne);
  g.addColorStop(1, champagne);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L, L);
  // un grain très léger : un carreau de bruit de 256 pixels, répété (rapide à peindre)
  const { c: cg, ctx: xg } = toile(256);
  const bruit = xg.createImageData(256, 256);
  for (let i = 0; i < bruit.data.length; i += 4) {
    const v = Math.random() * 255;
    bruit.data[i] = bruit.data[i + 1] = bruit.data[i + 2] = v;
    bruit.data[i + 3] = 255;
  }
  xg.putImageData(bruit, 0, 0);
  const motif = ctx.createPattern(cg, "repeat");
  if (motif) {
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = motif;
    ctx.fillRect(0, 0, L, L);
    ctx.restore();
  }
  const f = police();
  ctx.fillStyle = encre;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const ecrire = (texte: string, y: number, taille: number, espace: number, graisse = 500, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${graisse} ${taille * mm}px ${f}`;
    ctx.letterSpacing = `${espace * mm}px`;
    ctx.fillText(texte, C + (espace * mm) / 2, C - y * mm);
    ctx.restore();
  };
  ecrire("STALIKA", 5.1, 1.55, 0.42, 500);
  ecrire("SUR MESURE", 3.45, 0.88, 0.3, 500, 0.85);
  ecrire("FAIT MAIN", -14.6, 0.62, 0.24, 500, 0.7);
  const couleur = texture(c);

  // le brossage soleil : direction radiale
  const A = 512;
  const { c: c2, ctx: x2 } = toile(A);
  const im = x2.createImageData(A, A);
  for (let y = 0; y < A; y++)
    for (let x = 0; x < A; x++) {
      const dx = x - A / 2 + 0.5;
      const dy = A / 2 - y - 0.5;
      const n = Math.hypot(dx, dy) || 1;
      const i = (y * A + x) * 4;
      im.data[i] = (dx / n) * 127.5 + 127.5;
      im.data[i + 1] = (dy / n) * 127.5 + 127.5;
      im.data[i + 2] = 255;
      im.data[i + 3] = 255;
    }
  x2.putImageData(im, 0, 0);
  const brossage = texture(c2, false);
  return { couleur, brossage };
}

/** Le petit disque azuré du compteur des 72 heures (rayon `COMPTEUR.rayon`) : des sillons concentriques très fins, ses
    graduations (toutes les deux heures) et ses chiffres. */
export const COMPTEUR = { x: 0, y: -5.6, rayon: 3.75 } as const;
export function textureAzurage(champagne: string, encre: string) {
  const L = 1024;
  const { c, ctx } = toile(L);
  const C = L / 2;
  const mm = L / (2 * COMPTEUR.rayon);
  ctx.fillStyle = champagne;
  ctx.fillRect(0, 0, L, L);
  for (let r = 2; r < L / 2; r += 5) {
    ctx.strokeStyle = r % 10 < 5 ? "rgba(255,250,235,.32)" : "rgba(90,64,20,.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(C, C, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = encre;
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2;
    const long = k % 6 === 0;
    const r1 = 3.45 * mm;
    const r2 = (long ? 2.75 : 3.1) * mm;
    ctx.globalAlpha = long ? 0.9 : 0.55;
    ctx.lineWidth = (long ? 0.11 : 0.055) * mm;
    ctx.beginPath();
    ctx.moveTo(C + r1 * Math.sin(a), C - r1 * Math.cos(a));
    ctx.lineTo(C + r2 * Math.sin(a), C - r2 * Math.cos(a));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = encre;
  ctx.font = `500 ${0.72 * mm}px ${police()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  (
    [
      ["72", 0],
      ["24", 120],
      ["48", 240],
    ] as const
  ).forEach(([t, deg]) => {
    const a = (deg * Math.PI) / 180;
    ctx.fillText(t, C + 1.95 * mm * Math.sin(a), C - 1.95 * mm * Math.cos(a));
  });
  return texture(c);
}

/** La platine, sous les ponts : un perlage (des cercles qui se chevauchent). */
export function texturePerlage() {
  const L = 1024;
  const { c, ctx } = toile(L);
  ctx.fillStyle = "#a59c88";
  ctx.fillRect(0, 0, L, L);
  for (let y = 0; y < L + 30; y += 22)
    for (let x = (y / 22) % 2 ? 11 : 0; x < L + 30; x += 22) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 15);
      g.addColorStop(0, "#d4d1ca");
      g.addColorStop(0.45, "#97948d");
      g.addColorStop(0.8, "#c6c3bb");
      g.addColorStop(1, "#86837c");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  return texture(c);
}

/** Les côtes de Genève des ponts : des bandes parallèles de 2,4 mm, chacune claire au milieu, plus sombre aux bords,
    finement brossée. Les ponts ont pour coordonnées de texture leurs millimètres : la texture se répète. */
export function textureCotes() {
  const L = 256;
  const { c, ctx } = toile(L);
  const img = ctx.createImageData(L, L);
  for (let y = 0; y < L; y++) {
    const b = 0.5 + 0.5 * Math.cos(((y + 0.5) / L) * Math.PI * 2);
    for (let x = 0; x < L; x++) {
      const v = 150 + 80 * b + (Math.random() - 0.5) * 18;
      const i = (y * L + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = texture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 2.4, 1 / 2.4);
  t.rotation = 0.42;
  return t;
}

/** Une inscription gravée, à poser en décalque sur une pièce : lettres sombres sur fond transparent. */
export function textureInscription(texte: string, ombre: string) {
  const { c, ctx } = toile(1024, 128);
  ctx.fillStyle = ombre;
  ctx.font = `600 52px ${police()}`;
  ctx.letterSpacing = "10px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texte, 512, 66);
  return texture(c);
}

/** Le cuir d'alligator : les écailles (grandes au milieu, petites vers les bords), les bords teintés, les surpiqûres.
    Une carte de couleur et une carte de relief. u : en travers (les 20 mm du bracelet), v : le long, 40 mm par tour
    (51 pixels par millimètre dans les deux sens). */
export function texturesCuir() {
  const L = 1024;
  const H = 2048;
  const mm = H / 40;
  const { c, ctx } = toile(L, H);
  const { c: cb, ctx: xb } = toile(L, H);
  ctx.fillStyle = "#0b0b0a";
  ctx.fillRect(0, 0, L, H);
  xb.fillStyle = "#000";
  xb.fillRect(0, 0, L, H);
  // les colonnes d'écailles, de la gauche vers la droite : (largeur relative, longueur d'une écaille en millimètres)
  const colonnes: [number, number][] = [
    [0.05, 1.5],
    [0.07, 2.0],
    [0.1, 2.8],
    [0.155, 3.8],
    [0.155, 3.8],
    [0.1, 2.8],
    [0.07, 2.0],
    [0.05, 1.5],
  ];
  const total = colonnes.reduce((s, [w]) => s + w, 0);
  const marge = 0.06;
  let x = marge * L;
  const util = L * (1 - 2 * marge);
  let graine = 7;
  const hasard = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);
  for (const [w, hh] of colonnes) {
    const lw = (w / total) * util;
    const lh = hh * mm;
    let y = -hasard() * lh;
    while (y < H) {
      const ex = x + 3;
      const ey = y + 3;
      const ew = lw - 6;
      const eh = lh * (0.85 + hasard() * 0.3) - 6;
      const rr = Math.min(ew, eh) * 0.28;
      // l'écaille : légèrement plus claire au centre, le pli plus sombre
      const gr = ctx.createRadialGradient(ex + ew / 2, ey + eh * 0.35, 1, ex + ew / 2, ey + eh / 2, Math.max(ew, eh) * 0.7);
      gr.addColorStop(0, "#22211e");
      gr.addColorStop(0.6, "#141412");
      gr.addColorStop(1, "#0c0c0b");
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.roundRect(ex, ey, ew, eh, rr);
      ctx.fill();
      const rb = xb.createRadialGradient(ex + ew / 2, ey + eh / 2, 1, ex + ew / 2, ey + eh / 2, Math.max(ew, eh) * 0.62);
      rb.addColorStop(0, "#fff");
      rb.addColorStop(0.7, "#bbb");
      rb.addColorStop(1, "#555");
      xb.fillStyle = rb;
      xb.beginPath();
      xb.roundRect(ex, ey, ew, eh, rr);
      xb.fill();
      y += eh + 6;
    }
    x += lw;
  }
  // les bords teintés, et les surpiqûres
  for (const [x0, x1] of [
    [0, 0.035],
    [0.965, 1],
  ]) {
    ctx.fillStyle = "#151310";
    ctx.fillRect(x0 * L, 0, (x1 - x0) * L, H);
  }
  for (const xs of [0.062, 0.938]) {
    for (let y = 0; y < H; y += 26) {
      ctx.fillStyle = "#4a4740";
      ctx.fillRect(xs * L - 3, y, 6, 16);
      xb.fillStyle = "#fff";
      xb.fillRect(xs * L - 3, y, 6, 16);
    }
  }
  const couleur = texture(c);
  const relief = texture(cb, false);
  for (const t of [couleur, relief]) {
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
  }
  return { couleur, relief };
}

/** La gravure du fond, autour de la fenêtre : lettres en creux, plus sombres que l'or. */
export function textureGravure(ombre: string) {
  const L = 1024;
  const { c, ctx } = toile(L);
  ctx.clearRect(0, 0, L, L);
  ctx.fillStyle = ombre;
  ctx.font = `500 ${L * 0.03}px ${police()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const texte = "VOTRE CODE · VOTRE DOMAINE · À VOTRE NOM · STALIKA · SUR MESURE · FAIT MAIN · ";
  const r = (L / 2) * (15.7 / 17.6); // au milieu du fond plat (13,9 à 17,5 mm)
  [...texte].forEach((ch, i) => {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / texte.length;
    ctx.save();
    ctx.translate(L / 2 + r * Math.cos(a), L / 2 + r * Math.sin(a));
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  return texture(c);
}

/* ---- L'or : le doré du thème, poussé vers l'or jaune ------------------------ */

/** Lit le doré du thème sur un élément de la page (le `.nuit` de la section le change) et en tire les teintes de l'or. */
export function teintes(depuis: Element) {
  const sonde = document.createElement("span");
  sonde.style.color = "var(--color-accent)";
  depuis.appendChild(sonde);
  const accent = new THREE.Color(getComputedStyle(sonde).color || "rgb(212,188,139)");
  sonde.remove();
  const orJaune = new THREE.Color(0.86, 0.66, 0.3);
  const metal = accent.clone().lerp(orJaune, 0.55);
  const champagne = accent.clone().lerp(new THREE.Color(0.97, 0.95, 0.9), 0.2);
  const or = accent.clone().lerp(orJaune, 0.3);
  // l'arc du chrono : un or sombre, qui se lit sur le champagne (comme `--or-4` sur la montre à plat)
  const arc = or.clone().lerp(new THREE.Color("#4a3510"), 0.5);
  return { metal, champagne: `#${champagne.getHexString()}`, or: `#${or.getHexString()}`, arc: `#${arc.getHexString()}`, ombre: "#3a2a10", encre: "#1e1a12" };
}
