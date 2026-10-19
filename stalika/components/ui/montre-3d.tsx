"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  COMPTEUR,
  COTE,
  MOUVEMENT_3D,
  baton,
  boitier,
  brin,
  corne,
  fond as geoFond,
  couronne as geoCouronne,
  pont,
  roue,
  spiral,
  teintes,
  textureAzurage,
  textureGravure,
  textureInscription,
  textureEtoile,
  textureGrain,
  texturesCadran,
  texturesCuir,
} from "@/lib/montre-3d";
import type { PoseMontre } from "@/lib/pose-montre";
import { PLAN_MONTAGE, hasard } from "@/lib/assemblage";

/* ---------------------------------------------------------------------------
   La montre de la section 04, en vraie 3D (Three.js par react-three-fiber),
   avec son épaisseur : boîtier tourné, cornes, couronne cannelée, cadran
   brossé soleil, index et aiguilles en relief, verre bombé, bracelet épais
   courbé comme autour d'un poignet ; au dos, sous le saphir, un mouvement à
   remontage manuel modélisé d'après la photo envoyée par J (ponts en acier,
   roues en laiton, rochet soleillé, balancier et spiral, rubis). Les pièces
   sont dans `lib/montre-3d.ts`.

   La section la pilote par `pose` : un objet que sa chronologie fait avancer
   (orientation, aiguilles, compteur, couronne, index allumés, retournement…).
   La scène ne se redessine que quand la pose change (`frameloop="demand"` :
   la section appelle `pose.current.redessiner`). Éclairage : un studio de
   boîtes à lumière calculé sur place (`studio`), rien à télécharger.

   La mise en route se fait par tranches, chacune dans un temps mort du
   navigateur, pour ne jamais figer le défilement (2026-10-19 : d'un bloc,
   elle figeait la page près d'une seconde) : les textures (`peindre`), les
   formes (`construire`), puis, la scène montée, la lumière du studio,
   l'envoi des textures à la carte graphique, la compilation des matières en
   tâche de fond (`compileAsync`), et seulement alors la première image.

   Chargée seulement si le navigateur sait faire du WebGL et sans mouvement
   réduit ; la montre dessinée à plat (`Montre`) reste dessous en repli, et
   pendant le chargement (`onPret`). La pose est dans `lib/pose-montre.ts`.
--------------------------------------------------------------------------- */

const rad = THREE.MathUtils.degToRad;
// la vitesse de chaque roue du mouvement, rapportée au rouage : moyenne, troisième, secondes, échappement, rochet, couronne
const RAPPORTS = [0.2, -0.6, 1.6, -4, 0.15, -0.29];

/* ---- La montre qui se fabrique (lib/assemblage.ts) -----------------------------------------------------------------
   Chaque pièce est dans un `Porteur` : un groupe dont la matrice est posée à la main. À sa place, c'est l'identité ; en
   vol, la matrice qui l'amène du fil d'or (où elle repose, couchée, à l'arrière-plan) jusqu'à sa place dans la montre. */

/** Où poser la montre et le fil d'or dans le cadre (en pixels du canvas) : le centre et la taille de la tête, la ligne. */
export type Montage = {
  cadre: (l: number, h: number) => { cx: number; cy: number; tete: number };
  ligne: () => { x0: number; x1: number; y: number } | null;
};

const PorteursContexte = createContext<Map<string, THREE.Group> | null>(null);

function Porteur({ id, children }: { id: string; children: React.ReactNode }) {
  const carte = useContext(PorteursContexte);
  return (
    <group
      name={id}
      matrixAutoUpdate={false}
      ref={(g) => {
        if (!carte) return;
        if (g) carte.set(id, g);
        else carte.delete(id);
      }}
    >
      {children}
    </group>
  );
}

/** Une pièce au repos sur le fil : le centre de son contenu (dans son porteur), et la pose de ce centre dans le monde. */
type Repos = { c: THREE.Vector3; centre: THREE.Vector3; quat: THREE.Quaternion; echelle: THREE.Vector3 };

const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qs = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _pT = new THREE.Vector3();
const _qT = new THREE.Quaternion();
const _sT = new THREE.Vector3();
const _e = new THREE.Euler();
const _boite = new THREE.Box3();
const douce3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const borne01 = (x: number) => Math.min(1, Math.max(0, x));

/** Les sommets du contenu d'un porteur (un sur `pas`), dans son propre repère (le porteur à l'identité), et leur boîte :
    pour coucher la pièce juste sur le fil, par sa vraie forme (une boîte ferait flotter les pièces rondes). */
function formeLocale(porteur: THREE.Group, boite: THREE.Box3, pas = 3) {
  boite.makeEmpty();
  const points: THREE.Vector3[] = [];
  porteur.matrix.identity();
  porteur.updateMatrixWorld(true);
  _m2.copy(porteur.matrixWorld).invert();
  porteur.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = (o.geometry as THREE.BufferGeometry).attributes.position;
    _m.multiplyMatrices(_m2, o.matrixWorld);
    for (let i = 0; i < pos.count; i += pas) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(_m);
      points.push(v);
      boite.expandByPoint(v);
    }
  });
  return points;
}

