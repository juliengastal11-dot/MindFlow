/* ---------------------------------------------------------------------------
   La chute du bouton : le calcul seul, sans toucher à la page.

   Trois morceaux, tous déterministes (mêmes entrées, même film) :
   - le balancement : une oscillation amortie, pour le bouton accroché par
     un coin, qui s'éteint exactement à l'heure voulue ;
   - la chute : une suite d'arcs de parabole d'un impact au suivant (chaque
     rebond repart moins haut que l'arrivée), jusqu'au sol de l'image, puis
     trois petits rebonds d'atterrissage. Le film est calculé avec une
     gravité fixe, puis mis à la durée voulue ;
   - la caméra : le défilement, qui passe par un repère à chaque impact, d'une
     courbe monotone qui part et arrive au repos.

   Tout est exprimé dans les coordonnées de la PAGE, pas de l'écran : le bouton
   est un objet posé dans la page, et c'est le défilement qui le suit.
   Les angles sont en radians, dans le repère de l'écran (y vers le bas) : un
   angle positif tourne dans le sens des aiguilles d'une montre, comme
   `rotate()` en CSS.
--------------------------------------------------------------------------- */

const borne = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const douce = (x: number) => x * x * (3 - 2 * x);
const meler = (a: number, b: number, t: number) => a + (b - a) * t;

export type Point = { x: number; y: number };

/** La matrice CSS d'un élément dont le point local (ox, oy) est posé en (px, py),
    tourné de `angle` et étiré de (sx, sy) autour de ce point. À employer avec
    `transform-origin: 0 0`. */
export function matrice(px: number, py: number, angle: number, sx: number, sy: number, ox: number, oy: number): string {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const a = c * sx;
  const b = s * sx;
  const cc = -s * sy;
  const d = c * sy;
  const e = px - (a * ox + cc * oy);
  const f = py - (b * ox + d * oy);
  return `matrix(${a.toFixed(4)},${b.toFixed(4)},${cc.toFixed(4)},${d.toFixed(4)},${e.toFixed(2)},${f.toFixed(2)})`;
}

/* ---- Le balancement ------------------------------------------------------- */

export type ReglagePendule = {
  /** Période des petites oscillations, en secondes. */
  periode: number;
  /** Durée du balancement, en secondes : il s'éteint exactement à la fin. */
  duree: number;
  /** Amortissement, par seconde. */
  taux: number;
};

/** L'angle de repos d'un rectangle de l × h accroché par son coin haut gauche :
    celui où son centre pend à la verticale du clou (presque debout, quand il
    est long et plat). */
export const angleRepos = (l: number, h: number) => Math.atan2(l, h);

/** L'écart à l'angle de repos, à l'instant t : il part de `-amplitude`, sans
    vitesse, passe de l'autre côté, et s'éteint. */
export function ecartPendule(t: number, amplitude: number, k: ReglagePendule): number {
  if (t >= k.duree) return 0;
  // Sur la fin, le battement s'efface tout à fait : il s'arrête, il ne se fige pas.
  const fin = 1 - douce(borne((t - k.duree * 0.62) / (k.duree * 0.38)));
  return -amplitude * Math.exp(-k.taux * t) * Math.cos((2 * Math.PI * t) / k.periode) * fin;
}

/** Où poser le clou, et de combien le bouton peut se balancer sans sortir de
    l'écran : le clou le plus proche de `vise` pour lequel le balancement
    (de `repos - amplitude` à `repos + amplitude`) tient entre les marges, avec
    l'amplitude demandée ou, à défaut, la plus grande qui tienne. */
export function choisirAncrage(o: {
  l: number;
  h: number;
  /** Largeur de l'écran. */
  ecran: number;
  /** Abscisse voulue pour le clou. */
  vise: number;
  marge: number;
  /** Amplitude voulue, en radians. */
  amplitude: number;
}): { x: number; amplitude: number } {
  const repos = angleRepos(o.l, o.h);
  const coins: ReadonlyArray<readonly [number, number]> = [[0, 0], [o.l, 0], [o.l, o.h], [0, o.h]];
  const etendue = (amp: number) => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i <= 24; i++) {
      const th = repos - amp + (2 * amp * i) / 24;
      const c = Math.cos(th);
      const s = Math.sin(th);
      for (const [x, y] of coins) {
        const X = c * x - s * y;
        if (X < min) min = X;
        if (X > max) max = X;
      }
    }
    return [min, max] as const;
  };
  for (let amp = o.amplitude; amp > 0.1; amp -= 0.02) {
    const [min, max] = etendue(amp);
    const bas = o.marge - min;
    const haut = o.ecran - o.marge - max;
    if (bas <= haut) return { x: borne(o.vise, bas, haut), amplitude: amp };
  }
  return { x: o.ecran / 2, amplitude: 0.1 };
}

