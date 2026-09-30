"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import type { SourcesVideo } from "@/components/ui/video-adaptative";

/* ---------------------------------------------------------------------------
   Décor : le paysage du hero derrière une section, à une autre heure.

   L'histoire de la page (validée par J) : le hero se passe au coucher du
   soleil, puis la même falaise passe au crépuscule, à la nuit, à l'aube, au
   matin. Toutes les images gardent le cadrage exact du hero (générées à
   partir de sa première image, gpt_image_2_5, le 2026-09-30).

   Même cadre que le hero : un grand rectangle arrondi, à 8 px (12 px dès
   `sm`) des bords de la section.

   Deux usages :
   - une image seule, qui recule doucement (léger zoom arrière) quand la
     section arrive à l'écran ;
   - un passage d'une heure à l'autre : une vidéo en accéléré (Kling 3.0,
     image de départ et image d'arrivée imposées), jouée une fois à
     l'arrivée de la section, qui reste sur sa dernière image. Rien ne suit
     la molette : ça se joue tout seul, comme les autres animations.

   La vidéo n'est chargée qu'à l'approche. Sa première image est l'image de
   départ : on la voit pendant le chargement, sans saut. Le cadrage sur
   téléphone est le même pour l'image et la vidéo (même `cadrage`), la
   version mobile de la vidéo est simplement moins lourde.

   Mouvement réduit : pas de vidéo ni de zoom ; on montre l'image d'arrivée,
   c'est-à-dire l'heure où la section se passe.
--------------------------------------------------------------------------- */

export type DecorProps = {
  /** L'image de départ : l'heure où la section commence. */
  image: string;
  /** L'image d'arrivée, si une vidéo fait passer d'une heure à l'autre. */
  fin?: string;
  /** Le passage en accéléré, de `image` à `fin`. */
  video?: { bureau: SourcesVideo; mobile?: SourcesVideo };
  /** Classes de position de l'image dans son cadre (le téléphone rogne les côtés). */
  cadrage?: string;
  /** Classes du voile qui pose le texte sur l'image, dans les jetons du thème. */
  voile?: string;
  className?: string;
};

export function Decor({ image, fin, video, cadrage = "object-[30%_50%] md:object-center", voile, className }: DecorProps) {
  const cadre = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = cadre.current;
    if (!el || mouvementReduit()) return;
    const lecteur = film.current;
    const photo = el.querySelector<HTMLElement>("[data-decor-image]");
    let joue = false;

    const obs = new IntersectionObserver(
      (entrees) => {
        if (joue || !entrees.some((e) => e.isIntersecting)) return;
        joue = true;
        obs.disconnect();
        if (lecteur && video) {
          const mobile = window.matchMedia("(max-width: 767px)").matches && video.mobile ? video.mobile : video.bureau;
          const src = mobile.webm && lecteur.canPlayType('video/webm; codecs="vp9"') ? mobile.webm : mobile.mp4;
          lecteur.muted = true;
          lecteur.src = src;
          // La vidéo ne se montre qu'une fois prête : jusque-là, l'image de départ.
          lecteur.addEventListener("playing", () => gsap.to(lecteur, { autoAlpha: 1, duration: 0.3 }), { once: true });
          void lecteur.play().catch(() => {
            /* lecture refusée (économie d'énergie) : l'image de départ reste */
          });
        } else if (photo) {
          gsap.fromTo(photo, { scale: 1.08 }, { scale: 1, duration: 14, ease: "power2.out" });
        }
      },
      // Quand le haut du cadre atteint 65 % de l'écran, comme les scènes
      // (`film.declencheur`). Un seuil en part de la hauteur ne marcherait pas
      // pour une section plus haute que l'écran, fréquente sur téléphone.
      { rootMargin: "0px 0px -35% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [video]);

  return (
    <div
      ref={cadre}
      aria-hidden="true"
      data-src="components/ui/decor.tsx"
      className={cn(
        "pointer-events-none absolute inset-2 overflow-hidden rounded-[1.5rem] sm:inset-3 sm:rounded-[2rem]",
        className,
      )}
    >
      <div data-decor-image className="absolute inset-0">
        <Image src={image} alt="" fill sizes="100vw" className={cn("object-cover", cadrage)} />
      </div>
      {fin && (
        <Image src={fin} alt="" fill sizes="100vw" className={cn("hidden object-cover motion-reduce:block", cadrage)} />
      )}
      {video && (
        <video
          ref={film}
          muted
          playsInline
          preload="none"
          className={cn("invisible absolute inset-0 h-full w-full object-cover opacity-0 motion-reduce:hidden", cadrage)}
        />
      )}
      {voile && <div className={cn("absolute inset-0", voile)} />}
    </div>
  );
}
