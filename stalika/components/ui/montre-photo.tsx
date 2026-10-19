"use client";

import { useEffect, useRef } from "react";
import { useScene } from "@/components/ui/scene";
import { BOITES_PIECES } from "@/lib/montre-photo-boites";
import {
  AXE_X,
  BASCULE,
  CADRAGES,
  CARRURE,
  ECLATE,
  INCLINAISON,
  OUVERTURE,
  PHOTO_DOS,
  PHOTO_FACE,
  PHOTO_TROIS_QUARTS,
  PIECES_PHOTO,
  TEMPS,
  TRANCHE,
  debutEtape,
  finEtape,
  type Cadrage,
  type IdPiece,
  type PiecePhoto,
} from "@/lib/montre-photo";

/* ---------------------------------------------------------------------------
   La montre en photo qui se fabrique (lib/montre-photo.ts) : une platine aux
   dimensions de la vue éclatée, que la caméra déplace et agrandit ; dessus, les
   pièces détourées, chacune à sa place d'origine, qui glissent sur l'axe jusqu'à
   la carrure ; puis la photo de la montre finie, de trois quarts ; enfin la
   montre en volume qui se retourne : les photos de face et de dos, écartées de
   son épaisseur, reliées par une tranche d'or (CSS 3D). Tout se déduit de la
   progression de la chronologie de la scène : rien n'est tweené, chaque image
   est posée d'après l'instant.
--------------------------------------------------------------------------- */

const borne = (x: number) => Math.min(1, Math.max(0, x));
const fenetre = (p: number, de: number, a: number) => borne((p - de) / (a - de));
const douce = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const sinus = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** La caméra à l'instant `p` : l'échelle (pixels d'écran par pixel de l'éclaté) et la translation de la platine. */
function camera(c: Cadrage, p: number, L: number, H: number) {
  const plans = c.plans;
  let i = 0;
  while (i < plans.length - 2 && p > plans[i + 1].t) i++;
  const A = plans[i];
  const B = plans[i + 1];
  const t = sinus(fenetre(p, A.t, B.t));
  const echelle = (h: number, l: number) => Math.min((0.94 * H) / h, (c.largeurUtile * L) / l);
  // le zoom glisse à vitesse régulière : on interpole son logarithme
  const k = Math.exp(lerp(Math.log(echelle(A.h, A.l)), Math.log(echelle(B.h, B.l)), t));
  const fy = lerp(A.fy, B.fy, t);
  const ay = lerp(A.ay, B.ay, t) * H;
  return { k, tx: c.ax * L - AXE_X * k, ty: ay - fy * k };
}

// la carrure ne bouge pas : tout vient se poser sur elle
type Couche = { id: IdPiece; couche: number; piece?: PiecePhoto };
const DEDANS = PIECES_PHOTO.filter((p) => p.dedans);
const CARRURE_FIXE: Couche = { id: "boitier", couche: 3 };
const AUTOUR: Couche[] = [
  ...PIECES_PHOTO.filter((p) => !p.dedans).map((p): Couche => ({ id: p.id, couche: p.couche, piece: p })),
  CARRURE_FIXE,
].sort((a, b) => a.couche - b.couche);
const COUCHE_DEDANS = 4.5;

/* Ce qui entre dans la carrure n'est visible qu'au-dessus du bord de devant de son ouverture : tout le haut de la
   platine, jusqu'à la moitié basse de l'ellipse de l'ouverture. */
const o = OUVERTURE;
const DECOUPE_DEDANS = `path("M0 0 H${ECLATE.l} V${o.cy} H${o.cx + o.a} A${o.a} ${o.b} 0 0 1 ${o.cx - o.a} ${o.cy} H0 Z")`;

// le centre de la pile au repos, pour l'arrivée (les pièces écartées se resserrent sur le fil)
const CENTRE_PILE = 834;
const ECART_ARRIVEE = 0.1;

/* L'ombre d'une pièce qui se pose, sur ce qu'elle recouvre : elle paraît à l'approche (les `APPROCHE` derniers pixels de
   sa course), se resserre sous elle, et finit en ombre de contact (`contact`), ou s'efface (0). */
const APPROCHE = 70;
const OMBRES: Partial<Record<IdPiece, { force: number; contact: number }>> = {
  mouvement: { force: 0.4, contact: 0 },
  cadran: { force: 0.55, contact: 0.3 },
  aiguilles: { force: 0.55, contact: 0.45 },
  "petite-seconde": { force: 0.5, contact: 0.4 },
  lunette: { force: 0.45, contact: 0.25 },
};