/** Un point d'une courbe de Bézier à trois points. */
export function bezier(s: number, a: Point, c: Point, b: Point): Point {
  const u = 1 - s;
  return { x: u * u * a.x + 2 * u * s * c.x + s * s * b.x, y: u * u * a.y + 2 * u * s * c.y + s * s * b.y };
}

/* ---- La caméra ------------------------------------------------------------ */

/** Interpolation cubique monotone (Fritsch-Carlson) par les points (xs, ys),
    pente nulle aux deux bouts : elle part et arrive au repos, et ne dépasse
    jamais ses repères. */
export function courbeMonotone(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  if (n === 1) return () => ys[0];
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  const m: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) continue;
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}

/* ---- La chute ------------------------------------------------------------- */

/** Un bord supérieur sur lequel le bouton peut rebondir, en coordonnées de la page. */
export type Plateforme<T = unknown> = { x0: number; x1: number; y: number; cible?: T };

export type ReglageChute = {
  /** Gravité du calcul, en px/s² : le film est ensuite mis à la durée voulue. */
  gravite: number;
  /** Part de la vitesse conservée à chaque rebond. */
  restitution: number;
  /** Hauteur d'un rebond, en fraction de la hauteur de l'écran. */
  rebond: { min: number; max: number };
  /** Écart minimal entre deux impacts, en fraction de la hauteur de l'écran. */
  ecartMin: number;
  maxRebonds: number;
  /** Où se place un impact à l'écran, en fraction de la hauteur depuis le haut. */
  ancrage: number;
  /** Hauteurs des rebonds d'atterrissage, en fraction de la hauteur de l'écran. */
  petitsRebonds: readonly number[];
  /** Un arc plus long que cela (secondes du calcul) fait un tour sur lui-même. */
  tour: number;
  /** Le bouton s'écrase à l'impact (`duree` en secondes du calcul, `force` en
      fraction de sa hauteur) et s'étire un instant avant (`etirement`). */
  ecrasement: { duree: number; force: number; etirement: number };
  /** Bornes de la mise à la durée voulue (1 : le film tel que calculé). */
  facteurTemps: { min: number; max: number };
};

export type EntreesChute<T = unknown> = {
  /** Taille du bouton à l'échelle 1, en pixels. */
  l: number;
  h: number;
  /** Le centre du bouton au lâcher, et son angle. */
  depart: Point & { angle: number };
  /** Le centre du bouton posé, et son angle. */
  arrivee: Point & { angle: number };
  /** L'échelle du bouton pendant la chute, puis une fois posé. */
  echelleVol: number;
  echelleFin: number;
  plateformes: readonly Plateforme<T>[];
  /** La taille de l'écran. */
  vue: { l: number; h: number };
  /** Le défilement au départ, et celui de l'arrivée. */
  defilement: { debut: number; fin: number };
  /** Durée voulue du film, en secondes. */
  duree: number;
  reglage: ReglageChute;
};

export type EtatBouton = { x: number; y: number; angle: number; sx: number; sy: number };

export type Rebond<T = unknown> = {
  /** L'instant de l'impact, en secondes du film. */
  t: number;
  /** Le point de contact, en coordonnées de la page. */
  x: number;
  y: number;
  /** Intensité du choc, de 0 à 1. */
  force: number;
  /** La plateforme touchée ; `null` pour le sol de l'image. */
  plateforme: Plateforme<T> | null;
};

export type PlanChute<T = unknown> = {
  /** Durée du film, en secondes. */
  duree: number;
  etat: (t: number) => EtatBouton;
  /** Le défilement à l'instant t. */
  camera: (t: number) => number;
  rebonds: readonly Rebond<T>[];
};

type Arc = {
  u0: number;
  u1: number;
  x0: number;
  x1: number;
  /** Le centre du bouton au départ et à l'arrivée de l'arc, et sa vitesse verticale au départ. */
  y0: number;
  yFin: number;
  vy0: number;
  /** `true` si l'arc part d'une surface (et non du clou). */
  appui: boolean;
  a0: number;
  a1: number;
  /** Tours sur lui-même, dans la part `fenetre` de l'arc (celle où le bouton est
      assez haut au-dessus des deux surfaces pour tourner sans les toucher). */
  tours: number;
  fenetre: readonly [number, number] | null;
  /** Balancement de l'angle en vol, qui s'efface près des surfaces. */
  ondulation: number;
};

