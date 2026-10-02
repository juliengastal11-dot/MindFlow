"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import type { CoinsEcran } from "@/lib/plongee-ecran";

/* ---------------------------------------------------------------------------
   Plongée : à la fin du ciel, on entre dans l'écran de l'ordinateur.

   Structure voulue par J : un seul plan du hero jusqu'ici (`Ciel`), dont
   l'heure change au défilement ; la lumière dorée du hero revenue à la fin
   mène au zoom dans l'ordinateur et au questionnaire. La plongée vit donc à l'intérieur de `Ciel`, après ses
   sections : son cadre se pose exactement sur celui du ciel, qui reste en
   place derrière. Une suite d'images prend le relais, avancée au rythme du
   défilement : on s'approche du personnage, on passe derrière son épaule, on
   entre dans l'écran, dont le fond d'écran (le logo) remplit le cadre. Puis
   une fenêtre s'ouvre, comme sur un Mac, avec l'effet de « feuille »
   d'iPhone voulu par J : elle monte du bas, et le fond recule un peu,
   s'arrondit et s'assombrit derrière elle (`fenetre`, la discussion). Au
   bout du défilement, tout reprend sa place dans la page : la fenêtre
   défile avec elle, comme une section.

   Deux leçons tirées de la première version du film :
   - pas d'épinglage GSAP (il ajoutait des sauts sur iPhone) : `sticky`,
     géré par le navigateur lui-même ;
   - pas de `<video>` qu'on fait avancer à la main (les recherches d'image
     saccadent sur iPhone) : des images dessinées sur un canvas selon la
     position de défilement, la méthode des pages produit d'Apple.

   Raccord : le dernier passage du ciel se termine sur la première image de
   la plongée (image d'arrivée imposée à Kling). Le
   `raccord` la pose exactement comme le ciel la cadre (téléphone compris),
   puis le cadrage glisse vers celui de la plongée.

   Sur l'écran de l'ordinateur, en fond d'écran : le vrai logo, en petit,
   dont une lettre au hasard se rebrouille de temps en temps, comme dans le
   hero (réglages communs, `MOUVEMENT.film.brouille.scintille`). Les coins
   de l'écran, image par image, sont mesurés hors ligne (`lib/plongee-ecran`).

   Déroulé du défilement, de 0 à 1 :
   - 0 à `fondu` : le canvas apparaît en fondu par-dessus le ciel ;
   - `fondu` à `finVideo` : les images défilent ;
   - `finVideo` à 1 : agrandissement centré sur l'écran (0 → 0,6), puis la
     fenêtre monte et le fond recule (0,5 → 0,9) ; le reste laisse le temps
     de la voir en place avant que la page ne reprenne son cours.

   Les images ne sont chargées qu'à l'approche. Une seule série pour tous
   les écrans : quand l'écran rogne l'image (téléphone), le cadrage suit
   l'action, du personnage au début jusqu'à l'ordinateur à la fin.
   Mouvement réduit : le hero seul, immobile, sans plongée.
--------------------------------------------------------------------------- */

export type SerieImages = { dossier: string; nombre: number; extension?: string };

export type LogoEcran = {
  /** Planche du logo : les lettres bout à bout, la baseline dessous. */
  src: string;
  /** Largeur de chaque lettre dans la planche, en pixels, dans l'ordre. */
  lettres: readonly number[];
  /** Hauteur des lettres dans la planche, en pixels (la baseline est dessous). */
  hauteurLettres: number;
  /** Coins de l'écran pour chaque image de la série (`null` : pas de logo). */
  coins: readonly (CoinsEcran | null)[];
  /** Largeur du logo, en part de la largeur de l'écran. */
  largeur?: number;
  /** Centre du logo sur l'écran, en fractions (0 à 1). */
  centre?: { x: number; y: number };
  /** Couleur des symboles quand une lettre se brouille. */
  couleur?: string;
};

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
  /** Rectangle de l'écran dans la dernière image, en fractions (0 à 1) de la largeur et de la hauteur. */
  ecran: { x: number; y: number; l: number; h: number };
  /** Point à garder au centre quand l'écran rogne l'image (téléphone) : au début, puis à la fin du plan. */
  focus: { debut: { x: number; y: number }; fin: { x: number; y: number } };
  /** Part du défilement consacrée au passage du hero figé à la première image. */
  fondu?: number;
  /** Fin des images ; le reste du défilement sert à entrer dans l'écran. */
  finVideo?: number;
  logo?: LogoEcran;
  raccord?: Raccord;
  /** Description de la scène, pour qui ne la voit pas. */
  alt: string;
  /** La fenêtre qui s'ouvre dans l'ordinateur, en « feuille », à la fin de la plongée. */
  fenetre?: React.ReactNode;
  className?: string;
};