/* Quand la photo de face prend le relais, la pile s'efface par morceaux (fractions de la bascule) : ce que la photo
   recouvre d'abord, puis les bracelets, et la carrure en dernier, dont le flanc reste visible sous la photo qui se
   redresse, comme l'épaisseur d'une vraie montre qui tourne vers nous. */
const EFFACEMENT: Partial<Record<IdPiece, readonly [number, number]>> = {
  boitier: [0.25, 0.66],
  couronne: [0.2, 0.5],
  "bracelet-haut": [0.15, 0.55],
  "barrette-haut": [0.15, 0.55],
  "bracelet-bas": [0.15, 0.55],
  "barrette-bas": [0.15, 0.55],
};
const EFFACEMENT_AUTRES = [0.08, 0.36] as const;

/* La tranche : des bandes posées en cercle, chacune à son angle (0 en haut, dans le sens des aiguilles). */
const BANDES = Array.from({ length: TRANCHE.bandes }, (_, i) => (2 * Math.PI * i) / TRANCHE.bandes);
const LARGEUR_BANDE = ((2 * Math.PI * TRANCHE.rayon) / TRANCHE.bandes) * 1.06;
/* La lumière : une lampe en haut à gauche, devant ; le demi-vecteur vers l'œil donne le reflet. */
const unitaire = (v: number[]) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const LAMPE = unitaire([-0.35, -0.75, 0.56]);
const DEMI = unitaire([LAMPE[0], LAMPE[1], LAMPE[2] + 1]);
const rad = (deg: number) => (deg * Math.PI) / 180;

function Piece({ id, piece }: { id: IdPiece; piece?: PiecePhoto }) {
  const b = BOITES_PIECES[id];
  const [ox, oy] = piece ? piece.origine : [b.x + b.l / 2, b.y + b.h / 2];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-piece={id}
      src={`/montre/pieces/${id}.webp`}
      alt=""
      decoding="async"
      draggable={false}
      className="photo-piece"
      style={{ left: b.x, top: b.y, width: b.l, height: b.h, transformOrigin: `${ox - b.x}px ${oy - b.y}px` }}
    />
  );
}

