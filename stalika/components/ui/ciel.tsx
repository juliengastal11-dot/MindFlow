"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollTrigger, mouvementReduit } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Ciel : un seul plan fixe derrière plusieurs sections, dont l'heure avance
   avec le défilement.

   Idée de J : des images posées derrière chaque section font diaporama ; un
   seul plan, la falaise du hero, sur lequel le temps passe pendant qu'on
   descend, fait film. Les sections défilent normalement par-dessus : rien
   n'est épinglé, le plan reste en place par `position: sticky`.

   Le plan : les deux passages en accéléré (Kling 3.0 Pro, 2026-09-30), mis
   bout à bout, crépuscule → nuit → aube, découpés en images. Comme pour la
   plongée, elles sont dessinées sur un canvas (fluide sur iPhone) ; en plus,
   chaque image est fondue dans la suivante selon la position exacte, ce qui
   efface les à-coups même en défilant très lentement.

   L'heure de chaque section est fixée par `reperes` (id de section → heure,
   de 0 à 1) : quand le milieu d'une section passe au milieu de l'écran, le
   ciel est à son heure ; entre deux sections, il passe de l'une à l'autre.

   Téléphone : une série recadrée sur la falaise, moins lourde. Les images ne
   sont chargées qu'à l'approche.
   Mouvement réduit : le ciel ne glisse pas, il prend directement l'heure de
   la section au milieu de l'écran.
--------------------------------------------------------------------------- */

export type SerieCiel = { dossier: string; nombre: number };

export type CielProps = {
  bureau: SerieCiel;
  mobile?: SerieCiel;
  /** Heure de chaque section, de 0 (début du plan) à 1 (fin), par id. */
  reperes: Record<string, number>;
  children: React.ReactNode;
  className?: string;
};

const chemin = (s: SerieCiel, i: number) => `${s.dossier}/${String(i + 1).padStart(3, "0")}.webp`;

export function Ciel({ bureau, mobile, reperes, children, className }: CielProps) {
  const zone = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = zone.current;
    const canvas = toile.current;
    const ctx2d = canvas?.getContext("2d");
    if (!el || !canvas || !ctx2d) return;

    const reduit = mouvementReduit();
    const serie = mobile && window.matchMedia("(max-width: 767px)").matches ? mobile : bureau;
    const images: HTMLImageElement[] = [];
    const prete = (i: number) => images[i]?.complete && images[i].naturalWidth > 0;

    let cible = 0; // heure visée, d'après le défilement
    let courant = 0; // heure affichée, qui rejoint la cible en douceur
    let boucle = 0;

    // Dessine l'heure t (0 à 1) : deux images voisines, la seconde en fondu.
    let dessinee = -1;
    const dessiner = (t: number) => {
      const f = Math.min(1, Math.max(0, t)) * (serie.nombre - 1);
      let i = Math.floor(f);
      while (i > 0 && !prete(i)) i--;
      if (!prete(i)) return;
      const j = Math.min(serie.nombre - 1, i + 1);
      const a = prete(j) && j !== i ? f - Math.floor(f) : 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const poser = (img: HTMLImageElement, alpha: number) => {
        // « cover », centré : la série mobile est déjà recadrée sur la falaise.
        const e = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * e;
        const dh = img.naturalHeight * e;
        ctx2d.globalAlpha = alpha;
        ctx2d.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      };
      poser(images[i], 1);
      if (a > 0.001) poser(images[j], a);
      ctx2d.globalAlpha = 1;
      dessinee = t;
    };

    // Chargement à l'approche : la première image d'abord, le reste ensuite.
    let charge = false;
    const obs = new IntersectionObserver(
      (entrees) => {
        if (charge || !entrees.some((e) => e.isIntersecting)) return;
        charge = true;
        obs.disconnect();
        for (let i = 0; i < serie.nombre; i++) {
          const img = new Image();
          img.decoding = "async";
          img.src = chemin(serie, i);
          img.onload = () => dessiner(courant);
          images[i] = img;
        }
      },
      { rootMargin: "150% 0px" },
    );
    obs.observe(el);

    /* Les repères : le milieu de chaque section, en pixels depuis le haut de
       la page, avec son heure. Recalculés à chaque rafraîchissement. */
    let points: { y: number; t: number }[] = [];
    const mesurer = () => {
      points = Object.entries(reperes)
        .map(([id, t]) => {
          const s = document.getElementById(id);
          if (!s) return null;
          const r = s.getBoundingClientRect();
          return { y: r.top + window.scrollY + r.height / 2, t };
        })
        .filter((p): p is { y: number; t: number } => p !== null)
        .sort((a, b) => a.y - b.y);
    };
    const heure = () => {
      if (points.length === 0) return 0;
      const y = window.scrollY + window.innerHeight / 2;
      if (reduit) {
        // Pas de glissement : l'heure de la section la plus proche du milieu.
        return points.reduce((m, p) => (Math.abs(p.y - y) < Math.abs(m.y - y) ? p : m)).t;
      }
      if (y <= points[0].y) return points[0].t;
      for (let k = 1; k < points.length; k++) {
        const p = points[k - 1];
        const q = points[k];
        if (y <= q.y) return p.t + ((q.t - p.t) * (y - p.y)) / (q.y - p.y);
      }
      return points[points.length - 1].t;
    };

    // Le ciel rejoint l'heure visée en douceur, image par image, tant que la zone est à l'écran.
    const tourner = () => {
      courant = reduit ? cible : courant + (cible - courant) * 0.12;
      if (Math.abs(courant - dessinee) > 0.0002) dessiner(courant);
      boucle = Math.abs(cible - courant) > 0.0002 ? requestAnimationFrame(tourner) : 0;
    };
    const viser = () => {
      cible = heure();
      if (!boucle) boucle = requestAnimationFrame(tourner);
    };

    mesurer();
    courant = cible = heure();
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: viser,
      onRefresh: () => {
        mesurer();
        viser();
      },
    });
    const redessiner = () => dessiner(courant);
    window.addEventListener("resize", redessiner);
    return () => {
      st.kill();
      obs.disconnect();
      cancelAnimationFrame(boucle);
      window.removeEventListener("resize", redessiner);
    };
  }, [bureau, mobile, reperes]);

  return (
    <div ref={zone} data-src="components/ui/ciel.tsx" className={cn("nuit relative bg-background", className)}>
      {/* Le plan, fixe à l'écran pendant toute la zone ; les sections passent par-dessus.
          Ordre d'empilement explicite (plan en 0, sections en 10) : sans lui,
          Safari sur iPhone peut peindre le plan collant au-dessus des textes. */}
      <div aria-hidden="true" className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-svh p-2 sm:p-3">
        <div className="relative h-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
          {/* Sans JavaScript : la première image, fixe. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={chemin(bureau, 0)} alt="" className="absolute inset-0 h-full w-full object-cover object-[30%_50%] md:object-center" />
          <canvas ref={toile} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
