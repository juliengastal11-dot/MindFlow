"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger, mouvementReduit } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Plongée : une vidéo qui avance au rythme du défilement, puis on entre dans
   l'écran de l'ordinateur.

   Choix de J (option B) : un seul passage lié au défilement sur tout le site,
   court. Deux leçons tirées de la première version du film :
   - pas d'épinglage GSAP (il ajoutait des sauts sur iPhone) : la scène reste
     à l'écran par `position: sticky`, géré par le navigateur lui-même ;
   - pas de `<video>` qu'on fait avancer à la main (les recherches d'image
     saccadent sur iPhone) : la vidéo est découpée en images, dessinées sur
     un canvas selon la position de défilement. C'est la méthode des pages
     produit d'Apple.

   Déroulé : de 0 à `finVideo`, les images défilent (plan large du hero →
   gros plan sur l'écran) ; de `finVideo` à 1, la caméra entre dans l'écran
   (agrandissement centré sur `ecran`) et la couleur de la page à l'écran
   recouvre tout, pour laisser la place à la section suivante.

   Les images ne sont chargées qu'à l'approche de la section. Une seule série
   pour tous les écrans : quand l'écran rogne l'image (téléphone), le cadrage
   suit l'action, du personnage au début jusqu'à l'ordinateur à la fin.
   Mouvement réduit : pas de défilement lié, la dernière image, immobile.
--------------------------------------------------------------------------- */

export type SerieImages = { dossier: string; nombre: number; extension?: string };

export type PlongeeProps = {
  images: SerieImages;
  /** Rectangle de l'écran dans la dernière image, en fractions (0 à 1) de la largeur et de la hauteur. */
  ecran: { x: number; y: number; l: number; h: number };
  /** Point à garder au centre quand l'écran rogne l'image (téléphone) : au début, puis à la fin du plan. */
  focus: { debut: { x: number; y: number }; fin: { x: number; y: number } };
  /** Part du défilement consacrée à la vidéo ; le reste sert à entrer dans l'écran. */
  finVideo?: number;
  /** Description de la scène, pour qui ne la voit pas. */
  alt: string;
  className?: string;
};

function chemin(s: SerieImages, i: number) {
  return `${s.dossier}/${String(i + 1).padStart(3, "0")}.${s.extension ?? "webp"}`;
}

export function Plongee({ images: serie, ecran, focus, finVideo = 0.78, alt, className }: PlongeeProps) {
  const zone = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const voile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = zone.current;
    const canvas = toile.current;
    const couleur = voile.current;
    if (!el || !canvas || !couleur) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const cible = ecran;
    const images: HTMLImageElement[] = [];
    let courante = -1;
    let zoom = 1;
    let avance = 0; // progression dans la vidéo, de 0 à 1, pour le recadrage

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
      const dx = Math.min(0, Math.max(w - dw, w / 2 - fx * dw));
      const dy = Math.min(0, Math.max(h - dh, h / 2 - fy * dh));
      // Centre de l'écran de l'ordinateur, à l'affichage.
      const cx = dx + (cible.x + cible.l / 2) * dw;
      const cy = dy + (cible.y + cible.h / 2) * dh;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.translate(cx, cy);
      ctx2d.scale(zoom, zoom);
      ctx2d.translate(-cx, -cy);
      ctx2d.drawImage(img, dx, dy, dw, dh);
      courante = i;
    };

    // Chargement à l'approche : d'abord la première et la dernière image, puis le reste.
    const charger = () => {
      for (let i = 0; i < serie.nombre; i++) {
        const img = new Image();
        img.decoding = "async";
        img.src = chemin(serie, i);
        images[i] = img;
        if (i === 0 || i === serie.nombre - 1) img.onload = () => courante < 0 && dessiner(0);
      }
    };

    if (mouvementReduit()) {
      const img = new Image();
      img.src = chemin(serie, serie.nombre - 1);
      images[serie.nombre - 1] = img;
      img.onload = () => dessiner(serie.nombre - 1);
      return;
    }

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

    // Agrandissement final : assez pour que l'écran remplisse toute la vue.
    const zoomMax = Math.max(1 / cible.l, 1 / cible.h) * 1.15;

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress;
        const pv = Math.min(1, p / finVideo);
        const pz = Math.max(0, (p - finVideo) / (1 - finVideo));
        // Entrée dans l'écran : lente au début, franche à la fin.
        const ez = pz * pz * (3 - 2 * pz);
        zoom = 1 + (zoomMax - 1) * ez;
        gsap.set(couleur, { opacity: Math.max(0, (ez - 0.55) / 0.45) });
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
      window.removeEventListener("resize", redessiner);
    };
  }, [serie, ecran, focus, finVideo]);

  return (
    <div
      ref={zone}
      data-src="components/ui/plongee.tsx"
      className={cn("nuit relative h-[260svh] bg-background motion-reduce:h-svh", className)}
    >
      <div className="sticky top-0 h-svh p-2 sm:p-3">
        <div className="relative h-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
          {/* Sans JavaScript : la première image, fixe. Le canvas la recouvre ensuite. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={chemin(serie, 0)} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          <canvas ref={toile} role="img" aria-label={alt} className="absolute inset-0 h-full w-full" />
        </div>
        {/* La couleur de la page à l'écran : elle recouvre tout, marges du cadre
            comprises, à la fin de la plongée. La section suivante a ce fond. */}
        <div ref={voile} aria-hidden className="pointer-events-none absolute inset-0 bg-lin opacity-0" />
      </div>
    </div>
  );
}
