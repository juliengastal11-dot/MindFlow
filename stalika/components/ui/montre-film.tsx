"use client";

import { useEffect, useRef } from "react";
import { useScene } from "@/components/ui/scene";
import { FILM_MONTRE, TEMPS_FILM, type SerieFilm } from "@/lib/montre-film";

/* ---------------------------------------------------------------------------
   Le lecteur de la montre qui se fabrique (lib/montre-film.ts) : une toile qui
   dessine, pour la progression de la scène, l'image de la séquence rendue dans
   Blender, et un fondu vers la suivante entre deux images. Les images se
   chargent à l'approche de la section, les plus proches de l'image en cours
   d'abord. Sur le ciel (fond transparent) : la toile n'a pas de fond.

   Le cadrage : l'image est posée en « contain » dans la toile ; sur un écran
   large, la toile est la colonne de droite (le texte est à gauche) ; au
   téléphone, le haut de l'écran, au-dessus du texte.
--------------------------------------------------------------------------- */

const borne = (x: number) => Math.min(1, Math.max(0, x));
const chemin = (s: SerieFilm, i: number) => `${s.dossier}/${String(i).padStart(3, "0")}.webp`;

export function MontreFilm({ onPret }: { onPret?: () => void }) {
  const scene = useScene();
  const racine = useRef<HTMLDivElement>(null);
  const pret = useRef(onPret);
  pret.current = onPret;

  useEffect(() => {
    const el = racine.current;
    if (!el || !scene) return;
    const canvas = el.querySelector<HTMLCanvasElement>("canvas")!;
    const fil = el.querySelector<HTMLElement>("[data-fil]")!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const large = window.matchMedia("(min-width: 768px)");
    const serie = () => (large.matches ? FILM_MONTRE.bureau : FILM_MONTRE.mobile);
    let s = serie();
    const images: (HTMLImageElement | undefined)[] = [];
    const prete = (i: number) => !!images[i]?.complete && (images[i]?.naturalWidth ?? 0) > 0;
    let progres = 0;
    let signale = false;

    const dessiner = () => {
      const f = borne(progres) * (s.nombre - 1);
      let i = Math.floor(f);
      while (i > 0 && !prete(i)) i--;
      if (!prete(i)) return;
      const j = Math.min(s.nombre - 1, Math.floor(f) + 1);
      const a = prete(j) && j !== i ? f - Math.floor(f) : 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      // l'image entière dans la toile (« contain »), centrée
      const e = Math.min(w / s.l, h / s.h);
      const dw = s.l * e;
      const dh = s.h * e;
      const x0 = (w - dw) / 2;
      const y0 = (h - dh) / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.drawImage(images[i]!, x0, y0, dw, dh);
      if (a > 0.001) {
        ctx.globalAlpha = a;
        ctx.drawImage(images[j]!, x0, y0, dw, dh);
        ctx.globalAlpha = 1;
      }
      // le fil d'or, au milieu de l'image, s'efface quand la montre est montée
      fil.style.left = `${x0 + dw / 2}px`;
      fil.style.opacity = (1 - borne((progres - TEMPS_FILM.fil.de) / (TEMPS_FILM.fil.a - TEMPS_FILM.fil.de))).toFixed(3);
      if (!signale) {
        signale = true;
        pret.current?.();
      }
    };

    // le chargement : à l'approche, les images autour de celle qu'il faut d'abord, puis toutes les autres
    let charge = false;
    const charger = () => {
      if (charge) return;
      charge = true;
      s = serie();
      const depart = Math.round(borne(progres) * (s.nombre - 1));
      const ordre = [...Array(s.nombre).keys()].sort((a, b) => Math.abs(a - depart) - Math.abs(b - depart));
      for (const n of ordre) {
        const img = new Image();
        img.decoding = "async";
        img.onload = dessiner;
        img.src = chemin(s, n);
        images[n] = img;
      }
    };
    const obs = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        charger();
      },
      { rootMargin: "150% 0px" },
    );
    obs.observe(el);

    const desabonner = scene.surProgres((p) => {
      progres = p;
      dessiner();
    });
    const ro = new ResizeObserver(dessiner);
    ro.observe(canvas);
    // si l'écran change de famille (bureau / téléphone), on recharge l'autre série
    const changer = () => {
      if (!charge) return;
      charge = false;
      images.length = 0;
      signale = false;
      charger();
    };
    large.addEventListener("change", changer);
    return () => {
      obs.disconnect();
      desabonner();
      ro.disconnect();
      large.removeEventListener("change", changer);
    };
  }, [scene]);

  return (
    <div ref={racine} className="film-scene" aria-hidden="true">
      <canvas className="film-toile" />
      <div data-fil className="film-fil" />
    </div>
  );
}