/* Un studio de photo de montre : une pièce sombre et chaude, de grandes boîtes à lumière autour (chacune regarde la
   montre) ; c'est ce que l'or poli et l'acier reflètent. [forme, intensité, couleur, position, échelle] */
const LUMIERES: [("rect" | "ring"), number, string, [number, number, number], [number, number, number]][] = [
  ["rect", 1.5, "#fff4e2", [0, 3, 10], [10, 5, 1]],
  ["rect", 2.4, "#fff6e8", [0, 10, 2], [16, 6, 1]],
  ["rect", 2.6, "#fff1dc", [-9, 2, 4], [2.5, 14, 1]],
  ["rect", 1.6, "#ffe9c7", [9, -1, 4], [2.5, 14, 1]],
  ["rect", 1.8, "#fff6e6", [0, 1.5, -10], [14, 8, 1]],
  ["rect", 1.4, "#fff1dc", [-8, 0, -6], [2.5, 12, 1]],
  ["rect", 1.2, "#ffe9c7", [8, 2, -6], [2.5, 12, 1]],
  ["rect", 0.6, "#c9a46a", [0, -10, 0], [20, 20, 1]],
  ["ring", 1.1, "#ffffff", [5, 6, 8], [1.4, 1.4, 1.4]],
];

/** La scène du studio, que l'on photographie une fois tout autour (PMREM) pour en faire l'environnement de la montre. */
function studio() {
  const s = new THREE.Scene();
  const fond = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ color: "#1b1915", side: THREE.BackSide }));
  s.add(fond);
  const plan = new THREE.PlaneGeometry(1, 1);
  const anneau = new THREE.RingGeometry(0.25, 0.5, 64);
  for (const [forme, intensite, couleur, position, echelle] of LUMIERES) {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur).multiplyScalar(intensite), side: THREE.DoubleSide, toneMapped: false });
    const boite = new THREE.Mesh(forme === "ring" ? anneau : plan, m);
    boite.position.set(...position);
    boite.scale.set(...echelle);
    boite.lookAt(0, 0, 0);
    s.add(boite);
  }
  return s;
}

/** La caméra cadre la montre : la tête (38 mm) fait `part` de la plus petite dimension du cadre ; par défaut, 60 % de
    sa hauteur, sans dépasser 74 % de sa largeur. Pour la montre qui se fabrique, le cadre couvre tout l'écran et `cadre`
    dit où poser la montre : la vue est décalée pour que son centre tombe là. */
function Cadrage({ part, cadre }: { part?: number; cadre?: Montage["cadre"] }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    const k = cadre?.(size.width, size.height);
    const tete = k ? k.tete : part ? part * Math.min(size.width, size.height) : Math.min(0.6 * size.height, 0.74 * size.width); // en pixels
    const hauteur = (38 * size.height) / tete; // ce que le cadre montre en hauteur, en mm
    c.position.set(0, 0, hauteur / 2 / Math.tan(rad(c.fov) / 2) + 6);
    c.near = 1;
    c.far = k ? 8000 : 1000;
    if (k) c.setViewOffset(size.width, size.height, size.width / 2 - k.cx, size.height / 2 - k.cy, size.width, size.height);
    else c.clearViewOffset();
    c.updateProjectionMatrix();
    invalidate();
  }, [camera, size, part, cadre, invalidate]);
  return null;
}

/** Une pause : le navigateur respire entre deux gros travaux (les textures se peignent sans figer le défilement). */
const respirer = () =>
  new Promise<void>((r) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 16)));

/** Les textures, peintes une à une, chacune dans un temps mort. */
async function peindre(depuis: Element) {
  const t = teintes(depuis);
  await respirer();
  const cad = texturesCadran(t.champagne, t.encre);
  await respirer();
  const azurage = textureAzurage(t.champagne, t.encre);
  await respirer();
  const cuir = texturesCuir();
  await respirer();
  const grain = textureGrain();
  const etoile = textureEtoile();
  await respirer();
  const gravure = textureGravure(t.ombre);
  const inscription = textureInscription("STALIKA", "#3b3a36");
  await respirer();
  return { t, cad, azurage, cuir, grain, etoile, gravure, inscription };
}
type Peinture = Awaited<ReturnType<typeof peindre>>;

