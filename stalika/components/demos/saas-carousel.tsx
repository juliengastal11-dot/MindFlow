"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { mouvementReduit } from "@/lib/gsap";
import { PauseDemos, SaaSPreviewCard } from "./saas-preview-card";
import { DEMOS, type Demo } from "./produits";

/* ---------------------------------------------------------------------------
   SaaSCarousel : les cartes des logiciels, une principale au centre et ses
   voisines qui dépassent sur les bords ; sur téléphone, une seule carte et un
   liseré des voisines.

   Le défilement est celui du navigateur, accroché au centre (CSS) : le doigt
   glisse comme partout, et le défilement vertical de la page n'est jamais
   pris en otage. À la souris, on attrape la piste et on la tire ; au relâché,
   elle file vers la carte la plus proche, élan compris. Les flèches, les noms
   des logiciels (l'indicateur de position) et le clavier (← →) complètent.
   Une carte voisine se clique : elle vient au centre.

   Les cartes s'approchent à mesure qu'elles arrivent au centre : échelle et
   opacité suivent la piste image par image, pendant le geste.

   Les démos tournent dans leurs cartes indépendamment du carrousel ; le
   bouton pause les arrête toutes (critère WCAG 2.2.2). Mouvement réduit : pas
   de défilement animé, et des démos arrêtées sur leur étape la plus parlante.

   D'où vient l'idée : la carte principale et ses voisines rapetissées d'un
   « Carousel Slider » (Watermelon UI) ; la rangée flèches, noms et pause d'un
   carrousel de captures (« Phone Mockups », Solace UI, sur 21st) ; le motif
   accessible du carrousel de l'APG (W3C). Rejoués en CSS et en React.
--------------------------------------------------------------------------- */

const BOUTON =
  "grid size-8 shrink-0 place-items-center rounded-full border border-foreground/10 bg-secondary/85 text-foreground transition-[background-color,opacity] hover:bg-secondary disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-9";

type Geste = { x: number; depart: number; t: number; vitesse: number; tire: boolean };

