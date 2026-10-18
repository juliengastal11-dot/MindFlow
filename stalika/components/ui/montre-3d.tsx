"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  roueDentee,
  spiral,
  teintes,
  textureAzurage,
  textureGravure,
  textureInscription,
  textureCotes,
  texturePerlage,
  texturesCadran,
  texturesCuir,
} from "@/lib/montre-3d";
import type { PoseMontre } from "@/lib/pose-montre";

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
    sa hauteur, sans dépasser 74 % de sa largeur. */
function Cadrage({ part }: { part?: number }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    const tete = part ? part * Math.min(size.width, size.height) : Math.min(0.6 * size.height, 0.74 * size.width); // en pixels
    const hauteur = (38 * size.height) / tete; // ce que le cadre montre en hauteur, en mm
    c.position.set(0, 0, hauteur / 2 / Math.tan(rad(c.fov) / 2) + 6);
    c.near = 1;
    c.far = 1000;
    c.updateProjectionMatrix();
    invalidate();
  }, [camera, size, part, invalidate]);
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
  const perlage = texturePerlage();
  await respirer();
  const cotes = textureCotes();
  const gravure = textureGravure(t.ombre);
  const inscription = textureInscription("STALIKA", "#3b3a36");
  await respirer();
  return { t, cad, azurage, cuir, perlage, cotes, gravure, inscription };
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
  const ponts = { ponts: MOUVEMENT_3D.ponts.map((p) => pont(p.points, 0.42, p.trous)), roues: MOUVEMENT_3D.roues.map(([, , r, n, b]) => roueDentee(r, n, b, 0.16)) };
  await respirer();
  const mouvement = {
    rochet: roueDentee(MOUVEMENT_3D.rochet[2], MOUVEMENT_3D.rochet[3], 0, 0.26, 0.012),
    roueCouronne: roueDentee(MOUVEMENT_3D.couronne[2], MOUVEMENT_3D.couronne[3], 0, 0.22, 0.02),
    jante: new THREE.TorusGeometry(MOUVEMENT_3D.balancier[2], 0.16, 10, 72),
    bras: new THREE.BoxGeometry(0.22, MOUVEMENT_3D.balancier[2] * 2, 0.12),
    spiral: spiral(),
    rubis: new THREE.CylinderGeometry(0.3, 0.3, 0.12, 20),
    chaton: new THREE.CylinderGeometry(0.62, 0.62, 0.08, 24),
    vis: new THREE.CylinderGeometry(0.46, 0.46, 0.14, 24),
    fente: new THREE.BoxGeometry(0.86, 0.1, 0.1),
    grandeVis: new THREE.CylinderGeometry(1.05, 1.05, 0.2, 32),
    cercle: new THREE.CylinderGeometry(12.92, 12.92, 1.6, 96, 1, true),
    fond: new THREE.CircleGeometry(12.95, 96),
    platine: new THREE.CircleGeometry(12.6, 96),
    gravure: new THREE.RingGeometry(13.9, 17.6, 128),
    inscription: new THREE.PlaneGeometry(5.2, 0.65),
  };
  await respirer();
  return { ...boite, ...cadranEtAiguilles, ...bracelet, ...ponts, ...mouvement };
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