function chemin(s: SerieImages, i: number) {
  return `${s.dossier}/${String(i + 1).padStart(3, "0")}.${s.extension ?? "webp"}`;
}

export function Plongee({
  images: serie,
  ecran,
  focus,
  fondu = 0.1,
  finVideo = 0.8,
  logo,
  raccord,
  alt,
  fenetre,
  className,
}: PlongeeProps) {
  const zone = useRef<HTMLDivElement>(null);
  const calque = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const fond = useRef<HTMLDivElement>(null);
  const ombre = useRef<HTMLDivElement>(null);
  const feuille = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = zone.current;
    const cadre = calque.current;
    const canvas = toile.current;
    const recul = fond.current;
    const voileFond = ombre.current;
    const panneau = feuille.current;
    if (!el || !cadre || !canvas || !recul || !voileFond) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    if (mouvementReduit()) return;

    const cible = ecran;
    const images: HTMLImageElement[] = [];
    let courante = -1;
    let entree = 0; // entrée dans l'écran, de 0 à 1, adoucie
    let avance = 0; // progression dans les images, de 0 à 1, pour le recadrage
    const borne = (x: number) => Math.min(1, Math.max(0, x));
    const douce = (x: number) => x * x * (3 - 2 * x);

    /* Le logo de l'écran et son scintillement, réglé sur celui du hero. */
    const planche = logo ? new Image() : null;
    if (planche && logo) planche.src = logo.src;
    const { glyphes, scintille } = MOUVEMENT.film.brouille;
    const police =
      getComputedStyle(canvas).getPropertyValue("--police-mono").trim() || "ui-monospace, monospace";
    const brouille = { lettre: -1, precedente: -1, debut: 0, fin: 0, prochaine: 0, pas: -1, glyphe: "" };
    const etatBrouille = (t: number) => {
      const n = logo?.lettres.length ?? 0;
      if (brouille.lettre >= 0 && t >= brouille.fin) {
        brouille.lettre = -1;
        const pause = scintille.pauseMin + Math.random() * (scintille.pauseMax - scintille.pauseMin);
        brouille.prochaine = t + pause * 1000;
      }
      if (brouille.lettre < 0 && t >= brouille.prochaine && n > 0) {
        let i = Math.floor(Math.random() * n);
        if (i === brouille.precedente) i = (i + 1) % n;
        brouille.lettre = brouille.precedente = i;
        brouille.debut = t;
        brouille.fin = t + scintille.duree * 1000;
        brouille.pas = -1;
      }
      if (brouille.lettre >= 0) {
        const pas = Math.floor(((t - brouille.debut) / (brouille.fin - brouille.debut)) * scintille.changements);
        if (pas !== brouille.pas) {
          brouille.pas = pas;
          let g = glyphes[Math.floor(Math.random() * glyphes.length)];
          if (g === brouille.glyphe) g = glyphes[(glyphes.indexOf(g) + 1) % glyphes.length];
          brouille.glyphe = g;
        }
      }
    };

    // Pose le logo sur l'écran de l'image i ; (dx, dy, dw, dh) : où l'image est dessinée.
    const dessinerLogo = (i: number, dx: number, dy: number, dw: number, dh: number) => {
      const q = logo?.coins[i];
      if (!logo || !q || !planche?.complete || planche.naturalWidth === 0) return;
      const [hx, hy, dxr, dyr, bx, by] = q;
      const ox = dx + hx * dw;
      const oy = dy + hy * dh;
      const ux = (dxr - hx) * dw;
      const uy = (dyr - hy) * dh;
      const vx = (bx - hx) * dw;
      const vy = (by - hy) * dh;
      const lu = Math.hypot(ux, uy);
      const lv = Math.hypot(vx, vy);
      // Repère de l'écran, en pixels : x le long du bord haut, y le long du bord gauche.
      ctx2d.save();
      ctx2d.transform(ux / lu, uy / lu, vx / lv, vy / lv, ox, oy);
      const total = logo.lettres.reduce((s, l) => s + l, 0);
      const k = (lu * (logo.largeur ?? 0.42)) / total; // pixels écran par pixel de planche
      const lw = total * k;
      const lh = planche.naturalHeight * k;
      const x0 = lu * (logo.centre?.x ?? 0.5) - lw / 2;
      const y0 = lv * (logo.centre?.y ?? 0.45) - lh / 2;
      // Sous quelques pixels, le logo n'est qu'une tache : il apparaît en fondu avec la taille.
      ctx2d.globalAlpha = Math.min(1, Math.max(0, (lw - 24) / 36));
      // La baseline, puis les lettres une à une (sauf celle qui se brouille).
      const hl = logo.hauteurLettres;
      ctx2d.drawImage(planche, 0, hl, total, planche.naturalHeight - hl, x0, y0 + hl * k, lw, lh - hl * k);
      let sx = 0;
      logo.lettres.forEach((l, n) => {
        if (n === brouille.lettre) {
          ctx2d.fillStyle = logo.couleur ?? "#1a1a1a";
          ctx2d.font = `600 ${hl * 1.08 * k}px ${police}`;
          ctx2d.textAlign = "center";
          ctx2d.textBaseline = "middle";
          ctx2d.fillText(brouille.glyphe, x0 + (sx + l / 2) * k, y0 + (hl / 2) * k);
        } else {
          ctx2d.drawImage(planche, sx, 0, l, hl, x0 + sx * k, y0, l * k, hl * k);
        }
        sx += l;
      });
      ctx2d.restore();
    };

    // Dessine l'image i en « cover » dans le canvas, agrandie de `zoom` autour du centre de l'écran.
    const dessiner = (i: number) => {
      const img = images[i];
      if (!img || !img.complete || img.naturalWidth === 0) return;
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
      // Centre de l'écran de l'ordinateur, à l'affichage.
      const cx = dx + (cible.x + cible.l / 2) * dw2;
      const cy = dy + (cible.y + cible.h / 2) * dh2;
      // Agrandissement final : l'écran de l'ordinateur remplit la vue. En
      // portrait, le remplir en hauteur couperait le logo : on s'arrête quand
      // il dépasse un peu la largeur : le fond d'écran reste lisible.
      const rw = w / (cible.l * dw2);
      const rh = h / (cible.h * dh2);
      const zoom = 1 + (Math.min(Math.max(rw, rh), rw * 1.6) * 1.15 - 1) * entree;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.translate(cx, cy);
      ctx2d.scale(zoom, zoom);
      ctx2d.translate(-cx, -cy);
      ctx2d.drawImage(img, dx, dy, dw2, dh2);
      etatBrouille(performance.now());
      dessinerLogo(i, dx, dy, dw2, dh2);
      courante = i;
    };

    // Chargement à l'approche : toute la série, la première image dessinée dès qu'elle arrive.
    const charger = () => {
      for (let i = 0; i < serie.nombre; i++) {
        const img = new Image();
        img.decoding = "async";
        img.src = chemin(serie, i);
        images[i] = img;
        if (i === 0) img.onload = () => courante < 0 && dessiner(0);
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

    // Le scintillement continue quand le défilement s'arrête : une boucle
    // d'animation, tant que la plongée est à l'écran et le logo visible.
    let boucle = 0;
    const tourner = () => {
      if (courante >= 0 && logo?.coins[courante]) dessiner(courante);
      boucle = requestAnimationFrame(tourner);
    };
    const arreter = () => {
      cancelAnimationFrame(boucle);
      boucle = 0;
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onToggle: (self) => {
        if (self.isActive && !boucle) boucle = requestAnimationFrame(tourner);
        if (!self.isActive) arreter();
      },
      onUpdate: (self) => {
        const p = self.progress;
        // Le canvas apparaît par-dessus le ciel.
        const pf = Math.min(1, p / fondu);
        gsap.set(cadre, { autoAlpha: pf * pf * (3 - 2 * pf) });
        const pv = Math.min(1, Math.max(0, (p - fondu) / (finVideo - fondu)));
        const pz = Math.max(0, (p - finVideo) / (1 - finVideo));
        // Entrée dans l'écran : lente au début, franche à la fin.
        entree = douce(borne(pz / 0.6));
        // La feuille : elle monte du bas (fin franche, comme un ressort
        // amorti), le fond recule, s'arrondit et s'assombrit derrière elle.
        const f = borne((pz - 0.5) / 0.4);
        const ef = 1 - Math.pow(1 - f, 3);
        if (panneau) gsap.set(panneau, { yPercent: 105 * (1 - ef), autoAlpha: f > 0 ? 1 : 0 });
        gsap.set(recul, { scale: 1 - 0.06 * ef, borderRadius: 24 * ef });
        gsap.set(voileFond, { opacity: 0.45 * ef });
        avance = pv;
        const i = Math.round(pv * (serie.nombre - 1));
        // Si l'image voulue n'est pas encore là, on garde la plus proche déjà chargée.
        let j = i;
        while (j > 0 && !(images[j]?.complete && images[j].naturalWidth)) j--;
        dessiner(j);
      },
    });

    const redessiner = () => courante >= 0 && dessiner(courante);
    window.addEventListener("resize", redessiner);
    return () => {
      st.kill();
      obs.disconnect();
      arreter();
      window.removeEventListener("resize", redessiner);
    };
  }, [serie, ecran, focus, fondu, finVideo, logo, raccord]);

  return (
    <div
      ref={zone}
      data-src="components/ui/plongee.tsx"
      className={cn("nuit relative h-[320svh] motion-reduce:h-auto", className)}
    >
      {/* `data-plongee-colle` : là où se pose ce qui reste collé au plan quand la plongée commence (le bouton tombé près de l'ordinateur). */}
      <div data-plongee-colle="" className="sticky top-0 h-svh motion-reduce:static motion-reduce:h-auto">
        {/* La plongée, posée exactement sur le cadre du hero (mêmes marges, mêmes coins). */}
        <div
          ref={calque}
          className="pointer-events-none invisible absolute inset-2 overflow-hidden rounded-[1.5rem] bg-background opacity-0 sm:inset-3 sm:rounded-[2rem] motion-reduce:hidden"
        >
          {/* Le fond qui recule derrière la feuille. */}
          <div ref={fond} className="absolute inset-0 overflow-hidden">
            <canvas ref={toile} role="img" aria-label={alt} className="absolute inset-0 h-full w-full" />
            <div ref={ombre} aria-hidden="true" className="absolute inset-0 bg-background opacity-0" />
          </div>
        </div>
        {/* La fenêtre en « feuille », dans le même cadre. Mouvement réduit : posée
            sous le hero, dans le cours de la page. */}
        {fenetre && (
          <div className="pointer-events-none absolute inset-2 overflow-hidden rounded-[1.5rem] sm:inset-3 sm:rounded-[2rem] motion-reduce:pointer-events-auto motion-reduce:relative motion-reduce:inset-auto motion-reduce:mx-2 motion-reduce:h-[85svh] motion-reduce:overflow-visible sm:motion-reduce:mx-3">
            <div
              ref={feuille}
              className="pointer-events-auto invisible absolute inset-x-0 bottom-0 top-11 mx-auto md:top-14 md:max-w-3xl motion-reduce:visible motion-reduce:top-0"
            >
              {fenetre}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
