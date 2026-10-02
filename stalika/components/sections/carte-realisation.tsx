"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/gsap";
import type { ActionsCarte, EtatCarte } from "@/components/ui/roue";
import { LARGEUR_PAGE, peindreBande, type Scene, type Tranche } from "@/lib/peinture-carte";
import { dossierRealisation, type Realisation } from "@/lib/realisations";

/* ---------------------------------------------------------------------------
   Une carte de la roue : un site sur téléphone, en action, enroulé sur un
   cylindre.

   La carte est un pan de cylindre, découpé en bandes horizontales. Chaque bande
   est un petit canevas, et la CSS le pose à son angle sur le cylindre (voir
   `components/ui/roue.tsx`). Le site, lui, est peint à plat par
   `lib/peinture-carte.ts` à partir de ses sources : l'affiche, la vidéo, les
   tranches de la page, ou, pour VTBON, le film de fond et la page transparente.
   Chaque bande ne reçoit que sa tranche de l'image. Rien n'est cliquable dans
   le site : ce sont des images.

   · La vidéo (une boucle, une entrée, ou les deux) joue dans un élément caché,
     et chaque image est recopiée dans les bandes. Une boucle joue tant que la
     carte est de face ou voisine. Une entrée se remet au début quand la carte
     passe derrière la roue, et se joue quand elle revient de face : on
     « arrive » sur le site à chaque tour.
   · Le site défile dans la carte, jusqu'au pied de page : au doigt sur la carte
     de face ; à la souris, après un clic (la visite). Le défilement natif est
     porté par une couche transparente posée devant la carte (la page est faite
     d'images peintes, il n'y a rien à faire défiler d'autre) ; sa position
     commande la peinture. Les tranches de la page se chargent au fil du
     défilement. Quand la carte quitte la face, ou que la visite se referme,
     elle remonte en haut de page.
   · VTBON (mode « calques ») : le fond est un film qui ne défile pas, et qui
     avance avec le défilement ; la page, transparente, défile par-dessus ; et
     l'entrée du héros se rejoue quand la carte arrive de face.

   Mouvement réduit ou économie de données : pas de vidéo, l'entrée est faite.
--------------------------------------------------------------------------- */

const COIN = 0.075; // rayon des coins, en part de la largeur de la carte
const CONTOUR = "rgba(248, 247, 242, 0.14)";

// L'indication « faites défiler » ne s'affiche qu'une fois par visite du site.
let indiceTactileMontre = false;

type Dessin = {
  l: number;
  h: number;
  dpr: number;
  defilement: number;
  tranches: Tranche[];
  images: (HTMLImageElement | null)[];
  chargees: number;
  entree: number;
  videoPrete: boolean;
  demande: number;
  peint: boolean;
};

function charger(src: string, apres: (img: HTMLImageElement) => void) {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => apres(img);
  img.src = src;
}

