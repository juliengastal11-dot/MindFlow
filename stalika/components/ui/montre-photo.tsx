"use client";

import { useEffect, useRef } from "react";
import { useScene } from "@/components/ui/scene";
import { BOITES_PIECES } from "@/lib/montre-photo-boites";
import { RELEVE } from "@/lib/montre-photo-releve";
import { creerMorphing, lireDeplacements } from "@/lib/morphing";
import {
  AXE_X,
  BORD_DEVANT,
  CADRAGES,
  ECLATE,
  HAUT_TROU,
  INTERIEUR,
  OUVERTURE,
  PHOTO_TROIS_QUARTS,
  PIECES_PHOTO,
  TEMPS,
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
   la carrure. La montre finie se relève jusqu'à la photo de trois quarts par un
   morphing en WebGL (lib/morphing.ts, lib/montre-photo-releve.ts) : la pile,
   telle qu'elle est à l'écran, se déforme vers la photo, sans fondu visible.
   Tout se déduit de la progression de la chronologie de la scène : rien n'est
   tweené, chaque image est posée d'après l'instant.
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
const MOUVEMENT_PHOTO = PIECES_PHOTO.find((p) => p.id === "mouvement")!;

/* Ce qui entre dans la carrure ne se voit que dans son trou : au-dessus du bord de devant de l'ouverture (`BORD_DEVANT`),
   au-dessous d'une ligne tirée entre le haut et le bas de la paroi intérieure du fond (`OUVERTURE`, `HAUT_TROU`), selon sa
   profondeur `f` (0 : à ras du bord, 1 : tout au fond). Le mouvement, enfoncé, laisse voir la paroi au-dessus de lui ; le
   cadran, posé haut, presque pas. */
const o = OUVERTURE;
const decoupe = (f: number) => {
  const fond = BORD_DEVANT.map(([x, yb], i) => {
    const t = HAUT_TROU[i][1];
    // la carrure est pleine à cette abscisse : rien ne se voit au travers
    if (t >= yb) return [x, yb] as const;
    const a = o.cy - o.b * Math.sqrt(Math.max(0, 1 - ((x - o.cx) / o.a) ** 2));
    return [x, Math.min(yb, a + f * (t - a))] as const;
  });
  const aller = fond.map(([x, y]) => `L${x} ${y.toFixed(1)}`).join(" ");
  const retour = [...BORD_DEVANT].reverse().map(([x, y]) => `L${x} ${y}`).join(" ");
  return `path("M${fond[0][0]} ${fond[0][1]} ${aller} ${retour} Z")`;
};
const DECOUPE_MOUVEMENT = decoupe(0.62);
const DECOUPE_CADRAN = decoupe(0.1);

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

const ellipse = (e: { cx: number; cy: number; a: number; b: number }) => ({ left: e.cx - e.a, top: e.cy - e.b, width: 2 * e.a, height: 2 * e.b });

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
    const interieur = el.querySelector<HTMLElement>("[data-interieur]")!;
    const ombreFond = el.querySelector<HTMLElement>("[data-ombre-fond]")!;
    const toile = el.querySelector<HTMLCanvasElement>("[data-releve]")!;
    const troisQuarts = el.querySelector<HTMLElement>("[data-trois-quarts]")!;
    const reflet = el.querySelector<HTMLElement>("[data-reflet]")!;
    const images = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    const pieces = new Map<IdPiece, HTMLElement>();
    el.querySelectorAll<HTMLElement>("[data-piece]").forEach((n) => pieces.set(n.dataset.piece as IdPiece, n));

    let L = el.clientWidth;
    let H = el.clientHeight;
    const large = window.matchMedia("(min-width: 768px)");
    let progres = 0;
    // le morphing, prêt quand ses deux images le sont ; sans WebGL, la pile passe à la photo en fondu
    let morphing: ReturnType<typeof creerMorphing> = null;

    const poser = (p: number) => {
      progres = p;
      const c = camera(large.matches ? CADRAGES.bureau : CADRAGES.mobile, p, L, H);
      platine.style.transform = `translate3d(${c.tx.toFixed(2)}px, ${c.ty.toFixed(2)}px, 0) scale(${c.k.toFixed(4)})`;
      platine.style.setProperty("--k", c.k.toFixed(4));

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
      }

      // le fond de la carrure, sombre, et l'ombre de son bord sur le mouvement : quand le mouvement s'y pose
      const qm = douce(fenetre(p, debutEtape(MOUVEMENT_PHOTO), finEtape(MOUVEMENT_PHOTO)));
      const fond = fenetre(qm, 0.7, 1);
      interieur.style.opacity = fond.toFixed(3);
      ombreFond.style.opacity = fond.toFixed(3);

      // la montre finie se relève : la pile, puis le morphing, puis la photo de trois quarts
      const qr = fenetre(p, TEMPS.releve.de, TEMPS.releve.a);
      const enCours = qr > 0 && qr < 1;
      if (morphing) {
        eclate.style.visibility = qr > 0 ? "hidden" : "visible";
        eclate.style.opacity = "1";
        toile.style.visibility = enCours ? "visible" : "hidden";
        if (enCours) morphing.dessiner(sinus(qr), sinus(fenetre(qr, 0.12, 0.88)));
        troisQuarts.style.opacity = qr >= 1 ? "1" : "0";
      } else {
        // sans WebGL : la pile s'efface sous la photo
        toile.style.visibility = "hidden";
        eclate.style.visibility = qr >= 1 ? "hidden" : "visible";
        eclate.style.opacity = (1 - qr).toFixed(3);
        troisQuarts.style.opacity = qr.toFixed(3);
      }
      // la lumière glisse sur l'or
      const qf = sinus(fenetre(p, TEMPS.reflet.de, TEMPS.reflet.a));
      reflet.style.backgroundPosition = `${(125 - 150 * qf).toFixed(1)}% 0`;
      reflet.style.opacity = qf > 0 && qf < 1 ? "1" : "0";
      fil.style.opacity = (1 - fenetre(p, TEMPS.fil.de, TEMPS.fil.a)).toFixed(3);
    };

    /* le tampon de la toile : aussi fin que la montre à l'écran à la fin de la relève (la caméra s'en approche pendant
       qu'elle se relève), sans dépasser trois pixels par pixel d'éclaté */
    const finesse = () => {
      const fin = camera(large.matches ? CADRAGES.bureau : CADRAGES.mobile, TEMPS.releve.a, L, H);
      morphing?.finesse(Math.min(3, (window.devicePixelRatio || 1) * fin.k));
    };

    const desabonner = scene.surProgres(poser);
    const ro = new ResizeObserver(() => {
      L = el.clientWidth;
      H = el.clientHeight;
      finesse();
      poser(progres);
    });
    ro.observe(el);
    const changer = () => {
      finesse();
      poser(progres);
    };
    large.addEventListener("change", changer);

    // prête quand toutes les images sont décodées (pas de pièce qui arrive en retard), et la grille du morphing lue
    let vivant = true;
    const grille = lireDeplacements(RELEVE.grille.fichier).catch(() => null);
    // la mise en route du WebGL (textures, mipmaps) attend un moment calme, pour ne pas faire sauter le défilement
    const auCalme = (f: () => void) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(f, { timeout: 1200 });
      else setTimeout(f, 60);
    };
    Promise.all([grille, ...images.map((i) => i.decode().catch(() => undefined))]).then(([deplacements]) =>
      auCalme(() => {
        if (!vivant) return;
        const pile = el.querySelector<HTMLImageElement>("[data-pile]");
        const photo = el.querySelector<HTMLImageElement>("[data-trois-quarts] img");
        if (pile && photo && deplacements instanceof Float32Array) {
          try {
            morphing = creerMorphing(toile, RELEVE.zone, { image: pile, zone: RELEVE.pile }, { image: photo, zone: PHOTO_TROIS_QUARTS }, {
              nx: RELEVE.grille.nx,
              ny: RELEVE.grille.ny,
              deplacements,
            });
          } catch {
            morphing = null;
          }
          finesse();
        }
        poser(progres);
        pret.current?.();
      }),
    );

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
          {AUTOUR.filter((p) => p.couche < 3).map((p) => (
            <Piece key={p.id} id={p.id} piece={p.piece} />
          ))}
          {/* le fond de la carrure, sombre, vu par les jours une fois le mouvement posé */}
          <div data-interieur className="photo-interieur" style={ellipse(INTERIEUR)} />
          {AUTOUR.filter((p) => p.couche >= 3 && p.couche < COUCHE_DEDANS).map((p) => (
            <Piece key={p.id} id={p.id} piece={p.piece} />
          ))}
          <div className="photo-dedans" style={{ clipPath: DECOUPE_MOUVEMENT }}>
            <Piece id={MOUVEMENT_PHOTO.id} piece={MOUVEMENT_PHOTO} />
            {/* le bord de la carrure jette son ombre sur le mouvement, qui paraît au fond */}
            <div data-ombre-fond className="photo-ombre-fond" style={ellipse(OUVERTURE)} />
          </div>
          <div className="photo-dedans" style={{ clipPath: DECOUPE_CADRAN }}>
            {DEDANS.filter((p) => p.id !== MOUVEMENT_PHOTO.id).map((p) => (
              <Piece key={p.id} id={p.id} piece={p} />
            ))}
          </div>
          {AUTOUR.filter((p) => p.couche > COUCHE_DEDANS).map((p) => (
            <Piece key={p.id} id={p.id} piece={p.piece} />
          ))}
        </div>
        {/* la montre qui se relève : la pile (photographiée telle qu'à l'écran) se déforme jusqu'à la photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-pile src="/montre/releve-pile.webp" alt="" decoding="async" className="photo-pile" />
        <canvas
          data-releve
          className="photo-releve"
          style={{ left: RELEVE.zone.x, top: RELEVE.zone.y, width: RELEVE.zone.l, height: RELEVE.zone.h }}
        />
        {/* la montre finie, de trois quarts, et la lumière qui glisse sur son or (découpée par la photo elle-même) */}
        <div
          data-trois-quarts
          className="photo-trois-quarts"
          style={{ left: PHOTO_TROIS_QUARTS.x, top: PHOTO_TROIS_QUARTS.y, width: PHOTO_TROIS_QUARTS.l, height: PHOTO_TROIS_QUARTS.h }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/montre/trois-quarts.webp" alt="" decoding="async" draggable={false} />
          <div data-reflet className="photo-reflet" />
        </div>
      </div>
    </div>
  );
}
