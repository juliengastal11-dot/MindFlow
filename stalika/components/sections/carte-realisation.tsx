"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionsCarte, EtatCarte } from "@/components/ui/roue";
import { dossierRealisation, type Realisation } from "@/lib/realisations";

/* ---------------------------------------------------------------------------
   Une carte de la roue : un site sur téléphone, en action.

   · Le haut de page : l'affiche, et par-dessus la vidéo quand le site bouge.
     Une boucle joue tant que la carte est de face ou voisine. Une entrée se
     remet au début quand la carte passe derrière la roue, et se joue quand
     elle revient de face : on « arrive » sur le site à chaque tour. Une entrée
     suivie d'une boucle reprend ensuite à `reprise` secondes, sans fin.
   · Rien n'est cliquable dans le site : ce sont des images.
   · Le site défile dans la carte, jusqu'au pied de page : au doigt sur la
     carte de face ; à la souris, après un clic (la visite). Les tranches de la
     page se chargent au fil du défilement. Quand la carte quitte la face, ou
     que la visite se referme, elle remonte en haut de page.

   Mouvement réduit ou économie de données : l'affiche seule, aucune vidéo.
--------------------------------------------------------------------------- */

const LARGEUR = 600;
const HERO = 1000; // hauteur du haut de page dans les tranches, pour 600 px de large

// L'indication « faites défiler » ne s'affiche qu'une fois par visite du site.
let indiceTactileMontre = false;

