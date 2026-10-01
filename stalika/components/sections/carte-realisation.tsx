"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EtatCarte } from "@/components/ui/roue";
import { dossierRealisation, type Realisation } from "@/lib/realisations";

/* ---------------------------------------------------------------------------
   Une carte de la roue : un site sur téléphone, en action.

   · Le haut de page : l'affiche, et par-dessus la vidéo quand le site bouge.
     Une boucle joue tant que la carte est de face ou voisine. Une entrée se
     remet au début quand la carte passe derrière la roue, et se joue une fois
     quand elle revient de face : on « arrive » sur le site à chaque tour.
   · Rien n'est cliquable dans le site : ce sont des images.
   · En visite (ordinateur, un clic sur la carte de face) : la page entière se
     charge et défile dans la carte, jusqu'au pied de page. Échap, la croix ou
     un clic ailleurs referme ; la carte remonte alors en haut de page.

   Mouvement réduit ou économie de données : l'affiche seule, aucune vidéo.
--------------------------------------------------------------------------- */

const LARGEUR = 600;
const HERO = 1000; // hauteur du haut de page dans les tranches, pour 600 px de large

export function CarteRealisation({ site, etat, sortir }: { site: Realisation; etat: EtatCarte; sortir: () => void }) {
  const dossier = dossierRealisation(site.id);
  const video = useRef<HTMLVideoElement>(null);
  const defileur = useRef<HTMLDivElement>(null);
  const barre = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [videoPrete, setVideoPrete] = useState(false);
  const [pageChargee, setPageChargee] = useState(false);
  const permise = useRef(false);
  const jouee = useRef(false);
  const horsChamp = useRef(false);

  const total = site.tranches.reduce((a, b) => a + b, 0);

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
    } else if (site.video === "entree") {
      if (etat.loin || !etat.enVue) {
        v.pause();
        if (v.currentTime > 0) v.currentTime = 0;
        jouee.current = false;
      } else if (etat.devant && !jouee.current) {
        jouee.current = true;
        v.currentTime = 0;
        void v.play().catch(() => {});
      }
    }
  }, [etat.proche, etat.devant, etat.loin, etat.enVue, source, site.video]);

  // La visite : la page entière se charge à la première, et la carte remonte
  // en haut de page quand on la referme.
  useEffect(() => {
    if (etat.visite) {
      setPageChargee(true);
      defileur.current?.focus({ preventScroll: true });
      return;
    }
    const d = defileur.current;
    if (d && d.scrollTop > 0) {
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      d.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
    }
  }, [etat.visite]);

  const auDefilement = () => {
    const d = defileur.current;
    if (!d) return;
    const fin = d.scrollHeight - d.clientHeight;
    if (barre.current) barre.current.style.transform = `scaleY(${fin > 0 ? d.scrollTop / fin : 0})`;
    // La boucle s'arrête quand le haut de page sort de la carte.
    const dehors = d.scrollTop > d.clientHeight;
    if (dehors !== horsChamp.current && site.video === "boucle" && video.current) {
      horsChamp.current = dehors;
      if (dehors) video.current.pause();
      else if (etat.proche) void video.current.play().catch(() => {});
    }
  };

  // Les tranches de la page, en pourcentages de la hauteur totale.
  let cumul = 0;
  const tranches = site.tranches.map((h, i) => {
    const t = { src: `${dossier}/page-${i + 1}.webp`, haut: (cumul / total) * 100, hauteur: (h / total) * 100 };
    cumul += h;
    return t;
  });

  return (
    <div data-src="components/sections/carte-realisation.tsx" className="group/carte absolute inset-0" style={{ backgroundColor: site.fond }}>
      <div
        ref={defileur}
        tabIndex={etat.visite ? 0 : -1}
        onScroll={auDefilement}
        data-lenis-prevent={etat.visite ? "" : undefined}
        aria-label={etat.visite ? `La page de ${site.nom}, à faire défiler` : undefined}
        className={cn(
          "absolute inset-0 overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          etat.visite ? "overflow-y-auto cursor-auto" : "overflow-hidden",
        )}
      >
        <div className="relative w-full" style={{ aspectRatio: `${LARGEUR} / ${total}` }}>
          {pageChargee &&
            tranches.map((t) => (
              // Des captures du site, sans lien : de simples images, pas d'optimisation à faire.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={t.src}
                src={t.src}
                alt=""
                draggable={false}
                decoding="async"
                className="absolute inset-x-0 w-full select-none"
                style={{ top: `${t.haut}%`, height: `${t.hauteur}%` }}
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
                onLoadedData={() => site.video === "entree" && setVideoPrete(true)}
                onPlaying={() => setVideoPrete(true)}
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

      {/* En visite : la progression, la sortie. */}
      {etat.visite && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-3 right-1.5 w-[3px] overflow-hidden rounded-full bg-foreground/20">
            <div ref={barre} className="h-full w-full origin-top scale-y-0 rounded-full bg-foreground/85" />
          </div>
          <button
            type="button"
            onClick={sortir}
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
