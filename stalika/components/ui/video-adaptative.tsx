"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   La vidéo de fond, avec la bonne version selon la largeur d'écran.

   Première version : des `<source media="(max-width: 767px)">`. Sur iPhone,
   J a vu le hero démarrer « parfois » sur la version ordinateur, sans le
   recadrage mobile : l'attribut `media` des sources vidéo n'est pas respecté
   de façon fiable par tous les navigateurs. Ici, le choix est fait par le
   code, au montage, avec `matchMedia`, puis refait si l'écran change de
   catégorie (rotation, fenêtre redimensionnée).

   Rendu serveur : un `<video>` vide et transparent ; c'est le plan dessiné
   dessous (`Ciel`, première image) qu'on voit jusqu'à la première image.
   Mouvement réduit : masquée en CSS (`motion-reduce:hidden`), rien n'est
   chargé puisque aucune source n'est posée avant le montage… et le montage
   ne pose rien non plus dans ce cas.
--------------------------------------------------------------------------- */

/** `hevc` : un MP4 en HEVC (étiquette hvc1), décodé par la puce de l'iPhone ; `webm` : VP9 ; `mp4` : H.264, le repli. */
export type SourcesVideo = { hevc?: string; webm?: string; mp4: string };

export type VideoAdaptativeProps = {
  bureau: SourcesVideo;
  mobile?: SourcesVideo;
  /** Largeur, en pixels, en dessous de laquelle la version mobile est servie. */
  seuil?: number;
  className?: string;
};

export function VideoAdaptative({ bureau, mobile, seuil = 768, className }: VideoAdaptativeProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const requete = window.matchMedia(`(max-width: ${seuil - 1}px)`);
    const poser = () => {
      const s = requete.matches && mobile ? mobile : bureau;
      // HEVC d'abord si le navigateur le lit (l'iPhone : décodé par la puce, plus léger à qualité égale), puis WebM
      // (VP9, moitié moins lourd que le H.264), sinon MP4.
      const src =
        s.hevc && video.canPlayType('video/mp4; codecs="hvc1.1.6.L120.B0"')
          ? s.hevc
          : s.webm && video.canPlayType('video/webm; codecs="vp9"')
            ? s.webm
            : s.mp4;
      if (video.getAttribute("src") === src) return;
      // iOS ne lance une vidéo seule que si elle est muette : on le redit ici,
      // React ne pose pas toujours l'attribut `muted` dans le HTML serveur.
      video.muted = true;
      video.src = src;
      video.load();
      void video.play().catch(() => {
        /* lecture refusée (mode économie d'énergie) : l'affiche reste, c'est prévu */
      });
    };
    poser();
    requete.addEventListener("change", poser);
    return () => requete.removeEventListener("change", poser);
  }, [bureau, mobile, seuil]);

  return (
    <video
      ref={ref}
      className={cn("pointer-events-none h-full w-full object-cover motion-reduce:hidden", className)}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
    />
  );
}
