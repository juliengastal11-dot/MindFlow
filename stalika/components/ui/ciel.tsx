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
   20 s, la caméra s'approche de la falaise). Au premier défilement, elle se
   met en pause et s'efface dans le plan dessiné, à la même image : on sait
   où elle en est à chaque instant (courbe en cosinus du montage). Le plan
   rejoue alors ses images à l'envers (`video.retour`) : la caméra recule
   vraiment jusqu'au plan large, sans agrandir d'image fixe.

   Le plan dessiné : une suite d'images (`jalons` : quelle image à quelle
   heure), tirées de cinq passages en accéléré à caméra fixe (Kling 3.0 Pro),
   bout à bout, chacun partant de l'image où finit le précédent : lumière du
   hero → crépuscule → nuit (où le personnage s'étire) → aube → lumière
   dorée, jusqu'à la première image de la plongée. Dessinées sur un canvas
   (fluide sur iPhone), chaque image fondue dans la suivante selon la
   position exacte : aucun à-coup, même très lentement.

   La nuit, des étoiles filantes traversent la bande de ciel (demande de J) :
   dessinées en code par-dessus le plan, au hasard, une toutes les deux à
   cinq secondes, seulement tant que la zone est à l'écran.

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
    /** Les images de l'aller, réparties régulièrement (même cadrage que le plan, mobile compris). */
    retour: { bureau: SerieCiel; mobile?: SerieCiel };
    /** Heure à laquelle le recul est fini et le plan reprend la main. */
    recul: number;
  };
  /** Étoiles filantes la nuit : entre les images `de` et `a`, dans la bande de ciel
      (fraction de la hauteur de l'image entière, depuis le haut). */
  cometes?: { de: number; a: number; hauteur: number };
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