export function CarteRealisation({ site, etat, actions }: { site: Realisation; etat: EtatCarte; actions: ActionsCarte }) {
  const dossier = dossierRealisation(site.id);
  const video = useRef<HTMLVideoElement>(null);
  const defileur = useRef<HTMLDivElement>(null);
  const barre = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [videoPrete, setVideoPrete] = useState(false);
  const [chargees, setChargees] = useState(0);
  const [indice, setIndice] = useState(false);
  const permise = useRef(false);
  const jouee = useRef(false);
  const horsChamp = useRef(false);

  const total = site.tranches.reduce((a, b) => a + b, 0);
  const auDoigt = etat.defilable && !etat.visite;

  // La vidéo : seulement si le mouvement est permis et sans économie de données.
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

  // La carte cesse de défiler : elle remonte en haut de page.
  useEffect(() => {
    const d = defileur.current;
    if (etat.defilable) {
      if (etat.visite) {
        setChargees((c) => Math.max(c, 1));
        d?.focus({ preventScroll: true });
      }
      return;
    }
    if (d && d.scrollTop > 0) {
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      d.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
    }
  }, [etat.defilable, etat.visite]);

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

  // Les tranches de la page entière, en pourcentages de la hauteur totale.
  let cumul = 0;
  const tranches = site.tranches.map((h, i) => {
    const t = { src: `${dossier}/page-${i + 1}.webp`, haut: cumul / total, hauteur: h / total };
    cumul += h;
    return t;
  });

  const auDefilement = () => {
    const d = defileur.current;
    if (!d) return;
    const fin = d.scrollHeight - d.clientHeight;
    if (barre.current) barre.current.style.transform = `scaleY(${fin > 0 ? d.scrollTop / fin : 0})`;
    // Les tranches se chargent un peu avant d'arriver dans la carte.
    const jusqua = (d.scrollTop + d.clientHeight * 3) / d.scrollHeight;
    const besoin = tranches.filter((t) => t.haut < jusqua).length;
    if (besoin > chargees) setChargees(besoin);
    if (d.scrollTop > 0 && etat.defilable) actions.retenir();
    // Le haut de page sorti de la carte : sa vidéo s'arrête.
    const dehors = d.scrollTop > d.clientHeight;
    if (dehors !== horsChamp.current && video.current && site.video !== "entree") {
      horsChamp.current = dehors;
      if (dehors) video.current.pause();
      else if (etat.proche && (site.video === "boucle" || jouee.current)) void video.current.play().catch(() => {});
    }
  };

  // Une entrée suivie d'une boucle : à la fin, on reprend au début de la boucle.
  const aLaFinDeLaVideo = () => {
    const v = video.current;
    if (!v || site.video !== "entree-boucle" || site.reprise === undefined) return;
    v.currentTime = site.reprise;
    if (etat.proche && !horsChamp.current) void v.play().catch(() => {});
  };

  return (
    <div data-src="components/sections/carte-realisation.tsx" className="group/carte absolute inset-0" style={{ backgroundColor: site.fond }}>
      <div
        ref={defileur}
        tabIndex={etat.visite ? 0 : -1}
        onScroll={auDefilement}
        // Le doigt se pose : la suite de la page se charge déjà.
        onPointerDown={() => etat.defilable && setChargees((c) => Math.max(c, 1))}
        data-lenis-prevent={etat.defilable ? "" : undefined}
        aria-label={etat.defilable ? `La page de ${site.nom}, à faire défiler` : undefined}
        className={cn(
          "absolute inset-0 overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          etat.defilable ? "touch-pan-y overflow-y-auto" : "overflow-hidden",
          etat.visite && "cursor-auto",
        )}
      >
        <div className="relative w-full" style={{ aspectRatio: `${LARGEUR} / ${total}` }}>
          {tranches.slice(0, chargees).map((t) => (
            // Des captures du site, sans lien : de simples images, pas d'optimisation à faire.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={t.src}
              src={t.src}
              alt=""
              draggable={false}
              decoding="async"
              className="absolute inset-x-0 w-full select-none"
              style={{ top: `${t.haut * 100}%`, height: `${t.hauteur * 100}%` }}
            />
          ))}
          {/* Le haut de page : l'affiche, et la vidéo par-dessus quand elle est prête. */}
          <div className="absolute inset-x-0 top-0" style={{ aspectRatio: `${LARGEUR} / ${HERO}` }}>
            <Image
              src={`${dossier}/affiche.webp`}
              alt={site.alt}
              fill
              draggable={false}
              sizes="(min-width: 768px) 300px, 42vw"
              className="select-none object-cover object-top"
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
                onLoadedData={() => site.video !== "boucle" && setVideoPrete(true)}
                onPlaying={() => setVideoPrete(true)}
                onEnded={aLaFinDeLaVideo}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300",
                  videoPrete ? "opacity-100" : "opacity-0",
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* Ordinateur : l'invitation à visiter, au survol de la carte de face. */}
      {etat.devant && !etat.visite && (
        <span className="pointer-events-none absolute inset-x-0 bottom-4 hidden justify-center opacity-0 transition-opacity duration-300 group-hover/carte:opacity-100 md:flex">
          <span className="rounded-full bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur-sm">
            Cliquez pour visiter le site
          </span>
        </span>
      )}

      {/* Au doigt : l'indication, une seule fois. */}
      {indice && auDoigt && (
        <span className="pointer-events-none absolute inset-x-0 bottom-3 flex animate-[roue-indice_3.6s_var(--ease-out)_both] justify-center">
          <span className="rounded-full bg-background/80 px-2.5 py-1 text-[0.625rem] font-semibold text-foreground shadow-lg backdrop-blur-sm">
            Faites défiler le site
          </span>
        </span>
      )}

      {/* La progression dans la page, dès qu'elle défile. */}
      {etat.defilable && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-3 right-1 w-[3px] overflow-hidden rounded-full bg-foreground/20 md:right-1.5">
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
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/80 text-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
          <span className="pointer-events-none absolute inset-x-0 bottom-4 flex animate-[roue-indice_3.6s_var(--ease-out)_both] justify-center">
            <span className="rounded-full bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur-sm">
              Faites défiler · Échap pour sortir
            </span>
          </span>
        </>
      )}
    </div>
  );
}