export function SaaSCarousel({
  demos = DEMOS,
  label = "Trois logiciels en démonstration",
  className,
}: {
  demos?: readonly Demo[];
  label?: string;
  className?: string;
}) {
  const piste = useRef<HTMLUListElement>(null);
  const geste = useRef<Geste | null>(null);
  const [courant, setCourant] = useState(0);
  const [pause, setPause] = useState(false);
  const [annonce, setAnnonce] = useState("");
  const [reduit, setReduit] = useState(false);
  const n = demos.length;

  useEffect(() => setReduit(mouvementReduit()), []);

  /** Le défilement qui met la carte `i` au centre de la piste. */
  const viser = useCallback((i: number) => {
    const ul = piste.current;
    const li = ul?.children[i] as HTMLElement | undefined;
    if (!ul || !li) return 0;
    return li.offsetLeft + li.offsetWidth / 2 - ul.clientWidth / 2;
  }, []);

  const aller = useCallback(
    (i: number) => {
      const ul = piste.current;
      if (!ul) return;
      const cible = Math.max(0, Math.min(n - 1, i));
      ul.scrollTo({ left: viser(cible), behavior: mouvementReduit() ? "auto" : "smooth" });
      setAnnonce(`${demos[cible].carte.nom}, ${cible + 1} sur ${n}`);
    },
    [demos, n, viser],
  );

  // Suivre la piste : la carte la plus proche du centre, et la proximité de chacune.
  useEffect(() => {
    const ul = piste.current;
    if (!ul) return;
    let image = 0;
    const mesurer = () => {
      image = 0;
      const cartes = Array.from(ul.children) as HTMLElement[];
      if (cartes.length === 0) return;
      const pas = cartes.length > 1 ? cartes[1].offsetLeft - cartes[0].offsetLeft : cartes[0].offsetWidth;
      const centre = ul.scrollLeft + ul.clientWidth / 2;
      let meilleur = 0;
      let ecart = Infinity;
      cartes.forEach((li, i) => {
        const d = (li.offsetLeft + li.offsetWidth / 2 - centre) / pas;
        li.style.setProperty("--proche", Math.max(0, 1 - Math.abs(d)).toFixed(3));
        // Une voisine rapetisse vers le centre : le bord qu'on voit dépasser reste en place.
        li.style.transformOrigin = d > 0.02 ? "0% 50%" : d < -0.02 ? "100% 50%" : "50% 50%";
        if (Math.abs(d) < ecart) {
          ecart = Math.abs(d);
          meilleur = i;
        }
      });
      setCourant(meilleur);
    };
    const demander = () => {
      if (!image) image = requestAnimationFrame(mesurer);
    };
    mesurer();
    ul.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", demander);
    return () => {
      ul.removeEventListener("scroll", demander);
      window.removeEventListener("resize", demander);
      cancelAnimationFrame(image);
    };
  }, []);

  /* --- La piste tirée à la souris (le doigt, lui, fait défiler nativement). */
  const surAppui = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !piste.current) return;
    geste.current = { x: e.clientX, depart: piste.current.scrollLeft, t: e.timeStamp, vitesse: 0, tire: false };
  };
  const surDeplacement = (e: React.PointerEvent<HTMLUListElement>) => {
    const g = geste.current;
    const ul = piste.current;
    if (!g || !ul) return;
    const dx = e.clientX - g.x;
    if (!g.tire) {
      if (Math.abs(dx) < 6) return;
      g.tire = true;
      ul.setPointerCapture(e.pointerId);
      ul.dataset.tire = "";
    }
    const avant = ul.scrollLeft;
    ul.scrollLeft = g.depart - dx;
    g.vitesse = (ul.scrollLeft - avant) / Math.max(1, e.timeStamp - g.t);
    g.t = e.timeStamp;
  };
  const surRelache = () => {
    const g = geste.current;
    const ul = piste.current;
    geste.current = null;
    if (!g?.tire || !ul) return;
    // La carte visée : la plus proche de là où l'élan aurait mené la piste ; et
    // au moins la voisine, dès qu'on a tiré d'un cinquième de carte ou d'un coup sec.
    const pas = n > 1 ? viser(1) - viser(0) : ul.clientWidth;
    const depart = Math.round((g.depart - viser(0)) / pas);
    const tire = ul.scrollLeft - g.depart;
    let cible = Math.round((ul.scrollLeft + g.vitesse * 220 - viser(0)) / pas);
    if (cible === depart && (Math.abs(tire) > pas * 0.2 || Math.abs(g.vitesse) > 0.4)) cible += Math.sign(tire || g.vitesse);
    aller(cible);
    // L'accrochage revient une fois arrivé, sinon il couperait l'élan.
    const fin = () => {
      delete ul.dataset.tire;
      ul.removeEventListener("scrollend", fin);
    };
    ul.addEventListener("scrollend", fin);
    window.setTimeout(fin, 900);
    // Le clic qui conclut un glissé n'ouvre rien.
    const bloquer = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    ul.addEventListener("click", bloquer, { capture: true, once: true });
    window.setTimeout(() => ul.removeEventListener("click", bloquer, { capture: true }), 0);
  };

  const surClavier = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    aller(courant + (e.key === "ArrowRight" ? 1 : -1));
  };

  return (
    <PauseDemos.Provider value={pause}>
      <div
        role="region"
        aria-roledescription="carrousel"
        aria-label={label}
        data-rebond="sec"
        onKeyDown={surClavier}
        className={cn("relative", className)}
      >
        {/* La piste déborde du conteneur sur téléphone, pour que les voisines affleurent au bord de
            l'écran ; sur ordinateur, ses bords s'estompent au lieu de couper les voisines net. */}
        <div className="-mx-6 @container md:mx-0 [--carte-l:calc(100cqw-3.5rem)] md:[--carte-l:min(46rem,calc(100cqw-7rem))]">
          <ul
            ref={piste}
            onPointerDown={surAppui}
            onPointerMove={surDeplacement}
            onPointerUp={surRelache}
            onPointerCancel={surRelache}
            onDragStart={(e) => e.preventDefault()}
            className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[calc((100cqw-var(--carte-l))/2)] pb-3 pt-1 [scrollbar-width:none] data-tire:cursor-grabbing data-tire:snap-none data-tire:select-none md:cursor-grab md:gap-6 md:[mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)] [&::-webkit-scrollbar]:hidden"
          >
            {demos.map((d, i) => (
              <li
                key={d.id}
                role="group"
                aria-roledescription="diapositive"
                aria-label={`${i + 1} sur ${n} : ${d.carte.nom}`}
                onClickCapture={(e) => {
                  if (i === courant) return;
                  e.preventDefault();
                  e.stopPropagation();
                  aller(i);
                }}
                className="w-(--carte-l) shrink-0 snap-center snap-always [opacity:calc(0.4+0.6*var(--proche,1))] [scale:calc(0.94+0.06*var(--proche,1))]"
              >
                <SaaSPreviewCard {...d.carte}>
                  <d.Apercu />
                </SaaSPreviewCard>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 sm:mt-5">
          <button type="button" onClick={() => aller(courant - 1)} disabled={courant === 0} aria-label="Logiciel précédent" className={BOUTON}>
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <div className="flex items-center gap-0.5 rounded-full border border-foreground/10 bg-secondary/85 p-1">
            {demos.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => aller(i)}
                aria-current={i === courant ? "true" : undefined}
                style={{ "--color-produit": d.carte.accent } as React.CSSProperties}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring sm:px-2.5 sm:py-1",
                  i === courant ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span aria-hidden="true" className="size-2 rounded-full bg-produit sm:size-1.5" />
                <span className="sr-only sm:not-sr-only">{d.carte.nom}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => aller(courant + 1)} disabled={courant === n - 1} aria-label="Logiciel suivant" className={BOUTON}>
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
          {/* Mouvement réduit : les démos sont déjà à l'arrêt, la pause n'aurait rien à arrêter. */}
          {!reduit && (
            <button
              type="button"
              onClick={() => setPause((p) => !p)}
              aria-label={pause ? "Relancer les démos" : "Mettre les démos en pause"}
              title={pause ? "Relancer les démos" : "Mettre les démos en pause"}
              className={cn(BOUTON, "ml-1")}
            >
              {pause ? <Play aria-hidden="true" className="size-3.5" /> : <Pause aria-hidden="true" className="size-3.5" />}
            </button>
          )}
        </div>
        <p aria-live="polite" className="sr-only">
          {annonce}
        </p>
      </div>
    </PauseDemos.Provider>
  );
}