export function MontrePhoto({ onPret }: { onPret?: () => void }) {
  const scene = useScene();
  const racine = useRef<HTMLDivElement>(null);
  const pret = useRef(onPret);
  pret.current = onPret;

  useEffect(() => {
    const el = racine.current;
    if (!el || !scene) return;
    const platine = el.querySelector<HTMLElement>("[data-platine]")!;
    const fil = el.querySelector<HTMLElement>("[data-fil]")!;
    const eclate = el.querySelector<HTMLElement>("[data-eclate]")!;
    const face = el.querySelector<HTMLElement>('[data-photo="face"]')!;
    const dos = el.querySelector<HTMLElement>('[data-photo="dos"]')!;
    const troisQuarts = el.querySelector<HTMLElement>("[data-trois-quarts]")!;
    const reflet = el.querySelector<HTMLElement>("[data-reflet]")!;
    const volume = el.querySelector<HTMLElement>("[data-volume]")!;
    const bandes = Array.from(el.querySelectorAll<HTMLElement>("[data-bande]"));
    const images = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    const pieces = new Map<IdPiece, HTMLElement>();
    el.querySelectorAll<HTMLElement>("[data-piece]").forEach((n) => pieces.set(n.dataset.piece as IdPiece, n));

    let L = el.clientWidth;
    let H = el.clientHeight;
    const large = window.matchMedia("(min-width: 768px)");
    let progres = 0;

    const poser = (p: number) => {
      progres = p;
      const c = camera(large.matches ? CADRAGES.bureau : CADRAGES.mobile, p, L, H);
      platine.style.transform = `translate3d(${c.tx.toFixed(2)}px, ${c.ty.toFixed(2)}px, 0) scale(${c.k.toFixed(4)})`;
      platine.style.setProperty("--k", c.k.toFixed(4));

      // la montre montée se redresse face à nous : la photo de face prend le relais de la pile
      const qb = douce(fenetre(p, TEMPS.bascule.de, TEMPS.bascule.a));
      const qr = douce(fenetre(p, TEMPS.retournement.de, TEMPS.retournement.a));

      // l'arrivée : les pièces, un peu écartées, se resserrent sur le fil
      const ecart = ECART_ARRIVEE * (1 - douce(fenetre(p, TEMPS.arrivee.de, TEMPS.arrivee.a)));
      for (const [id, n] of pieces) {
        const piece = PIECES_PHOTO.find((x) => x.id === id);
        const b = BOITES_PIECES[id];
        const cy = b.y + b.h / 2;
        let dx = 0;
        let dy = (cy - CENTRE_PILE) * ecart;
        let sx = 1;
        let sy = 1;
        if (piece) {
          const q = douce(fenetre(p, debutEtape(piece), finEtape(piece)));
          dx += (piece.arrivee[0] - piece.origine[0]) * q;
          dy += (piece.arrivee[1] - piece.origine[1]) * q;
          if (piece.echelle) {
            sx = lerp(1, piece.echelle[0], q);
            sy = lerp(1, piece.echelle[1], q);
          }
        }
        n.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;

        // l'ombre de la pièce qui se pose
        const ombre = piece && OMBRES[id];
        if (ombre) {
          const q = douce(fenetre(p, debutEtape(piece), finEtape(piece)));
          const h = (1 - q) * Math.abs(piece.arrivee[1] - piece.origine[1]);
          const t = 1 - h / APPROCHE;
          if (t <= 0 || (q >= 1 && !ombre.contact)) n.style.filter = "";
          else {
            const a = ombre.contact * t + (ombre.force - ombre.contact) * 4 * t * (1 - t);
            n.style.filter = `drop-shadow(0 ${(1.5 + h * 0.35).toFixed(1)}px ${(1.5 + h * 0.25).toFixed(1)}px rgb(0 0 0 / ${a.toFixed(3)}))`;
          }
        }

        // la relève par la photo de face
        const [e0, e1] = EFFACEMENT[id] ?? EFFACEMENT_AUTRES;
        n.style.opacity = (1 - fenetre(qb, e0, e1)).toFixed(3);
      }

      // la photo de trois quarts : couchée comme la pile, elle se relève jusqu'à sa vue ; puis la montre se balance à peine
      const repos = fenetre(p, TEMPS.bascule.a, TEMPS.relais.de);
      const balance = Math.sin(Math.PI * repos);
      const qe = fenetre(p, TEMPS.relais.de, TEMPS.relais.a);
      troisQuarts.style.opacity = (fenetre(qb, 0, 0.3) * (1 - qe)).toFixed(3);
      troisQuarts.style.visibility = qb > 0 && qe < 1 ? "visible" : "hidden";
      troisQuarts.style.transform = `perspective(1800px) rotateX(${(BASCULE * (1 - qb) + 1.2 * balance).toFixed(2)}deg) rotateY(${(-3.5 * balance).toFixed(2)}deg)`;
      // la lumière glisse sur l'or
      const qf = sinus(fenetre(p, TEMPS.reflet.de, TEMPS.reflet.a));
      reflet.style.backgroundPosition = `${(125 - 150 * qf).toFixed(1)}% 0`;
      reflet.style.opacity = qf > 0 && qf < 1 ? "1" : "0";

      /* la montre en volume : elle prend le relais de la photo sous le même angle, se retourne sur son fond (autour de
         l'axe de midi à six heures, la couronne s'en va vers le fond), se pose un peu plus à plat, se balance à peine */
      const fin = fenetre(p, TEMPS.retournement.a, 1);
      const theta = lerp(INCLINAISON, 28, qr);
      const phi = 180 * qr + 5 * Math.sin(Math.PI * fin);
      volume.style.opacity = qe.toFixed(3);
      volume.style.visibility = qe > 0 ? "visible" : "hidden";
      if (qe > 0) {
        volume.style.transform = `rotateX(${theta.toFixed(2)}deg) rotateY(${phi.toFixed(2)}deg)`;
        // de profil, les faces passent dans l'ombre
        const profil = qr > 0 && qr < 1 ? `brightness(${(1 - 0.35 * Math.sin(Math.PI * qr)).toFixed(3)})` : "";
        face.style.filter = profil;
        dos.style.filter = profil;
        // chaque bande de la tranche, éclairée selon son orientation : sa normale, tournée comme la montre
        const ct = Math.cos(rad(theta));
        const st = Math.sin(rad(theta));
        const cp = Math.cos(rad(phi));
        const sp = Math.sin(rad(phi));
        bandes.forEach((b, i) => {
          const sa = Math.sin(BANDES[i]);
          const ca = Math.cos(BANDES[i]);
          const nx = sa * cp;
          const ny = -ca * ct + sa * sp * st;
          const nz = -ca * st - sa * sp * ct;
          if (nz <= 0) return;
          const diffus = Math.max(0, nx * LAMPE[0] + ny * LAMPE[1] + nz * LAMPE[2]);
          const brillant = Math.max(0, nx * DEMI[0] + ny * DEMI[1] + nz * DEMI[2]) ** 18;
          // l'or poli : sombre loin de la lampe, un reflet franc et étroit face à elle
          b.style.setProperty("--o", (0.72 * (1 - diffus) ** 1.3).toFixed(3));
          b.style.setProperty("--h", Math.min(0.9, 1.1 * brillant).toFixed(3));
        });
      }
      eclate.style.visibility = qb >= 0.66 ? "hidden" : "visible";
      fil.style.opacity = (1 - fenetre(p, TEMPS.fil.de, TEMPS.fil.a)).toFixed(3);
    };

    const desabonner = scene.surProgres(poser);
    const ro = new ResizeObserver(() => {
      L = el.clientWidth;
      H = el.clientHeight;
      poser(progres);
    });
    ro.observe(el);
    const changer = () => poser(progres);
    large.addEventListener("change", changer);

    // prête quand toutes les images sont décodées : pas de pièce qui arrive en retard
    let vivant = true;
    Promise.all(images.map((i) => i.decode().catch(() => undefined))).then(() => {
      if (vivant) pret.current?.();
    });

    return () => {
      vivant = false;
      desabonner();
      ro.disconnect();
      large.removeEventListener("change", changer);
    };
  }, [scene]);

  return (
    <div ref={racine} className="photo-scene" aria-hidden="true">
      <div data-platine className="photo-platine" style={{ width: ECLATE.l, height: ECLATE.h }}>
        {/* le fil d'or : l'axe sur lequel les pièces sont enfilées */}
        <div data-fil className="photo-fil" style={{ left: AXE_X }} />
        <div data-eclate className="photo-eclate">
          {AUTOUR.filter((p) => p.couche < COUCHE_DEDANS).map((p) => (
            <Piece key={p.id} id={p.id} piece={p.piece} />
          ))}
          <div className="photo-dedans" style={{ clipPath: DECOUPE_DEDANS }}>
            {DEDANS.map((p) => (
              <Piece key={p.id} id={p.id} piece={p} />
            ))}
          </div>
          {AUTOUR.filter((p) => p.couche > COUCHE_DEDANS).map((p) => (
            <Piece key={p.id} id={p.id} piece={p.piece} />
          ))}
        </div>
        {/* la montre finie, de trois quarts, et la lumière qui glisse sur son or (masquée par la photo elle-même) */}
        <div
          data-trois-quarts
          className="photo-trois-quarts"
          style={{
            left: PHOTO_TROIS_QUARTS.x,
            top: PHOTO_TROIS_QUARTS.y,
            width: PHOTO_TROIS_QUARTS.l,
            height: PHOTO_TROIS_QUARTS.h,
            transformOrigin: `${PHOTO_TROIS_QUARTS.ox}px ${PHOTO_TROIS_QUARTS.oy}px`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/montre/trois-quarts.webp" alt="" decoding="async" draggable={false} />
          <div data-reflet className="photo-reflet" />
        </div>
        {/* la montre en volume : ses deux faces, écartées de son épaisseur, et la tranche d'or entre elles */}
        <div data-volume className="photo-volume" style={{ left: CARRURE.cx, top: CARRURE.cy }}>
          {BANDES.map((a, i) => (
            <div
              key={i}
              data-bande
              className="photo-bande"
              style={{
                width: LARGEUR_BANDE,
                height: TRANCHE.epaisseur,
                left: -LARGEUR_BANDE / 2,
                top: -TRANCHE.epaisseur / 2,
                transform: `rotateZ(${((a * 180) / Math.PI).toFixed(3)}deg) translateY(${-TRANCHE.rayon}px) rotateX(90deg)`,
              }}
            />
          ))}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-photo="face"
            src="/montre/face.webp"
            alt=""
            decoding="async"
            draggable={false}
            className="photo-face"
            style={{
              left: -PHOTO_FACE.ox,
              top: -PHOTO_FACE.oy,
              width: PHOTO_FACE.l,
              height: PHOTO_FACE.h,
              transformOrigin: `${PHOTO_FACE.ox}px ${PHOTO_FACE.oy}px`,
              transform: `translateZ(${TRANCHE.epaisseur / 2}px)`,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-photo="dos"
            src="/montre/dos.webp"
            alt=""
            decoding="async"
            draggable={false}
            className="photo-face"
            style={{
              left: -PHOTO_DOS.ox,
              top: -PHOTO_DOS.oy,
              width: PHOTO_DOS.l,
              height: PHOTO_DOS.h,
              transformOrigin: `${PHOTO_DOS.ox}px ${PHOTO_DOS.oy}px`,
              transform: `rotateY(180deg) translateZ(${TRANCHE.epaisseur / 2}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