export function planifierChute<T = unknown>(e: EntreesChute<T>): PlanChute<T> {
  const { l, vue, reglage: k } = e;
  const g = k.gravite;
  const largeurVol = l * e.echelleVol;
  const demi = (e.h * e.echelleVol) / 2;
  const hasard = (i: number) => {
    const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
    return s - Math.floor(s);
  };

  // 1. Les plateformes retenues : assez loin les unes des autres, pas trop nombreuses.
  const candidates = e.plateformes
    .map((p) => ({ p, yc: p.y - demi }))
    .filter((c) => c.yc > e.depart.y + k.ecartMin * vue.h * 0.5 && c.yc < e.arrivee.y - 0.3 * vue.h)
    .sort((a, b) => a.yc - b.yc);
  const retenues: typeof candidates = [];
  let precedent = e.depart.y;
  for (const c of candidates) {
    if (c.yc - precedent >= k.ecartMin * vue.h) {
      retenues.push(c);
      precedent = c.yc;
    }
  }
  while (retenues.length > k.maxRebonds) {
    let pire = 0;
    let ecart = Infinity;
    retenues.forEach((c, i) => {
      const avant = i === 0 ? e.depart.y : retenues[i - 1].yc;
      if (c.yc - avant < ecart) {
        ecart = c.yc - avant;
        pire = i;
      }
    });
    retenues.splice(pire, 1);
  }

  // 2. Les points d'impact : d'une plateforme à l'autre, le bouton zigzague.
  type Impact = { x: number; y: number; plateforme: Plateforme<T> | null };
  const points: Impact[] = [{ x: e.depart.x, y: e.depart.y, plateforme: null }];
  let x = e.depart.x;
  let sens = e.depart.x < vue.l / 2 ? 1 : -1;
  retenues.forEach((c, i) => {
    let bas = Math.max(c.p.x0 + largeurVol * 0.25, largeurVol / 2 + 6);
    let haut = Math.min(c.p.x1 - largeurVol * 0.25, vue.l - largeurVol / 2 - 6);
    if (bas > haut) bas = haut = (c.p.x0 + c.p.x1) / 2;
    const vise = x + sens * vue.l * (0.12 + 0.16 * hasard(i));
    x = borne(vise, bas, haut);
    sens = -sens;
    points.push({ x, y: c.yc, plateforme: c.p });
  });
  points.push({ x: e.arrivee.x, y: e.arrivee.y, plateforme: null });

  // 3. Les arcs, un par segment : on part de la vitesse de rebond précédente,
  //    on cherche l'instant où l'on atteint le point suivant.
  const arcs: Arc[] = [];
  const chocs: { u: number; force: number }[] = [];
  const impacts: { u: number; point: Impact; force: number }[] = [];
  const vitesseRef = Math.sqrt(2 * g * 0.45 * vue.h);
  let u = 0;
  let vy = 0;
  let angle = e.depart.angle;
  let tours = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const disc = vy * vy + 2 * g * (b.y - a.y);
    if (disc < 0) continue;
    const t = (-vy + Math.sqrt(disc)) / g;
    const entrante = vy + g * t;
    const dernier = i === points.length - 2;
    const angleFin = dernier ? e.arrivee.angle : i % 2 === 0 ? 0.05 : -0.04;
    // La part de l'arc où le bouton est assez haut, au-dessus de la surface qu'il
    // quitte comme de celle qu'il va toucher, pour tourner sur lui-même sans la
    // traverser : sa pointe, à la verticale, descend d'une demi-longueur.
    let fenetre: [number, number] | null = null;
    if (i > 0 && !dernier) {
      const libre = Math.hypot(largeurVol / 2, demi) + 8;
      let debut = -1;
      let fin = -1;
      for (let j = 0; j <= 48; j++) {
        const s = j / 48;
        const tau = s * t;
        const y = a.y + vy * tau + 0.5 * g * tau * tau;
        if (Math.min(a.y + demi - y, b.y + demi - y) >= libre) {
          if (debut < 0) debut = s;
          fin = s;
        }
      }
      if (debut >= 0 && (fin - debut) * t >= k.tour) fenetre = [debut, fin];
    }
    // Un arc qui a la place de le faire fait un tour sur lui-même (deux au plus).
    let tour = 0;
    if (fenetre && tours < 2) {
      tour = tours % 2 === 0 ? -1 : 1;
      tours++;
    }
    arcs.push({
      u0: u,
      u1: u + t,
      x0: a.x,
      x1: b.x,
      y0: a.y,
      yFin: b.y,
      vy0: vy,
      appui: i > 0,
      a0: angle,
      a1: angleFin,
      tours: tour,
      fenetre,
      ondulation: (i % 2 === 0 ? -1 : 1) * 0.1 * (1 - i / (points.length + 1)),
    });
    u += t;
    const force = borne(entrante / vitesseRef, 0.25, 1);
    chocs.push({ u, force });
    impacts.push({ u, point: b, force });
    angle = angleFin;
    // Le rebond : la vitesse rendue, bornée pour qu'il se voie sans quitter l'écran.
    const apex = borne((k.restitution * k.restitution * entrante * entrante) / (2 * g), k.rebond.min * vue.h, k.rebond.max * vue.h);
    vy = -Math.sqrt(2 * g * apex);
  }
  const atterrissage = arcs[arcs.length - 1];
  const uAtterrissage = atterrissage.u1;

  // 4. Les petits rebonds d'atterrissage, sur place.
  const dernierPoint = points[points.length - 1];
  k.petitsRebonds.forEach((f, i) => {
    const apex = f * vue.h;
    const v0 = -Math.sqrt(2 * g * apex);
    const t = (-2 * v0) / g;
    arcs.push({ u0: u, u1: u + t, x0: dernierPoint.x, x1: dernierPoint.x, y0: dernierPoint.y, yFin: dernierPoint.y, vy0: v0, appui: true, a0: e.arrivee.angle, a1: e.arrivee.angle, tours: 0, fenetre: null, ondulation: 0 });
    u += t;
    chocs.push({ u, force: 0.55 / (i + 1) });
  });
  const uFin = u;

  // 5. Mise à la durée voulue.
  const echelleTemps = borne(e.duree / uFin, k.facteurTemps.min, k.facteurTemps.max);
  const duree = uFin * echelleTemps;

  // 6. La caméra : un repère par impact sur une plateforme, l'arrivée au premier contact du sol.
  const tk: number[] = [0];
  const ck: number[] = [e.defilement.debut];
  for (const im of impacts) {
    if (!im.point.plateforme) continue;
    tk.push(im.u);
    ck.push(borne(im.point.y - k.ancrage * vue.h, ck[ck.length - 1], e.defilement.fin));
  }
  tk.push(uAtterrissage);
  ck.push(e.defilement.fin);
  const courbe = courbeMonotone(tk, ck);

  // 7. L'état à l'instant t.
  const uPremier = arcs[0].u1;
  const echelle = (uu: number) => {
    const aller = douce(borne(uu / (uPremier * 0.8)));
    const final = douce(borne((uu - atterrissage.u0) / (atterrissage.u1 - atterrissage.u0)));
    return meler(meler(1, e.echelleVol, aller), e.echelleFin, final);
  };
  const ecrasement = (uu: number) => {
    let ecrase = 0;
    let etire = 0;
    for (const c of chocs) {
      const d = uu - c.u;
      if (d >= 0) {
        const v = d / k.ecrasement.duree;
        if (v < 7) ecrase = Math.max(ecrase, c.force * v * Math.exp(1 - v));
      } else if (d > -k.ecrasement.etirement) {
        etire = Math.max(etire, c.force * (1 + d / k.ecrasement.etirement));
      }
    }
    return { ecrase, etire };
  };
  const etat = (t: number): EtatBouton => {
    const uu = borne(t / echelleTemps, 0, uFin);
    let arc = arcs[arcs.length - 1];
    for (const a of arcs) {
      if (uu < a.u1) {
        arc = a;
        break;
      }
    }
    const tau = uu - arc.u0;
    const s = borne(tau / (arc.u1 - arc.u0));
    const sc = echelle(uu);
    const { ecrase, etire } = ecrasement(uu);
    const sy = sc * (1 - k.ecrasement.force * ecrase + k.ecrasement.force * 0.3 * etire);
    const sx = sc * (1 + k.ecrasement.force * 0.5 * ecrase - k.ecrasement.force * 0.15 * etire);
    const vol = arc.y0 + arc.vy0 * tau + 0.5 * g * tau * tau;
    // Le bouton garde le contact avec ce qu'il touche : sa base ne bouge pas quand il s'écrase.
    const y = vol + (e.h * (sc - sy)) / 2;
    // Sa hauteur au-dessus des deux surfaces, celle qu'il quitte et celle qu'il va toucher :
    // près d'elles, il reste à plat ; l'inclinaison ne vient qu'en l'air.
    const hauteur = Math.min(arc.appui ? arc.y0 + demi - vol : Infinity, arc.yFin + demi - vol);
    const poids = douce(borne((hauteur - 20) / 80));
    const tour = arc.fenetre ? 2 * Math.PI * arc.tours * douce(borne((s - arc.fenetre[0]) / (arc.fenetre[1] - arc.fenetre[0]))) : 0;
    return {
      x: meler(arc.x0, arc.x1, s),
      y,
      angle: arc.a0 + (arc.a1 - arc.a0) * douce(s) + tour + arc.ondulation * Math.sin(Math.PI * s) * poids,
      sx,
      sy,
    };
  };

  return {
    duree,
    etat,
    camera: (t) => courbe(borne(t / echelleTemps, 0, uAtterrissage)),
    rebonds: impacts.map((im) => ({
      t: im.u * echelleTemps,
      x: im.point.x,
      y: im.point.plateforme ? im.point.plateforme.y : im.point.y + (e.h * e.echelleFin) / 2,
      force: im.force,
      plateforme: im.point.plateforme,
    })),
  };
}