export function CarteRealisation({ site, etat, actions }: { site: Realisation; etat: EtatCarte; actions: ActionsCarte }) {
  const dossier = dossierRealisation(site.id);
  const calques = site.calques;
  const { bandes: K, arc, recouvrement } = actions.courbe;
  const racine = useRef<HTMLDivElement>(null);
  const affiche = useRef<HTMLImageElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const defileur = useRef<HTMLDivElement>(null);
  const barre = useRef<HTMLDivElement>(null);
  const toiles = useRef<(HTMLCanvasElement | null)[]>([]);

  const total = useMemo(() => site.tranches.reduce((a, b) => a + b, 0), [site.tranches]);
  // Tout ce que lit la peinture vit hors de React : un rendu n'a rien à redessiner.
  const d = useRef<Dessin>({
    l: 0,
    h: 0,
    dpr: 1,
    defilement: 0,
    tranches: [],
    images: [],
    chargees: 0,
    entree: calques ? -1 : Infinity,
    videoPrete: false,
    demande: 0,
    peint: false,
  });
  if (d.current.tranches.length === 0) {
    let cumul = 0;
    d.current.tranches = site.tranches.map((hauteur) => {
      const t: Tranche = { img: null, haut: cumul, hauteur };
      cumul += hauteur;
      return t;
    });
    d.current.images = Array.from({ length: calques?.images ?? 0 }, () => null);
  }

  const [largeur, setLargeur] = useState(0);
  const [pret, setPret] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [indice, setIndice] = useState(false);
  const permise = useRef(false);
  const jouee = useRef(false);
  const horsChamp = useRef(false);
  const auDoigt = etat.defilable && !etat.visite;

  /* --- La peinture ---------------------------------------------------------- */
  const peindre = useCallback(() => {
    const e = d.current;
    e.demande = 0;
    if (!e.l) return;
    const scene: Scene = {
      l: e.l,
      h: e.h,
      rayon: e.l * COIN,
      fond: site.fond,
      contour: CONTOUR,
      defilement: e.defilement,
      affiche: affiche.current && affiche.current.complete && affiche.current.naturalWidth ? affiche.current : null,
      video: e.videoPrete ? video.current : null,
      tranches: e.tranches,
      calques: calques ? { config: calques, images: e.images, entree: e.entree } : undefined,
    };
    const pas = e.h / K;
    toiles.current.forEach((c, j) => {
      const ctx = c?.getContext("2d");
      if (!c || !ctx) return;
      const y0 = Math.max(0, j * pas - recouvrement / 2);
      const y1 = Math.min(e.h, (j + 1) * pas + recouvrement / 2);
      ctx.setTransform(e.dpr, 0, 0, e.dpr, 0, -y0 * e.dpr);
      peindreBande(ctx, scene, y0, y1);
    });
    if (!e.peint) {
      e.peint = true;
      setPret(true);
    }
  }, [site.fond, calques, K, recouvrement]);

  const demander = useCallback(() => {
    const e = d.current;
    if (!e.demande) e.demande = requestAnimationFrame(peindre);
  }, [peindre]);

  /* --- La taille : la carte, et les canevas de ses bandes ------------------- */
  useLayoutEffect(() => {
    const el = racine.current;
    if (!el) return;
    const mesurer = () => {
      const e = d.current;
      e.l = el.offsetWidth;
      e.h = el.offsetHeight;
      e.dpr = Math.min(window.devicePixelRatio || 1, 3);
      const pas = e.h / K;
      toiles.current.forEach((c, j) => {
        if (!c) return;
        const y0 = Math.max(0, j * pas - recouvrement / 2);
        const y1 = Math.min(e.h, (j + 1) * pas + recouvrement / 2);
        c.width = Math.max(1, Math.round(e.l * e.dpr));
        c.height = Math.max(1, Math.ceil((y1 - y0) * e.dpr));
      });
      setLargeur(e.l);
      demander();
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(d.current.demande);
      d.current.demande = 0;
    };
  }, [K, recouvrement, demander]);

  /* --- Les sources ----------------------------------------------------------- */
  const chargerTranches = useCallback(
    (jusque: number) => {
      const e = d.current;
      for (let i = e.chargees; i < Math.min(jusque, e.tranches.length); i++) {
        const t = e.tranches[i];
        charger(`${dossier}/page-${i + 1}.webp`, (img) => {
          t.img = img;
          demander();
        });
      }
      e.chargees = Math.max(e.chargees, Math.min(jusque, e.tranches.length));
    },
    [dossier, demander],
  );

  // L'affiche : déjà chargée au montage (rendue par le serveur), ou bientôt.
  useEffect(() => {
    const img = affiche.current;
    if (img?.complete) demander();
  }, [demander]);

  // VTBON : le haut de la page et le film se chargent dès que la roue est à l'écran.
  useEffect(() => {
    if (!calques || !etat.enVue) return;
    const e = d.current;
    chargerTranches(1);
    e.images.forEach((_, i) => {
      if (e.images[i]) return;
      charger(`${dossier}/fond-${String(i).padStart(2, "0")}.webp`, (img) => {
        e.images[i] = img;
        demander();
      });
    });
  }, [calques, etat.enVue, dossier, chargerTranches, demander]);

  /* --- La vidéo du haut de page ---------------------------------------------- */
  // Seulement si le mouvement est permis et sans économie de données.
  useEffect(() => {
    if (!site.video) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const eco = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    permise.current = !reduit && !eco;
  }, [site.video]);

  // La source se pose quand la roue arrive à l'écran : la version téléphone
  // sous 768 px, le WebM quand le navigateur le lit.
  useEffect(() => {
    const v = video.current;
    if (!v || !site.video || !permise.current || source || !etat.enVue) return;
    const base = `${dossier}/hero${window.matchMedia("(max-width: 767px)").matches ? "-mobile" : ""}`;
    setSource(v.canPlayType('video/webm; codecs="vp9"') ? `${base}.webm` : `${base}.mp4`);
  }, [etat.enVue, site.video, source, dossier]);

  // Chaque image de la vidéo est recopiée dans les bandes.
  useEffect(() => {
    const v = video.current;
    if (!v || !source) return;
    let actif = true;
    let id = 0;
    const suite = () => {
      if (!actif) return;
      if (!v.paused) demander();
      id = typeof v.requestVideoFrameCallback === "function" ? v.requestVideoFrameCallback(suite) : requestAnimationFrame(suite);
    };
    suite();
    return () => {
      actif = false;
      if (typeof v.cancelVideoFrameCallback === "function") v.cancelVideoFrameCallback(id);
      else cancelAnimationFrame(id);
    };
  }, [source, demander]);

  // Jouer, mettre en pause, rembobiner, selon la place de la carte sur la roue.
  useEffect(() => {
    const v = video.current;
    if (!v || !source) return;
    v.muted = true;
    if (site.video === "boucle") {
      if (etat.proche && etat.enVue && !horsChamp.current) void v.play().catch(() => {});
      else v.pause();
      return;
    }
    // Une entrée (suivie ou non d'une boucle).
    if (etat.loin || !etat.enVue) {
      v.pause();
      if (v.currentTime > 0) v.currentTime = 0;
      jouee.current = false;
    } else if (etat.devant && !jouee.current) {
      jouee.current = true;
      v.currentTime = 0;
      void v.play().catch(() => {});
    } else if (site.video === "entree-boucle" && jouee.current) {
      if (etat.proche && !horsChamp.current) void v.play().catch(() => {});
      else v.pause();
    }
  }, [etat.proche, etat.devant, etat.loin, etat.enVue, source, site.video]);

  // Une entrée suivie d'une boucle : à la fin, on reprend au début de la boucle.
  const aLaFinDeLaVideo = () => {
    const v = video.current;
    if (!v || site.video !== "entree-boucle" || site.reprise === undefined) return;
    v.currentTime = site.reprise;
    if (etat.proche && !horsChamp.current) void v.play().catch(() => {});
  };

  /* --- L'entrée du héros (VTBON) --------------------------------------------- */
  // Le minuteur va jusqu'au bout une fois lancé, même si la roue bouge entre-temps :
  // seul le départ derrière la roue le remet à zéro.
  const minuteur = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      if (minuteur.current) gsap.ticker.remove(minuteur.current);
    },
    [],
  );
  useEffect(() => {
    if (!calques) return;
    const e = d.current;
    const arreter = () => {
      if (minuteur.current) gsap.ticker.remove(minuteur.current);
      minuteur.current = null;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      e.entree = Infinity;
      demander();
      return;
    }
    if (etat.loin || !etat.enVue) {
      // Passée derrière la roue : le héros attend, vide, la prochaine arrivée.
      arreter();
      e.entree = -1;
      demander();
    } else if (etat.devant && e.entree < 0 && !minuteur.current) {
      const fin = calques.entree.delai + calques.entree.decalage * calques.hero.length + calques.entree.duree;
      const debut = gsap.ticker.time;
      e.entree = 0;
      const tic = () => {
        e.entree = gsap.ticker.time - debut;
        if (e.entree >= fin) {
          e.entree = Infinity;
          arreter();
        }
        demander();
      };
      minuteur.current = tic;
      gsap.ticker.add(tic);
    }
  }, [calques, etat.devant, etat.loin, etat.enVue, demander]);

  /* --- Le défilement --------------------------------------------------------- */
  // La carte cesse de défiler : elle remonte en haut de page.
  useEffect(() => {
    const el = defileur.current;
    if (etat.defilable) {
      if (etat.visite) el?.focus({ preventScroll: true });
      return;
    }
    if (el && el.scrollTop > 0) {
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
    }
  }, [etat.defilable, etat.visite]);

  // La carte s'offre au défilement : la suite de la page se charge.
  useEffect(() => {
    if (etat.defilable) chargerTranches(2);
  }, [etat.defilable, chargerTranches]);

  const auDefilement = () => {
    const el = defileur.current;
    if (!el) return;
    const e = d.current;
    e.defilement = el.scrollTop;
    const fin = el.scrollHeight - el.clientHeight;
    if (barre.current) barre.current.style.transform = `scaleY(${fin > 0 ? el.scrollTop / fin : 0})`;
    // Les tranches se chargent un peu avant d'arriver dans la carte.
    const k = e.l / LARGEUR_PAGE;
    const jusque = e.tranches.filter((t) => t.haut * k < el.scrollTop + e.h * 3).length;
    if (jusque > e.chargees) chargerTranches(jusque);
    if (el.scrollTop > 0 && etat.defilable) actions.retenir();
    // Le haut de page sorti de la carte : sa vidéo s'arrête.
    const dehors = el.scrollTop > e.h;
    if (dehors !== horsChamp.current && video.current && site.video && site.video !== "entree") {
      horsChamp.current = dehors;
      if (dehors) video.current.pause();
      else if (etat.proche && (site.video === "boucle" || jouee.current)) void video.current.play().catch(() => {});
    }
    demander();
  };

  // Au doigt : la première fois qu'une carte s'offre au défilement, on le dit.
  // Pas pendant que la roue tourne : il faut que la carte reste de face.
  useEffect(() => {
    if (!auDoigt || !etat.enVue || indiceTactileMontre) return;
    let fin = 0;
    const debut = window.setTimeout(() => {
      indiceTactileMontre = true;
      setIndice(true);
      fin = window.setTimeout(() => setIndice(false), 3800);
    }, 700);
    return () => {
      window.clearTimeout(debut);
      window.clearTimeout(fin);
      setIndice(false);
    };
  }, [auDoigt, etat.enVue]);

  /* --- Les bandes ------------------------------------------------------------ */
  // Chaque bande est posée sur le cylindre par une enveloppe de la taille de la
  // carte, qui tourne autour du même axe que la carte. `alpha` est l'angle du
  // milieu de la bande sur la carte, en degrés (positif vers le bas).
  // ⚠️ La bande est posée AU MILIEU de la carte, pas à son rang : c'est la
  // rotation qui l'amène à son angle. Posée à son rang puis tournée, elle
  // sortirait du cylindre (rayon √(r² + y²)) et les bandes se mélangeraient.
  // Ce que la bande peint, en revanche, ce sont les lignes de son rang.
  const posees = Array.from({ length: K }, (_, j) => {
    const alpha = ((j + 0.5) / K - 0.5) * arc;
    return (
      <div
        key={j}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [backface-visibility:hidden]"
        style={{ transform: `translateZ(calc(var(--roue-r) * -1)) rotateX(${(-alpha).toFixed(3)}deg) translateZ(var(--roue-r))` }}
      >
        <div
          data-bande=""
          data-alpha={alpha.toFixed(3)}
          className="pointer-events-auto absolute inset-x-0"
          style={{ top: `calc(var(--roue-h) / 2 - var(--roue-h) / ${2 * K} - ${recouvrement / 2}px)`, height: `calc(var(--roue-h) / ${K} + ${recouvrement}px)` }}
        >
          <canvas
            ref={(el) => {
              toiles.current[j] = el;
            }}
            className="absolute inset-0 size-full"
          />
          <span data-ombre="" className="pointer-events-none absolute inset-0 bg-background opacity-0" />
          <span data-reflet="" className="pointer-events-none absolute inset-0 bg-foreground opacity-0" />
        </div>
      </div>
    );
  });

  return (
    <div ref={racine} data-src="components/sections/carte-realisation.tsx" className="group/carte absolute inset-0 [transform-style:preserve-3d]">
      {/* Les sources du dessin. L'affiche est aussi l'image que voit un visiteur sans
          JavaScript, ou avant le premier dessin ; la vidéo, minuscule, joue sans se voir. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={affiche}
        src={`${dossier}/affiche.webp`}
        alt={site.alt}
        draggable={false}
        onLoad={demander}
        className={cn("pointer-events-none absolute inset-x-0 top-0 w-full select-none", pret && "opacity-0")}
      />
      {site.video && (
        <video
          ref={video}
          src={source ?? undefined}
          muted
          playsInline
          loop={site.video === "boucle"}
          preload="auto"
          aria-hidden="true"
          draggable={false}
          onLoadedData={() => {
            d.current.videoPrete = true;
            demander();
          }}
          onSeeked={demander}
          onPlaying={() => {
            d.current.videoPrete = true;
            demander();
          }}
          onEnded={aLaFinDeLaVideo}
          className="pointer-events-none absolute left-0 top-0 size-px opacity-0"
        />
      )}

      {posees}

      {/* La couche qui porte le défilement : transparente, devant la carte. Sa hauteur est
          celle de la page ; sa position commande la peinture. */}
      <div
        ref={defileur}
        tabIndex={etat.visite ? 0 : -1}
        onScroll={auDefilement}
        data-lenis-prevent={etat.defilable ? "" : undefined}
        aria-label={etat.defilable ? `La page de ${site.nom}, à faire défiler` : undefined}
        className={cn(
          "absolute inset-0 overscroll-contain outline-none [scrollbar-width:none] [transform:translateZ(2px)] [&::-webkit-scrollbar]:hidden",
          etat.defilable ? "touch-pan-y overflow-y-auto" : "pointer-events-none overflow-hidden",
          etat.visite && "cursor-auto",
        )}
      >
        <div aria-hidden="true" style={{ height: largeur ? (total * largeur) / LARGEUR_PAGE : 0 }} />
      </div>

      {/* Ce qui se pose devant : indications, progression, sortie. */}
      <div className="pointer-events-none absolute inset-0 [transform:translateZ(2px)]">
        {/* Ordinateur : l'invitation à visiter, au survol de la carte de face. */}
        {etat.devant && !etat.visite && (
          <span className="absolute inset-x-0 bottom-[16%] hidden justify-center opacity-0 transition-opacity duration-300 group-hover/carte:opacity-100 md:flex">
            <span className="rounded-full bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur-sm">
              Cliquez pour visiter le site
            </span>
          </span>
        )}

        {/* Au doigt : l'indication, une seule fois. */}
        {indice && auDoigt && (
          <span className="absolute inset-x-0 bottom-[12%] flex animate-[roue-indice_3.6s_var(--ease-out)_both] justify-center">
            <span className="rounded-full bg-background/80 px-2.5 py-1 text-[0.625rem] font-semibold text-foreground shadow-lg backdrop-blur-sm">
              Faites défiler le site
            </span>
          </span>
        )}

        {/* La progression dans la page, dès qu'elle défile. */}
        {etat.defilable && (
          <div aria-hidden="true" className="absolute inset-y-[7%] right-1 w-[3px] overflow-hidden rounded-full bg-foreground/20 md:right-1.5">
            <div ref={barre} className="h-full w-full origin-top scale-y-0 rounded-full bg-foreground/85" />
          </div>
        )}

        {/* En visite, à la souris : la sortie. */}
        {etat.visite && (
          <>
            <button
              type="button"
              onClick={actions.sortir}
              aria-label="Refermer la visite"
              className="pointer-events-auto absolute right-3 top-[6%] grid size-8 place-items-center rounded-full bg-background/80 text-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
            <span className="absolute inset-x-0 bottom-[12%] flex animate-[roue-indice_3.6s_var(--ease-out)_both] justify-center">
              <span className="rounded-full bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur-sm">
                Faites défiler · Échap pour sortir
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
