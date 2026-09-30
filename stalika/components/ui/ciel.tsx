"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollTrigger, mouvementReduit } from "@/lib/gsap";
import { VideoAdaptative, type SourcesVideo } from "@/components/ui/video-adaptative";

/* ---------------------------------------------------------------------------
   Ciel : un seul plan, du hero jusqu'à la discussion, dont l'heure avance
   avec le défilement.

   Demande de J : depuis le hero, toujours le même fond, sans nouvelle image
   à la première section ; la lumière part de celle du hero, passe par le
   crépuscule, la nuit et l'aube, puis revient à la lumière du début, en un
   seul mouvement régulier du haut de la page jusqu'à l'ordinateur. Les
   sections défilent par-dessus : rien n'est épinglé, le plan reste en place
   par `position: sticky`.

   En haut de page, c'est la vidéo du hero qui joue (son aller-retour de
   20 s). Au premier défilement, elle se met en pause et s'efface dans le
   plan dessiné, posé au même endroit : on sait où en est son zoom à chaque
   instant (courbe en cosinus du montage, zoom mesuré image par image :
   `video.zoom`), et le plan reprend ce cadrage avant de revenir doucement au
   plan large.

   Le plan dessiné : une suite d'images (`jalons` : quelle image à quelle
   heure). La lumière du hero, puis les deux passages en accéléré (Kling 3.0
   Pro, crépuscule → nuit → aube), puis la première image de la plongée.
   Dessinées sur un canvas (fluide sur iPhone), chaque image fondue dans la
   suivante selon la position exacte : aucun à-coup, même très lentement.
   Entre deux images générées à part (lumière du hero → crépuscule, aube →
   lumière dorée), c'est un fondu long.

   L'heure suit le défilement de façon linéaire, du premier repère (le hero,
   0) au dernier (juste avant la plongée, 1). Mouvement réduit : pas de
   glissement ni de vidéo, le plan prend l'heure du repère le plus proche du
   milieu de l'écran.

   Téléphone : une série recadrée sur la falaise (`cadrageMobile`), moins
   lourde. Les images ne sont chargées qu'à l'approche.
--------------------------------------------------------------------------- */

export type SerieCiel = { dossier: string; nombre: number };
/** Une partie de l'image entière, en fractions (0 à 1). */
export type Rectangle = { x: number; y: number; l: number; h: number };

export type CielProps = {
  bureau: SerieCiel;
  mobile?: SerieCiel;
  /** Partie de l'image entière que montre la série mobile. */
  cadrageMobile?: Rectangle;
  /** Heure → image : paires [heure de 0 à 1, index d'image], dans l'ordre. */
  jalons: readonly (readonly [number, number])[];
  /** Repères par id d'élément : le premier et le dernier bornent le défilement ; en mouvement réduit, tous comptent. */
  reperes: Record<string, number>;
  /** La vidéo du hero, jouée en haut de page par-dessus le plan. */
  video?: {
    bureau: SourcesVideo;
    mobile?: SourcesVideo;
    /** Durée de l'aller-retour, en secondes. */
    duree: number;
    /** Zoom au bout de l'aller par rapport à la première image : échelle et décalage (fractions). */
    zoom: { echelle: number; x: number; y: number };
    /** Partie de chaque image que montre la vidéo mobile. */
    recadrageMobile?: Rectangle;
  };
  /** Description du plan, pour qui ne le voit pas. */
  alt: string;
  children: React.ReactNode;
  className?: string;
};

const chemin = (s: SerieCiel, i: number) => `${s.dossier}/${String(i + 1).padStart(3, "0")}.webp`;
const ENTIER: Rectangle = { x: 0, y: 0, l: 1, h: 1 };
const RAPPORT = 1924 / 1076; // largeur / hauteur des images entières
const borne = (x: number) => Math.min(1, Math.max(0, x));
const douce = (x: number) => x * x * (3 - 2 * x);
const melange = (a: Rectangle, b: Rectangle, k: number): Rectangle => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  l: a.l + (b.l - a.l) * k,
  h: a.h + (b.h - a.h) * k,
});