/** Les formes, construites par tranches. */
async function construire() {
  const cadran = new THREE.Shape();
  cadran.absarc(0, 0, COTE.cadran, 0, Math.PI * 2, false);
  const trou = new THREE.Path();
  trou.absarc(COMPTEUR.x, COMPTEUR.y, COMPTEUR.rayon, 0, Math.PI * 2, true);
  cadran.holes.push(trou);
  const geoCadran = new THREE.ShapeGeometry(cadran, 96);
  // les coordonnées de texture du disque : de -R..R à 0..1
  const uv = geoCadran.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / (2 * COTE.cadran) + 0.5, uv.getY(i) / (2 * COTE.cadran) + 0.5);
  const boite = { boitier: boitier(), fondBoitier: geoFond(), corne: corne(), couronne: geoCouronne() };
  await respirer();
  const cadranEtAiguilles = {
    cadran: geoCadran,
    compteur: new THREE.CircleGeometry(COMPTEUR.rayon, 64),
    paroiCompteur: new THREE.CylinderGeometry(COMPTEUR.rayon, COMPTEUR.rayon, 0.14, 64, 1, true),
    index: baton(3.6, 0.42, 0.42, 0.18),
    heures: baton(10.2, 0.78, 0.52, 0.12, 1.4),
    minutes: baton(14.2, 0.62, 0.4, 0.12, 1.6),
    chrono: baton(15.0, 0.2, 0.12, 0.08, 3.6),
    petite: baton(3.0, 0.22, 0.14, 0.06, 0.6),
    verre: new THREE.SphereGeometry(299, 128, 12, 0, Math.PI * 2, 0, Math.asin(16.4 / 299)),
    arc: new THREE.RingGeometry(14.5, 14.78, 360, 1, Math.PI / 2, -Math.PI * 2),
  };
  await respirer();
  const bracelet = { brinHaut: brin(1, 2.5), brinBas: brin(-1, 2.9) };
  await respirer();
  const M = MOUVEMENT_3D;
  const ponts = { ponts: M.ponts.map((p) => pont(p.points, 0.5, p.trous)), coq: pont(M.coq, 0.35), raquette: pont(M.raquette, 0.05), ancre: pont(M.ancre, 0.1) };
  await respirer();
  const roues = {
    roues: M.roues.map((w) => roue(w.r, { dents: w.dents, bras: w.bras, e: 0.16 })),
    echappement: roue(M.echappement.r, { dents: M.echappement.dents, bras: 3, e: 0.12, scie: true, dent: 0.32, courbe: 0.25 }),
    balancier: roue(M.balancier.r, { dents: 0, bras: 2, e: 0.3, jante: 0.36, moyeu: 0.42, courbe: 0 }),
  };
  await respirer();
  const mouvement = {
    rochet: roue(M.rochet.r, { dents: M.rochet.dents, bras: 0, e: 0.25, scie: true, dent: 0.22 }),
    roueCouronne: roue(M.couronne.r, { dents: M.couronne.dents, bras: 0, e: 0.2, dent: 0.15 }),
    spiral: spiral(),
    pignon: new THREE.CylinderGeometry(0.4, 0.4, 0.34, 16),
    rubis: new THREE.SphereGeometry(0.26, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    chaton: new THREE.CylinderGeometry(0.58, 0.58, 0.06, 28),
    vis: new THREE.CylinderGeometry(0.52, 0.5, 0.12, 28),
    fente: new THREE.BoxGeometry(0.98, 0.12, 0.06),
    grandeVis: new THREE.CylinderGeometry(1.05, 1.0, 0.16, 32),
    lisere: new THREE.RingGeometry(M.rayon, M.rayon + 0.4, 128),
    cercle: new THREE.CylinderGeometry(12.92, 12.92, 2.1, 96, 1, true),
    fond: new THREE.CircleGeometry(12.95, 96),
    platine: new THREE.CircleGeometry(M.rayon, 96),
    gravure: new THREE.RingGeometry(13.9, 17.6, 128),
    inscription: new THREE.PlaneGeometry(5.2, 0.65),
  };
  await respirer();
  return { ...boite, ...cadranEtAiguilles, ...bracelet, ...ponts, ...roues, ...mouvement };
}
type Formes = Awaited<ReturnType<typeof construire>>;

/** La scène montée, sans encore rien dessiner : la lumière du studio, l'envoi des textures à la carte graphique, puis la
    compilation des matières en tâche de fond (`compileAsync`), chaque étape dans un temps mort. */
function Prechauffe({ onFini }: { onFini: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let vivant = true;
    let env: THREE.WebGLRenderTarget | null = null;
    (async () => {
      await respirer();
      if (!vivant) return;
      const pmrem = new THREE.PMREMGenerator(gl);
      const lumiere = studio();
      env = pmrem.fromScene(lumiere, 0, 0.1, 100, { size: 512 });
      scene.environment = env.texture;
      pmrem.dispose();
      lumiere.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      const textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        for (const mat of [o.material].flat() as Record<string, unknown>[])
          for (const cle of ["map", "bumpMap", "anisotropyMap"]) if (mat[cle] instanceof THREE.Texture) textures.add(mat[cle] as THREE.Texture);
      });
      for (const t of textures) {
        await respirer();
        if (!vivant) return;
        gl.initTexture(t);
      }
      await respirer();
      if (!vivant) return;
      await gl.compileAsync(scene, camera).catch(() => undefined);
      if (vivant) onFini();
    })();
    return () => {
      vivant = false;
      env?.dispose();
    };
  }, [gl, scene, camera, onFini]);
  return null;
}

/** Une fois les matières prêtes, la première image. */
function Reveil({ actif }: { actif: boolean }) {
  const { invalidate } = useThree();
  useEffect(() => {
    if (actif) invalidate();
  }, [actif, invalidate]);
  return null;
}