function Piece({ pose, onPret, x, g }: { pose: React.RefObject<PoseMontre>; onPret?: () => void; x: Peinture; g: Formes }) {
  const { invalidate } = useThree();
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
    // le soleillage du rochet et de la roue de couronne : la carte radiale du cadran, recadrée sur chaque roue
    const soleil = (r: number) => {
      const x = cad.brossage.clone();
      x.repeat.set(1 / (2 * r), 1 / (2 * r));
      x.offset.set(0.5, 0.5);
      x.needsUpdate = true;
      return new THREE.MeshPhysicalMaterial({ color: "#dedbd4", metalness: 1, roughness: 0.2, anisotropy: 0.95, anisotropyMap: x, envMapIntensity: 1.3 });
    };
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
      ponts: new THREE.MeshPhysicalMaterial({ color: "#e2dfd8", map: x.cotes, metalness: 1, roughness: 0.3, anisotropy: 0.6, anisotropyRotation: 0.42 + Math.PI / 2, envMapIntensity: 1.3 }),
      rochet: soleil(MOUVEMENT_3D.rochet[2]),
      roueCouronne: soleil(MOUVEMENT_3D.couronne[2]),
      laiton: new THREE.MeshPhysicalMaterial({ color: "#d3a24a", metalness: 1, roughness: 0.24, envMapIntensity: 1.2 }),
      platine: new THREE.MeshPhysicalMaterial({ map: x.perlage, metalness: 0.85, roughness: 0.42, envMapIntensity: 0.9 }),
      rubis: new THREE.MeshPhysicalMaterial({ color: "#b3123c", metalness: 0, roughness: 0.06, clearcoat: 1, emissive: new THREE.Color("#5a0a1e"), emissiveIntensity: 0.4 }),
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
    roues.current.forEach((r, i) => r && (r.rotation.z = rad(p.rouage) * (i % 2 ? -1.6 : 1) * (1 + i * 0.3)));
    if (balancier.current) balancier.current.rotation.z = rad(p.balancier);
    if (premier.current) {
      premier.current = false;
      requestAnimationFrame(() => onPret?.());
    }
  });

  const { roues: rs, rochet, couronne: rc, balancier: bal, rubis, vis } = MOUVEMENT_3D;

  return (
    <group ref={montre}>
      {/* le boîtier, les cornes, la couronne */}
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
      <group ref={gCouronne}>
        <mesh geometry={g.couronne} material={m.or} position={[19.6, 0, 3.1]} />
        <mesh material={m.orBrosse} position={[19.2, 0, 3.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.85, 0.85, 1.2, 24]} />
        </mesh>
      </group>

      {/* le cadran, le compteur des 72 heures en creux, les index */}
      <mesh geometry={g.cadran} material={m.cadran} position={[0, 0, COTE.hauteurCadran]} receiveShadow />
      <mesh geometry={g.compteur} material={m.compteur} position={[COMPTEUR.x, COMPTEUR.y, COTE.hauteurCadran - 0.14]} receiveShadow />
      <mesh geometry={g.paroiCompteur} material={m.cadran} position={[COMPTEUR.x, COMPTEUR.y, COTE.hauteurCadran - 0.07]} rotation={[Math.PI / 2, 0, 0]} />
      {Array.from({ length: 12 }, (_, h) => {
        const a = (h / 12) * Math.PI * 2;
        return (
          <group key={h} rotation={[0, 0, -a]}>
            <mesh geometry={g.index} material={m.index[h]} position={[0, 10.3, COTE.hauteurCadran]} castShadow />
          </group>
        );
      })}
      <mesh ref={arc} geometry={g.arc} position={[0, 0, COTE.hauteurCadran + 0.01]}>
        <meshBasicMaterial color={m.t.arc} side={THREE.DoubleSide} />
      </mesh>

      {/* les aiguilles */}
      <group ref={hCompteur} position={[COMPTEUR.x, COMPTEUR.y, COTE.hauteurCadran - 0.1]}>
        <mesh geometry={g.petite} material={m.or} castShadow />
      </group>
      <mesh material={m.or} position={[COMPTEUR.x, COMPTEUR.y, COTE.hauteurCadran - 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
      </mesh>
      <group ref={hHeures} position={[0, 0, COTE.hauteurCadran + 0.42]}>
        <mesh geometry={g.heures} material={m.laque} castShadow />
      </group>
      <group ref={hMinutes} position={[0, 0, COTE.hauteurCadran + 0.68]}>
        <mesh geometry={g.minutes} material={m.laque} castShadow />
      </group>
      <group ref={hChrono} position={[0, 0, COTE.hauteurCadran + 0.92]}>
        <mesh geometry={g.chrono} material={m.laque} castShadow />
        <mesh position={[0, -2.9, 0.04]} material={m.laque} castShadow>
          <torusGeometry args={[0.38, 0.08, 8, 24]} />
        </mesh>
      </group>
      <mesh material={m.or} position={[0, 0, COTE.hauteurCadran + 0.86]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.62, 24]} />
      </mesh>

      {/* le verre bombé */}
      <mesh geometry={g.verre} material={m.verre} position={[0, 0, COTE.verre - 299]} rotation={[Math.PI / 2, 0, 0]} renderOrder={2} />

      {/* le bracelet */}
      <mesh geometry={g.brinHaut} material={[m.cuir, m.doublure]} />
      <mesh geometry={g.brinBas} material={[m.cuir, m.doublure]} />

      {/* le fond : la gravure, le saphir, et le mouvement (vu par le fond, d'où le miroir en X) */}
      <mesh geometry={g.gravure} material={m.gravure} position={[0, 0, -0.28]} rotation={[0, Math.PI, 0]} />
      <group scale={[-1, 1, 1]}>
        <mesh geometry={g.platine} material={m.platine} position={[0, 0, 0.95]} rotation={[0, Math.PI, 0]} />
        {g.ponts.map((geo, i) => (
          <mesh key={i} geometry={geo} material={m.ponts} position={[0, 0, 0.26]} />
        ))}
        {g.roues.map((geo, i) => (
          <group key={i} position={[rs[i][0], rs[i][1], 0.74]} ref={(r) => void (roues.current[i] = r)}>
            <mesh geometry={geo} material={m.laiton} />
          </group>
        ))}
        <group position={[rochet[0], rochet[1], -0.04]} ref={(r) => void (roues.current[3] = r)}>
          <mesh geometry={g.rochet} material={m.rochet} />
        </group>
        <group position={[rochet[0], rochet[1], -0.16]} rotation={[0, 0, 0.5]}>
          <mesh geometry={g.grandeVis} material={m.visAcier} rotation={[Math.PI / 2, 0, 0]} />
          <mesh material={m.laque} position={[0, 0, -0.1]}>
            <boxGeometry args={[1.8, 0.16, 0.08]} />
          </mesh>
        </group>
        <group position={[rc[0], rc[1], -0.02]} ref={(r) => void (roues.current[4] = r)}>
          <mesh geometry={g.roueCouronne} material={m.roueCouronne} />
        </group>
        <group position={[bal[0], bal[1], 0.5]}>
          <group ref={balancier}>
            <mesh geometry={g.jante} material={m.laiton} />
            {[0, 60, 120].map((a) => (
              <mesh key={a} geometry={g.bras} material={m.laiton} rotation={[0, 0, rad(a)]} />
            ))}
          </group>
          <mesh geometry={g.spiral} material={m.acier} position={[0, 0, -0.12]} />
        </group>
        {rubis.map(([x, y], i) => (
          <group key={`r${i}`} position={[x, y, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh geometry={g.chaton} material={m.acier} />
            <mesh geometry={g.rubis} material={m.rubis} position={[0, -0.03, 0]} />
          </group>
        ))}
        {vis.map(([x, y], i) => (
          <group key={`v${i}`} position={[x, y, 0.2]} rotation={[0, 0, i * 0.7]}>
            <mesh geometry={g.vis} material={m.visAcier} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={g.fente} material={m.laque} position={[0, 0, -0.07]} />
          </group>
        ))}
      </group>
      {/* ce qui n'est pas dans le miroir : l'inscription du pont (lisible par le fond), le fond du boîtier derrière la platine */}
      <mesh geometry={g.inscription} material={m.inscription} position={[6.8, -0.6, 0.15]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={g.fond} material={m.cercle} position={[0, 0, 1.02]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={g.cercle} material={m.cercle} position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={g.fond} material={m.verre} position={[0, 0, COTE.fenetre + 0.03]} rotation={[0, Math.PI, 0]} renderOrder={2} />
    </group>
  );
}

export function Montre3D({ pose, onPret, part, className }: { pose: React.RefObject<PoseMontre>; onPret?: () => void; part?: number; className?: string }) {
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
          <Cadrage part={part} />
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
          <Piece pose={pose} onPret={onPret} x={prepa.x} g={prepa.g} />
          <Prechauffe onFini={rechauffee} />
          <Reveil actif={chaude} />
        </Canvas>
      )}
    </div>
  );
}
