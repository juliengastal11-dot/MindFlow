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

   Rendu serveur : un `<video>` vide et transparent ; c'est l'affiche (la
   photo posée dessous par `VideoFond`) qu'on voit jusqu'à la première image.
   Mouvement réduit : masquée en CSS (`motion-reduce:hidden`), rien n'est
   chargé puisque aucune source n'est posée avant le montage… et le montage
   ne pose rien non plus dans ce cas.
--------------------------------------------------------------------------- */

export type SourcesVideo = { webm?: string; mp4: string };

export type VideoAdaptativeProps = {
  bureau: SourcesVideo;
  mobile?: SourcesVideo;
  /** Largeur, en pixels, en dessous de laquelle la version mobile est servie. */
  seuil?: number;
  /** Faux : la vidéo est lue une fois puis reste sur sa dernière image. */
  boucle?: boolean;
  className?: string;
};

export function VideoAdaptative({ bureau, mobile, seuil = 768, boucle = true, className }: VideoAdaptativeProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const requete = window.matchMedia(`(max-width: ${seuil - 1}px)`);
    const poser = () => {
      const s = requete.matches && mobile ? mobile : bureau;
      // WebM d'abord si le navigateur le lit (moitié moins lourd), sinon MP4.
      const src = s.webm && video.canPlayType('video/webm; codecs="vp9"') ? s.webm : s.mp4;
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
      loop={boucle}
      playsInline
      preload="metadata"
      aria-hidden
    />
  );
}