function Piece({ pose, onPret, x, g, montage }: { pose: React.RefObject<PoseMontre>; onPret?: () => void; x: Peinture; g: Formes; montage?: Montage }) {
  const { invalidate, camera, size } = useThree();
  const porteurs = useRef(new Map<string, THREE.Group>());
  const repos = useRef<Map<string, Repos> | null>(null);
  const montre = useRef<THREE.Group>(null);
  const hHeures = useRef<THREE.Group>(null);
  const hMinutes = useRef<THREE.Group>(null);
  const hChrono = useRef<THREE.Group>(null);
  const hCompteur = useRef<THREE.Group>(null);
  const gCouronne = useRef<THREE.Group>(null);
  const balancier = useRef<THREE.Group>(null);
  const roues = useRef<(THREE.Group | null)[]>([]);
  const arc = useRef<THREE.Mesh>(null);
  const premier = useRef(true);

  const m = useMemo(() => {
    const { t, cad, cuir } = x;
    const or = new THREE.MeshPhysicalMaterial({ color: t.metal, metalness: 1, roughness: 0.12, envMapIntensity: 1.15 });
    const orSatine = or.clone();
    orSatine.roughness = 0.34;
    const orBrosse = or.clone();
    orBrosse.roughness = 0.2;
    // une texture « de disque » (de 0 à 1) recadrée sur une roue, dont les coordonnées sont ses millimètres
    const recadre = (t: THREE.Texture, r: number) => {
      const c = t.clone();
      c.repeat.set(1 / (2 * r), 1 / (2 * r));
      c.offset.set(0.5, 0.5);
      c.needsUpdate = true;
      return c;
    };
    const grainPlatine = x.grain.clone();
    grainPlatine.repeat.set((2 * MOUVEMENT_3D.rayon) / 3, (2 * MOUVEMENT_3D.rayon) / 3);
    grainPlatine.needsUpdate = true;
    // le soleillage de la roue de couronne : la carte radiale du cadran, recadrée
    const soleil = (r: number) =>
      new THREE.MeshPhysicalMaterial({ color: "#dedbd4", metalness: 1, roughness: 0.2, anisotropy: 0.95, anisotropyMap: recadre(cad.brossage, r), envMapIntensity: 1.3 });
    const index = Array.from({ length: 12 }, () => {
      const x = or.clone();
      x.emissive = new THREE.Color("#ffad3d");
      x.emissiveIntensity = 0;
      return x;
    });
    return {
      t,
      or,
      orBrosse,
      orSatine,
      index,
      cadran: new THREE.MeshPhysicalMaterial({ map: cad.couleur, metalness: 0.45, roughness: 0.34, anisotropy: 0.75, anisotropyMap: cad.brossage, envMapIntensity: 0.7 }),
      compteur: new THREE.MeshPhysicalMaterial({ map: x.azurage, metalness: 0.4, roughness: 0.4, envMapIntensity: 0.8 }),
      laque: new THREE.MeshPhysicalMaterial({ color: "#0c0b09", metalness: 0.3, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 }),
      verre: new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: 0.02, transparent: true, opacity: 0.12, envMapIntensity: 2.2, clearcoat: 1, depthWrite: false }),
      cuir: new THREE.MeshPhysicalMaterial({ map: cuir.couleur, bumpMap: cuir.relief, bumpScale: 1, roughness: 0.5, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.32, sheen: 0.3, sheenColor: new THREE.Color("#3a352c") }),
      acier: new THREE.MeshPhysicalMaterial({ color: "#d3d0c8", metalness: 1, roughness: 0.24, envMapIntensity: 1.2 }),
      visAcier: new THREE.MeshPhysicalMaterial({ color: "#d8d5ce", metalness: 1, roughness: 0.36, envMapIntensity: 1.5 }),
      doublure: new THREE.MeshPhysicalMaterial({ color: "#14110d", roughness: 0.62, metalness: 0, sheen: 0.4, sheenColor: new THREE.Color("#4a4136") }),
      // l'acier mat et grenu des ponts et de la platine (la photo de J), plus sombre au fond
      acierMat: new THREE.MeshPhysicalMaterial({ color: "#d2d0c9", map: x.grain, metalness: 0.85, roughness: 0.46, envMapIntensity: 1.3 }),
      // (un disque, dont les coordonnées vont de 0 à 1 : le grain y est resserré pour garder son pas de 3 mm)
      platine: new THREE.MeshPhysicalMaterial({ color: "#a29f98", map: grainPlatine, metalness: 0.8, roughness: 0.58, envMapIntensity: 1.0 }),
      // le rochet : soleillé, l'étoile frappée dessus
      rochet: new THREE.MeshPhysicalMaterial({
        color: "#eeece6",
        map: recadre(x.etoile, MOUVEMENT_3D.rochet.r),
        metalness: 1,
        roughness: 0.22,
        anisotropy: 0.9,
        anisotropyMap: recadre(cad.brossage, MOUVEMENT_3D.rochet.r),
        envMapIntensity: 1.35,
      }),
      roueCouronne: soleil(MOUVEMENT_3D.couronne.r),
      laiton: new THREE.MeshPhysicalMaterial({ color: "#d6a64e", metalness: 1, roughness: 0.3, envMapIntensity: 1.3 }),
      rubis: new THREE.MeshPhysicalMaterial({ color: "#b8164a", metalness: 0, roughness: 0.05, clearcoat: 1, emissive: new THREE.Color("#5a0a24"), emissiveIntensity: 0.45 }),
      gravure: new THREE.MeshBasicMaterial({ map: x.gravure, transparent: true, depthWrite: false, opacity: 0.85 }),
      inscription: new THREE.MeshBasicMaterial({ map: x.inscription, transparent: true, depthWrite: false, opacity: 0.8 }),
      cercle: new THREE.MeshStandardMaterial({ color: "#2a2620", metalness: 0.8, roughness: 0.5, side: THREE.DoubleSide }),
    };
  }, [x]);

  useEffect(() => () => void Object.values(g).forEach((x) => (Array.isArray(x) ? x.forEach((y) => y.dispose()) : x.dispose())), [g]);

  useEffect(() => {
    if (pose.current) pose.current.redessiner = invalidate;
    invalidate();
  }, [pose, invalidate]);

  // le vrac sur le fil se recalcule quand le cadre change
  useEffect(() => {
    repos.current = null;
    invalidate();
  }, [size, montage, invalidate]);

  /** Le vrac : chaque pièce couchée sur le fil d'or, dans un ordre mêlé, assez loin derrière la montre pour que toutes
      tiennent sur la ligne (la perspective les rapetisse ; elles grandissent en volant vers la montre). */
  const coucher = (): Map<string, Repos> | null => {
    const ligne = montage?.ligne();
    if (!ligne) return null;
    const cam = camera as THREE.PerspectiveCamera;
    cam.updateMatrixWorld();
    const surPlan = (px: number, py: number, z: number) => {
      _v.set((px / size.width) * 2 - 1, -(py / size.height) * 2 + 1, 0.5).unproject(cam);
      _v2.copy(_v).sub(cam.position).normalize();
      const t = (z - cam.position.z) / _v2.z;
      return cam.position.clone().addScaledVector(_v2, t);
    };
    const alea = hasard(19);
    type Fiche = { id: string; c: THREE.Vector3; quat: THREE.Quaternion; echelle: THREE.Vector3; large: number; bas: number; prof: number };
    const fiches: Fiche[] = [];
    for (const piece of PLAN_MONTAGE) {
      const porteur = porteurs.current.get(piece.id);
      if (!porteur?.parent) continue;
      const points = formeLocale(porteur, _boite);
      const b = _boite;
      if (b.isEmpty()) continue;
      const c = b.getCenter(new THREE.Vector3());
      // couchée : la face voulue vers nous, penchée en arrière, tournée au hasard dans son plan
      const miroir = porteur.parent.matrixWorld.determinant() < 0;
      const echelle = new THREE.Vector3(miroir ? -1 : 1, 1, 1);
      const quat = new THREE.Quaternion().setFromEuler(_e.set(-THREE.MathUtils.degToRad(18 + alea() * 26), THREE.MathUtils.degToRad((alea() - 0.5) * 40), 0, "XYZ"));
      if (piece.face < 0) quat.multiply(_q.setFromAxisAngle(_v.set(0, 1, 0), Math.PI));
      quat.multiply(_q.setFromAxisAngle(_v.set(0, 0, 1), piece.couche ? Math.PI / 2 + (alea() - 0.5) * 0.3 : alea() * Math.PI * 2));
      // son encombrement couché : ses sommets, centrés, tournés
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
      for (const pt of points) {
        _v.copy(pt).sub(c).multiply(echelle).applyQuaternion(quat);
        x0 = Math.min(x0, _v.x);
        x1 = Math.max(x1, _v.x);
        y0 = Math.min(y0, _v.y);
      }
      fiches.push({ id: piece.id, c, quat, echelle, large: x1 - x0, bas: y0, prof: (alea() - 0.5) * 14 });
    }
    // le vrac : un ordre mêlé
    for (let i = fiches.length - 1; i > 0; i--) {
      const j = Math.floor(alea() * (i + 1));
      [fiches[i], fiches[j]] = [fiches[j], fiches[i]];
    }
    const pas = (f: Fiche) => Math.max(1.5, f.large * 0.62);
    const longueur = fiches.reduce((t, f) => t + pas(f), 0);
    // la profondeur du fil : là où la ligne de l'écran mesure ce qu'il faut de millimètres
    const a0 = surPlan(ligne.x0, ligne.y, 0);
    const a1 = surPlan(ligne.x1, ligne.y, 0);
    const l0 = a0.distanceTo(a1);
    const camZ = cam.position.z;
    const z = Math.min(-40, Math.max(-6000, camZ - (longueur * camZ) / Math.max(1, l0)));
    const g0 = surPlan(ligne.x0, ligne.y, z);
    const g1 = surPlan(ligne.x1, ligne.y, z);
    const echelleLigne = g0.distanceTo(g1) / longueur;
    const carte = new Map<string, Repos>();
    let curseur = 0;
    for (const f of fiches) {
      const t = (curseur + pas(f) / 2) * echelleLigne;
      curseur += pas(f);
      const centre = new THREE.Vector3().lerpVectors(g0, g1, t / g0.distanceTo(g1));
      centre.y -= f.bas;
      centre.z += f.prof;
      carte.set(f.id, { c: f.c, centre, quat: f.quat, echelle: f.echelle });
    }
    return carte;
  };

  /** Chaque pièce à sa place dans le vol : du fil d'or (0) à sa place (1), sur une courbe qui monte, avec un léger
      tassement à l'arrivée ; les vis se vissent. */
  const voler = (p: PoseMontre) => {
    const montreG = montre.current;
    if (!montreG) return;
    montreG.updateMatrixWorld(true);
    if (!repos.current) repos.current = coucher();
    const carte = repos.current;
    if (!carte) return;
    for (const piece of PLAN_MONTAGE) {
      const porteur = porteurs.current.get(piece.id);
      const r = carte.get(piece.id);
      const parent = porteur?.parent;
      if (!porteur || !r || !parent) continue;
      const v = p.vols[piece.id] ?? 1;
      if (v >= 1) {
        porteur.matrix.identity();
        porteur.matrixWorldNeedsUpdate = true;
        continue;
      }
      // l'arrivée : le centre du contenu, à sa place
      parent.matrixWorld.decompose(_pT, _qT, _sT);
      const cible = _v.copy(r.c).applyMatrix4(parent.matrixWorld);
      const e = douce3(v);
      // la courbe : du repos à la place, en passant au-dessus
      const haut = Math.max(8, r.centre.distanceTo(cible) * 0.22);
      const cx = (r.centre.x + cible.x) / 2;
      const cy = Math.max(r.centre.y, cible.y) + haut;
      const cz = (r.centre.z + cible.z) / 2;
      const u = 1 - e;
      const pos = _v2.set(u * u * r.centre.x + 2 * u * e * cx + e * e * cible.x, u * u * r.centre.y + 2 * u * e * cy + e * e * cible.y, u * u * r.centre.z + 2 * u * e * cz + e * e * cible.z);
      // le tassement : un rien plus loin que sa place, puis il s'y pose
      const tasse = Math.sin(Math.PI * borne01((v - 0.84) / 0.16)) * 0.35;
      // (vers l'intérieur de la montre : -Z pour une pièce posée par le cadran, +Z pour une pièce du mouvement)
      if (tasse > 0) pos.add(_v.set(0, 0, -1).applyQuaternion(_qT).multiplyScalar(tasse * piece.face));
      _q.copy(r.quat).slerp(_qT, douce3(borne01(v / 0.86)));
      if (piece.vis) {
        const k = borne01((v - 0.6) / 0.4);
        _q.multiply(_qs.setFromAxisAngle(_v.set(0, 0, 1), (1 - k) * Math.PI * 4));
      }
      _s.lerpVectors(r.echelle, _sT, e);
      _m.compose(pos, _q, _s).multiply(_m2.makeTranslation(-r.c.x, -r.c.y, -r.c.z));
      porteur.matrix.copy(_m2.copy(parent.matrixWorld).invert()).multiply(_m);
      porteur.matrixWorldNeedsUpdate = true;
    }
  };

  useFrame(() => {
    const p = pose.current;
    if (!p || !montre.current) return;
    montre.current.rotation.set(rad(p.rx), rad(p.ry), rad(p.rz));
    montre.current.scale.setScalar(p.echelle);
    hHeures.current?.rotation.set(0, 0, -rad(p.heures));
    hMinutes.current?.rotation.set(0, 0, -rad(p.minutes));
    hChrono.current?.rotation.set(0, 0, -rad(p.chrono));
    hCompteur.current?.rotation.set(0, 0, -rad(p.compteur));
    if (gCouronne.current) gCouronne.current.position.x = -0.55 * p.couronne;
    m.index.forEach((x, i) => (x.emissiveIntensity = 0.55 * (p.allumes[i] ?? 0)));
    // l'arc qui suit le chrono : la part de l'anneau dessinée
    const a = arc.current;
    if (a) a.geometry.setDrawRange(0, Math.round(((((p.chrono % 360) + 360) % 360) || (p.chrono > 0 ? 360 : 0)) * 6));
    // le rouage : chaque roue tourne en sens inverse de la précédente, et plus vite ; le rochet et la roue de couronne, à
    // peine (on remonte)
    roues.current.forEach((r, i) => r && (r.rotation.z = rad(p.rouage) * RAPPORTS[i]));
    if (balancier.current) balancier.current.rotation.z = rad(p.balancier);
    if (montage) voler(p);
    if (premier.current) {
      premier.current = false;
      requestAnimationFrame(() => onPret?.());
    }
  });

  const mv = MOUVEMENT_3D;

  return (
    <PorteursContexte.Provider value={porteurs.current}>
      <group ref={montre}>
        {/* le boîtier : la carrure, la lunette, le fond gravé et son saphir, les cornes */}
        <Porteur id="boitier">
          <mesh geometry={g.boitier} material={m.or} castShadow receiveShadow />
          <mesh geometry={g.fondBoitier} material={m.orSatine} />
          {[
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
          ].map(([sx, sy]) => (
            <mesh key={`${sx}${sy}`} geometry={g.corne} material={m.orBrosse} position={[sx * 11.55, 0, 0]} scale={[1, sy, 1]} castShadow />
          ))}
          <mesh geometry={g.gravure} material={m.gravure} position={[0, 0, -0.28]} rotation={[0, Math.PI, 0]} />
          <mesh geometry={g.fond} material={m.cercle} position={[0, 0, 1.45]} rotation={[0, Math.PI, 0]} />
          <mesh geometry={g.cercle} material={m.cercle} position={[0, 0, 0.47]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={g.fond} material={m.verre} position={[0, 0, COTE.fenetre + 0.03]} rotation={[0, Math.PI, 0]} renderOrder={2} />
        </Porteur>
        <Porteur id="couronne">
          <group ref={gCouronne}>
            <mesh geometry={g.couronne} material={m.or} position={[19.6, 0, 3.1]} />
            <mesh material={m.orBrosse} position={[19.2, 0, 3.1]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.85, 0.85, 1.2, 24]} />
            </mesh>
          </group>
        </Porteur>

        {/* le cadran, le compteur des 72 heures en creux, l'arc du chrono ; les index */}
        <Porteur id="cadran">
          <mesh geometry={g.cadran} material={m.cadran} position={[0, 0, COTE.hauteurCadran]} receiveShadow />
          <mesh geometry={g.compteur} material={m.compteur} position={[COMPTEUR.x, COMPTEUR.y, COTE.hauteurCadran - 0.14]} receiveShadow />
          <mesh geometry={g.paroiCompteur} material={m.cadran} position={[COMPTEUR.x, COMPTEUR.y, COTE.hauteurCadran - 0.07]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh ref={arc} geometry={g.arc} position={[0, 0, COTE.hauteurCadran + 0.01]}>
            <meshBasicMaterial color={m.t.arc} side={THREE.DoubleSide} />
          </mesh>
          <mesh material={m.or} position={[COMPTEUR.x, COMPTEUR.y, COTE.hauteurCadran - 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
          </mesh>
        </Porteur>
        {Array.from({ length: 12 }, (_, h) => {
          const a = (h / 12) * Math.PI * 2;
          return (
            <Porteur key={h} id={`index-${h}`}>
              <group rotation={[0, 0, -a]}>
                <mesh geometry={g.index} material={m.index[h]} position={[0, 10.3, COTE.hauteurCadran]} castShadow />
              </group>
            </Porteur>
          );
        })}

        {/* les aiguilles */}
        <Porteur id="aiguille-petite">
          <group ref={hCompteur} position={[COMPTEUR.x, COMPTEUR.y, COTE.hauteurCadran - 0.1]}>
            <mesh geometry={g.petite} material={m.or} castShadow />
          </group>
        </Porteur>
        <Porteur id="aiguille-heures">
          <group ref={hHeures} position={[0, 0, COTE.hauteurCadran + 0.42]}>
            <mesh geometry={g.heures} material={m.laque} castShadow />
          </group>
        </Porteur>
        <Porteur id="aiguille-minutes">
          <group ref={hMinutes} position={[0, 0, COTE.hauteurCadran + 0.68]}>
            <mesh geometry={g.minutes} material={m.laque} castShadow />
          </group>
        </Porteur>
        <Porteur id="aiguille-chrono">
          <group ref={hChrono} position={[0, 0, COTE.hauteurCadran + 0.92]}>
            <mesh geometry={g.chrono} material={m.laque} castShadow />
            <mesh position={[0, -2.9, 0.04]} material={m.laque} castShadow>
              <torusGeometry args={[0.38, 0.08, 8, 24]} />
            </mesh>
          </group>
        </Porteur>
        <Porteur id="chapeau">
          <mesh material={m.or} position={[0, 0, COTE.hauteurCadran + 0.86]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.62, 0.62, 24]} />
          </mesh>
        </Porteur>

        {/* le verre bombé */}
        <Porteur id="verre">
          <mesh geometry={g.verre} material={m.verre} position={[0, 0, COTE.verre - 299]} rotation={[Math.PI / 2, 0, 0]} renderOrder={2} />
        </Porteur>

        {/* le bracelet */}
        <Porteur id="brin-haut">
          <mesh geometry={g.brinHaut} material={[m.cuir, m.doublure]} />
        </Porteur>
        <Porteur id="brin-bas">
          <mesh geometry={g.brinBas} material={[m.cuir, m.doublure]} />
        </Porteur>

        {/* le mouvement d'après la photo de J (vu par le fond, d'où le miroir en X), étagé du rochet, tout près du saphir,
            jusqu'à la platine */}
        <group scale={[-1, 1, 1]}>
          <Porteur id="platine">
            <mesh geometry={g.platine} material={m.platine} position={[0, 0, 1.35]} rotation={[0, Math.PI, 0]} />
            <mesh geometry={g.lisere} material={m.orBrosse} position={[0, 0, 0.44]} rotation={[0, Math.PI, 0]} />
          </Porteur>
          {g.ponts.map((geo, i) => (
            <Porteur key={i} id={`pont-${i}`}>
              <mesh geometry={geo} material={m.acierMat} position={[0, 0, 0.42]} />
              {/* l'inscription du pont du haut : remise à l'endroit (le miroir du mouvement l'aurait retournée) */}
              {i === 2 && (
                <group position={[-1.0, 8.7, 0.35]} scale={[-1, 1, 1]}>
                  <mesh geometry={g.inscription} material={m.inscription} rotation={[0, Math.PI, 0]} />
                </group>
              )}
            </Porteur>
          ))}
          {/* le coq est vissé au bord ; la raquette posée dessus */}
          <Porteur id="coq">
            <mesh geometry={g.coq} material={m.acierMat} position={[0, 0, 0.2]} />
            <mesh geometry={g.raquette} material={m.acier} position={[0, 0, 0.06]} />
          </Porteur>
          <Porteur id="ancre">
            <mesh geometry={g.ancre} material={m.acier} position={[0, 0, 0.98]} />
          </Porteur>
          {mv.roues.map((w, i) => (
            <Porteur key={w.nom} id={`roue-${i}`}>
              <group position={[w.x, w.y, w.z]} ref={(r) => void (roues.current[i] = r)}>
                <mesh geometry={g.roues[i]} material={m.laiton} />
                <mesh geometry={g.pignon} material={m.acier} position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} />
              </group>
            </Porteur>
          ))}
          <Porteur id="echappement">
            <group position={[mv.echappement.x, mv.echappement.y, mv.echappement.z]} ref={(r) => void (roues.current[3] = r)}>
              <mesh geometry={g.echappement} material={m.laiton} />
            </group>
          </Porteur>
          <Porteur id="rochet">
            <group position={[mv.rochet.x, mv.rochet.y, mv.rochet.z]} ref={(r) => void (roues.current[4] = r)}>
              <mesh geometry={g.rochet} material={m.rochet} />
              <group position={[0, 0, -0.08]} rotation={[0, 0, 0.5]}>
                <mesh geometry={g.grandeVis} material={m.visAcier} rotation={[Math.PI / 2, 0, 0]} />
                <mesh geometry={g.fente} material={m.laque} position={[0, 0, -0.08]} scale={[1.8, 1.2, 1]} />
              </group>
            </group>
          </Porteur>
          <Porteur id="roue-couronne">
            <group position={[mv.couronne.x, mv.couronne.y, mv.couronne.z]} ref={(r) => void (roues.current[5] = r)}>
              <mesh geometry={g.roueCouronne} material={m.roueCouronne} />
              <mesh geometry={g.vis} material={m.visAcier} position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]} />
              <mesh geometry={g.fente} material={m.laque} position={[0, 0, -0.12]} />
            </group>
          </Porteur>
          <Porteur id="balancier">
            <group position={[mv.balancier.x, mv.balancier.y, mv.balancier.z]}>
              <group ref={balancier}>
                <mesh geometry={g.balancier} material={m.laiton} />
              </group>
              <mesh geometry={g.spiral} material={m.acier} position={[0, 0, -0.05]} />
            </group>
          </Porteur>
          {mv.rubis.map(([x, y, z], i) => (
            <Porteur key={`r${i}`} id={`rubis-${i}`}>
              <group position={[x, y, z]}>
                <mesh geometry={g.chaton} material={m.orBrosse} rotation={[Math.PI / 2, 0, 0]} />
                <mesh geometry={g.rubis} material={m.rubis} position={[0, 0, -0.03]} rotation={[-Math.PI / 2, 0, 0]} />
              </group>
            </Porteur>
          ))}
          {mv.vis.map(([x, y, z], i) => (
            <Porteur key={`v${i}`} id={`vis-${i}`}>
              <group position={[x, y, z]} rotation={[0, 0, i * 0.7]}>
                <mesh geometry={g.vis} material={m.visAcier} rotation={[Math.PI / 2, 0, 0]} />
                <mesh geometry={g.fente} material={m.laque} position={[0, 0, -0.06]} />
              </group>
            </Porteur>
          ))}
        </group>
      </group>
    </PorteursContexte.Provider>
  );
}