export function Ciel({ bureau, mobile, cadrageMobile, jalons, reperes, video, cometes, alt, children, className }: CielProps) {
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
    // Les images de l'aller de la vidéo, pour le recul.
    const serieRetour = video ? (video.retour.mobile && surMobile ? video.retour.mobile : video.retour.bureau) : null;
    const retour: HTMLImageElement[] = [];
    const preteRetour = (i: number) => retour[i]?.complete && retour[i].naturalWidth > 0;

    let cible = 0; // heure visée, d'après le défilement
    let courant = 0; // heure affichée, qui rejoint la cible en douceur
    let boucle = 0;
    let avanceePause = 0; // où en était la vidéo dans son aller quand elle s'est arrêtée (0 à 1)

    // Où en est la vidéo dans son aller : même courbe que le montage (cosinus, aller puis retour).
    const avanceeVideo = () => {
      if (!lecteur || !video) return 0;
      const moitie = video.duree / 2;
      const t = lecteur.currentTime % video.duree;
      const u = t <= moitie ? t / moitie : (video.duree - t) / moitie;
      return (1 - Math.cos(Math.PI * u)) / 2;
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

    /* Les étoiles filantes : tirées au hasard pendant la nuit, dessinées
       par-dessus le plan, seulement dans la bande de ciel. Une toutes les
       deux à cinq secondes, moins d'une seconde chacune. */
    type Comete = { x: number; y: number; dx: number; dy: number; vitesse: number; longueur: number; debut: number; duree: number };
    let filantes: Comete[] = [];
    let prochaine = 0;
    const nuit = (f: number) => (cometes ? borne((f - cometes.de) / 2) * borne((cometes.a - f) / 2) : 0);
    const dessinerCometes = (n: number, w: number, bandeHaut: number, bandeBas: number) => {
      const maintenant = performance.now();
      const haut = Math.max(0, bandeHaut);
      const bas = Math.min(canvas.clientHeight, bandeBas);
      if (bas - haut < 20) return;
      if (maintenant >= prochaine) {
        prochaine = maintenant + 2000 + Math.random() * 3000;
        const versGauche = Math.random() < 0.6;
        const angle = ((versGauche ? 155 : 20) + Math.random() * 12) * (Math.PI / 180);
        const duree = 700 + Math.random() * 450;
        filantes.push({
          x: w * (0.15 + Math.random() * 0.75),
          y: haut + (bas - haut) * (0.1 + Math.random() * 0.45),
          dx: Math.cos(angle),
          dy: Math.abs(Math.sin(angle)),
          vitesse: (w * (0.22 + Math.random() * 0.12)) / (duree / 1000),
          longueur: Math.min(180, w * 0.14),
          debut: maintenant,
          duree,
        });
      }
      filantes = filantes.filter((c) => maintenant - c.debut < c.duree);
      ctx2d.save();
      ctx2d.beginPath();
      ctx2d.rect(0, haut, w, bas - haut);
      ctx2d.clip();
      ctx2d.lineCap = "round";
      for (const c of filantes) {
        const age = (maintenant - c.debut) / 1000;
        const vie = (maintenant - c.debut) / c.duree;
        const hx = c.x + c.dx * c.vitesse * age;
        const hy = c.y + c.dy * c.vitesse * age;
        const l = c.longueur * Math.min(1, vie * 3);
        const qx = hx - c.dx * l;
        const qy = hy - c.dy * l;
        const alpha = Math.sin(Math.PI * vie) * n;
        const g = ctx2d.createLinearGradient(qx, qy, hx, hy);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(1, `rgba(255,250,235,${0.9 * alpha})`);
        ctx2d.strokeStyle = g;
        ctx2d.lineWidth = 1.6;
        ctx2d.beginPath();
        ctx2d.moveTo(qx, qy);
        ctx2d.lineTo(hx, hy);
        ctx2d.stroke();
        ctx2d.fillStyle = `rgba(255,252,240,${alpha})`;
        ctx2d.beginPath();
        ctx2d.arc(hx, hy, 1.4, 0, Math.PI * 2);
        ctx2d.fill();
      }
      ctx2d.restore();
    };

    // Dessine l'heure t : deux images voisines, la seconde en fondu, cadrées sur `r`.
    let dessinee = -1;
    let nuitVisible = false;
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
      // Chaque image, en « cover », centrée : la série mobile est déjà recadrée sur la falaise.
      const e = Math.max(w / (source.l * RAPPORT), h / source.h);
      const dw = source.l * RAPPORT * e;
      const dh = source.h * e;
      const x0 = (w - dw) / 2;
      const y0 = (h - dh) / 2;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.globalAlpha = 1;
      ctx2d.drawImage(images[i], x0, y0, dw, dh);
      if (a > 0.001) {
        ctx2d.globalAlpha = a;
        ctx2d.drawImage(images[j], x0, y0, dw, dh);
        ctx2d.globalAlpha = 1;
      }
      // Le recul : les images de l'aller de la vidéo, à l'envers, par-dessus le plan,
      // qui s'effacent juste avant la fin du recul (même image de départ des deux côtés).
      if (video && serieRetour && !reduit && t < video.recul) {
        const n = serieRetour.nombre;
        const g = avanceePause * (n - 1) * (1 - douce(borne(t / (video.recul * 0.85))));
        let ri = Math.floor(g);
        while (ri > 0 && !preteRetour(ri)) ri--;
        if (preteRetour(ri)) {
          const fondu = 1 - borne((t - video.recul * 0.85) / (video.recul * 0.15));
          const rj = Math.min(n - 1, ri + 1);
          ctx2d.globalAlpha = fondu;
          ctx2d.drawImage(retour[ri], x0, y0, dw, dh);
          const ra = g - Math.floor(g);
          if (ra > 0.001 && preteRetour(rj)) {
            ctx2d.globalAlpha = fondu * ra;
            ctx2d.drawImage(retour[rj], x0, y0, dw, dh);
          }
          ctx2d.globalAlpha = 1;
        }
      }
      const n = reduit ? 0 : nuit(f);
      nuitVisible = n > 0;
      if (cometes && n > 0) dessinerCometes(n, w, y0, y0 + cometes.hauteur * dh);
      dessinee = t;
    };

    // La vidéo : en pause dès qu'on quitte le haut, effacée en même temps, relancée au retour.
    const suivreVideo = (t: number) => {
      if (!lecteur) return;
      lecteur.style.opacity = String(1 - borne(t / 0.03));
      if (t > 0.0005 && !lecteur.paused) {
        avanceePause = avanceeVideo();
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
        // Les images du recul d'abord : c'est le premier défilement qui en a besoin.
        if (serieRetour && !reduit) {
          for (let n = 0; n < serieRetour.nombre; n++) {
            const img = new Image();
            img.decoding = "async";
            img.src = chemin(serieRetour, n);
            retour[n] = img;
          }
        }
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
      // Pendant la nuit, la boucle continue pour les étoiles filantes (tant que la zone est à l'écran).
      const filer = cometes && nuitVisible && st?.isActive;
      if (filer && courant === cible) dessiner(courant);
      boucle = courant !== cible || filer ? requestAnimationFrame(tourner) : 0;
    };
    const viser = () => {
      cible = heure();
      if (!boucle) boucle = requestAnimationFrame(tourner);
    };

    mesurer();
    courant = cible = heure();
    let st: ScrollTrigger | null = null;
    st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: viser,
      onToggle: viser,
      onRefresh: () => {
        mesurer();
        viser();
      },
    });
    const redessiner = () => dessiner(courant);
    window.addEventListener("resize", redessiner);
    return () => {
      st?.kill();
      obs.disconnect();
      cancelAnimationFrame(boucle);
      window.removeEventListener("resize", redessiner);
    };
  }, [bureau, mobile, cadrageMobile, jalons, reperes, video, cometes]);

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