export function Ciel({ bureau, mobile, cadrageMobile, jalons, reperes, video, alt, children, className }: CielProps) {
  const zone = useRef<HTMLDivElement>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = zone.current;
    const canvas = toile.current;
    const ctx2d = canvas?.getContext("2d");
    if (!el || !canvas || !ctx2d || !cadre.current) return;

    const reduit = mouvementReduit();
    const surMobile = window.matchMedia("(max-width: 767px)").matches;
    const serie = mobile && surMobile ? mobile : bureau;
    // Partie de l'image entière que montre chaque image de la série, et celle à cadrer par défaut.
    const source = mobile && surMobile && cadrageMobile ? cadrageMobile : ENTIER;
    const lecteur = video && !reduit ? cadre.current.querySelector("video") : null;
    const images: HTMLImageElement[] = [];
    const prete = (i: number) => images[i]?.complete && images[i].naturalWidth > 0;

    let cible = 0; // heure visée, d'après le défilement
    let courant = 0; // heure affichée, qui rejoint la cible en douceur
    let boucle = 0;
    let zoomPause = 0; // où en était le zoom de la vidéo quand elle s'est arrêtée (0 à 1)

    // Où en est le zoom de la vidéo : même courbe que le montage (cosinus, aller puis retour).
    const zoomVideo = () => {
      if (!lecteur || !video) return 0;
      const moitie = video.duree / 2;
      const t = lecteur.currentTime % video.duree;
      const u = t <= moitie ? t / moitie : (video.duree - t) / moitie;
      return (1 - Math.cos(Math.PI * u)) / 2;
    };
    // La partie de la première image que montre la vidéo, à ce zoom.
    const cadrageVideo = (s: number): Rectangle => {
      if (!video) return source;
      const e = 1 + (video.zoom.echelle - 1) * s;
      const r = { x: (-0.5 - video.zoom.x * s) / e + 0.5, y: (-0.5 - video.zoom.y * s) / e + 0.5, l: 1 / e, h: 1 / e };
      const c = surMobile && video.recadrageMobile;
      return c ? { x: r.x + c.x * r.l, y: r.y + c.y * r.h, l: c.l * r.l, h: c.h * r.h } : r;
    };

    // L'image (fractionnaire) à l'heure t, d'après les jalons.
    const indexA = (t: number) => {
      if (t <= jalons[0][0]) return jalons[0][1];
      for (let k = 1; k < jalons.length; k++) {
        const [t0, i0] = jalons[k - 1];
        const [t1, i1] = jalons[k];
        if (t <= t1) return i0 + ((i1 - i0) * (t - t0)) / (t1 - t0);
      }
      return jalons[jalons.length - 1][1];
    };

    // Dessine l'heure t : deux images voisines, la seconde en fondu, cadrées sur `r`.
    let dessinee = -1;
    const dessiner = (t: number) => {
      const f = Math.min(serie.nombre - 1, Math.max(0, indexA(t)));
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
      // Cadrage : celui de la vidéo au moment de la pause, qui revient au plan large.
      const k = douce(borne(t / 0.12));
      const r = video && !reduit ? melange(cadrageVideo(zoomPause), source, k) : source;
      // Le rectangle `r` couvre le canvas ; chaque image montre la partie `source` de l'image entière.
      const e = Math.max(w / (r.l * RAPPORT), h / r.h);
      const x0 = w / 2 + (source.x - (r.x + r.l / 2)) * RAPPORT * e;
      const y0 = h / 2 + (source.y - (r.y + r.h / 2)) * e;
      const dw = source.l * RAPPORT * e;
      const dh = source.h * e;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.globalAlpha = 1;
      ctx2d.drawImage(images[i], x0, y0, dw, dh);
      if (a > 0.001) {
        ctx2d.globalAlpha = a;
        ctx2d.drawImage(images[j], x0, y0, dw, dh);
        ctx2d.globalAlpha = 1;
      }
      dessinee = t;
    };

    // La vidéo : en pause dès qu'on quitte le haut, effacée en même temps, relancée au retour.
    const suivreVideo = (t: number) => {
      if (!lecteur) return;
      lecteur.style.opacity = String(1 - borne(t / 0.03));
      if (t > 0.0005 && !lecteur.paused) {
        zoomPause = zoomVideo();
        lecteur.pause();
      } else if (t <= 0.0005 && lecteur.paused && lecteur.currentTime > 0) {
        void lecteur.play().catch(() => {});
      }
    };

    // Chargement à l'approche : toutes les images, chacune redessine l'heure en cours.
    let charge = false;
    const obs = new IntersectionObserver(
      (entrees) => {
        if (charge || !entrees.some((e) => e.isIntersecting)) return;
        charge = true;
        obs.disconnect();
        for (let n = 0; n < serie.nombre; n++) {
          const img = new Image();
          img.decoding = "async";
          img.src = chemin(serie, n);
          img.onload = () => dessiner(courant);
          images[n] = img;
        }
      },
      { rootMargin: "150% 0px" },
    );
    obs.observe(el);

    /* Les repères : le milieu de chaque élément, en pixels depuis le haut de
       la page, avec son heure. Recalculés à chaque rafraîchissement. */
    let points: { y: number; t: number }[] = [];
    const mesurer = () => {
      points = Object.entries(reperes)
        .map(([id, t]) => {
          const s = document.getElementById(id);
          if (!s) return null;
          const b = s.getBoundingClientRect();
          return { y: b.top + window.scrollY + b.height / 2, t };
        })
        .filter((p): p is { y: number; t: number } => p !== null)
        .sort((a, b) => a.y - b.y);
    };
    const heure = () => {
      if (points.length === 0) return 0;
      const y = window.scrollY + window.innerHeight / 2;
      if (reduit) return points.reduce((m, p) => (Math.abs(p.y - y) < Math.abs(m.y - y) ? p : m)).t;
      // Un seul mouvement régulier, du premier repère au dernier.
      const p = points[0];
      const q = points[points.length - 1];
      return p.t + (q.t - p.t) * borne((y - p.y) / (q.y - p.y));
    };

    const tourner = () => {
      courant = reduit ? cible : courant + (cible - courant) * 0.12;
      if (Math.abs(courant - cible) < 0.0002) courant = cible;
      suivreVideo(courant);
      if (Math.abs(courant - dessinee) > 0.0001) dessiner(courant);
      boucle = courant !== cible ? requestAnimationFrame(tourner) : 0;
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
  }, [bureau, mobile, cadrageMobile, jalons, reperes, video]);

  return (
    <div ref={zone} data-src="components/ui/ciel.tsx" className={cn("nuit relative bg-background", className)}>
      {/* Le plan, fixe à l'écran pendant toute la zone ; les sections passent par-dessus.
          Ordre d'empilement explicite (plan en 0, sections en 10) : sans lui,
          Safari sur iPhone peut peindre le plan collant au-dessus des textes. */}
      <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-svh p-2 sm:p-3">
        <div ref={cadre} className="relative h-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
          {/* Sans JavaScript, et jusqu'au premier dessin : la première image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chemin(bureau, 0)}
            alt={alt}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[30%_50%] md:object-center"
          />
          <canvas ref={toile} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          {video && (
            <VideoAdaptative className="absolute inset-0" bureau={video.bureau} mobile={video.mobile} />
          )}
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