export function Montre3D({
  pose,
  onPret,
  part,
  className,
  montage,
}: {
  pose: React.RefObject<PoseMontre>;
  onPret?: () => void;
  part?: number;
  className?: string;
  montage?: Montage;
}) {
  const boite = useRef<HTMLDivElement>(null);
  const [prepa, setPrepa] = useState<{ x: Peinture; g: Formes } | null>(null);
  const [chaude, setChaude] = useState(false);
  const rechauffee = useCallback(() => setChaude(true), []);
  // le cadran s'écrit avec la police du site : on attend qu'elle soit là, puis on peint les textures et on construit les
  // formes sans se presser
  useEffect(() => {
    let vivant = true;
    (async () => {
      await document.fonts.ready;
      if (!vivant || !boite.current) return;
      const x = await peindre(boite.current);
      if (!vivant) return;
      const g = await construire();
      if (vivant) setPrepa({ x, g });
    })();
    return () => {
      vivant = false;
    };
  }, []);
  return (
    <div ref={boite} className={className ?? "absolute inset-0"}>
      {prepa && (
        <Canvas
          frameloop={chaude ? "demand" : "never"}
          shadows="percentage"
          dpr={[1, 2]}
          camera={{ fov: 24, position: [0, 0, 150] }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          aria-hidden="true"
        >
          <Cadrage part={part} cadre={montage?.cadre} />
          <directionalLight
            position={[-38, 34, 52]}
            intensity={1.7}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.03}
            shadow-radius={4}
            shadow-camera-left={-24}
            shadow-camera-right={24}
            shadow-camera-top={24}
            shadow-camera-bottom={-24}
            shadow-camera-near={20}
            shadow-camera-far={160}
          />
          <Piece pose={pose} onPret={onPret} x={prepa.x} g={prepa.g} montage={montage} />
          <Prechauffe onFini={rechauffee} />
          <Reveil actif={chaude} />
        </Canvas>
      )}
    </div>
  );
}
