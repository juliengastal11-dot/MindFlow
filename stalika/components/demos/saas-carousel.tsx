"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { PhoneCarousel, type ImageItem } from "@/components/ui/phone-mockups-1-utils/phone-carousel";
import { SaaSPreviewCard, type EtatDemo } from "./saas-preview-card";
import { DEMOS, type Demo } from "./produits";

/* ---------------------------------------------------------------------------
   SaaSCarousel : les trois logiciels de la section 02, chacun sur l'écran
   d'un iPhone du carrousel de Solace UI (« Phone Mockups 1 », choisi par J
   le 2026-10-02), et la légende du logiciel de face.

   Le carrousel garde son allure et ses gestes : le téléphone de face, ses
   voisins estompés de part et d'autre, la rotation qui s'arrête au survol.
   Depuis le 2026-10-07 (J), les trois boutons (précédent, pause, suivant) ne se
   voient plus : un appui sur le téléphone met en pause, un glissé change de
   logiciel (ils restent pour le clavier, voir `phone-carousel.tsx`). Il tourne
   ici au rythme des démos : un téléphone reste de face le temps de sa boucle
   (12 s ; VTBON, dont les deux maquettes s'enchaînent, y reste plus longtemps :
   `duree` dans `produits.tsx`), et sa démo repart du début quand il arrive. La pause arrête la
   rotation et la démo (critère WCAG 2.2.2) ; la rotation s'arrête aussi
   quand le clavier entre dans le carrousel. Hors de l'écran, tout s'arrête.
   Mouvement réduit : pas de rotation, des écrans arrêtés sur leur étape la
   plus parlante.

   La légende dit ce que fait le logiciel de face et pour qui (plus de pastilles
   de fonctions dessous : J les a retirées le 2026-10-07) ; ses noms
   servent d'indicateur de position et se cliquent. Sur ordinateur, elle est
   à gauche des téléphones ; sur téléphone, dessous.
--------------------------------------------------------------------------- */

const M = MOUVEMENT.demos;

export function SaaSCarousel({ demos = DEMOS, className }: { demos?: readonly Demo[]; className?: string }) {
  const zone = useRef<HTMLDivElement>(null);
  const [courant, setCourant] = useState(0);
  const [pause, setPause] = useState(false);
  const [enVue, setEnVue] = useState(false);
  const [focus, setFocus] = useState(false);
  const [reduit, setReduit] = useState(false);

  useEffect(() => setReduit(mouvementReduit()), []);

  // Assez visible pour tourner ?
  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const observateur = new IntersectionObserver(([e]) => setEnVue(e.intersectionRatio >= M.seuilVisible), {
      threshold: [0, M.seuilVisible, 0.7, 1],
    });
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  const surPause = useCallback((p: boolean) => setPause(p), []);

  const etatDe = (i: number): EtatDemo => (i !== courant ? "repos" : pause || !enVue ? "pause" : "joue");

  // Chaque logiciel sur son écran : une interface de Stalika jouée par GSAP, ou un écran qui se joue seul (VTBON).
  const ecrans: ImageItem[] = demos.map((d, i) => ({
    src: "",
    alt: d.nom,
    content: d.Ecran ? (
      <d.Ecran nom={d.nom} description={d.description} resume={d.resume} statut={d.statut} etat={etatDe(i)} />
    ) : d.Apercu && d.animation ? (
      <SaaSPreviewCard
        nom={d.nom}
        description={d.description}
        resume={d.resume}
        theme={d.theme ?? ""}
        statut={d.statut}
        heure={d.heure ?? ""}
        animation={d.animation}
        etat={etatDe(i)}
      >
        <d.Apercu />
      </SaaSPreviewCard>
    ) : null,
  }));

  return (
    <div
      ref={zone}
      data-rebond="sec"
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
      className={cn("grid items-center gap-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6", className)}
    >
      <div className="-mx-6 min-w-0 sm:mx-0 lg:order-2">
        <PhoneCarousel
          images={ecrans}
          index={courant}
          onIndexChange={setCourant}
          onPauseChange={surPause}
          suspendu={!enVue || focus || reduit}
          interval={(demos[courant]?.duree ?? M.boucle) * 1000}
          className="py-2 md:py-4"
        />
      </div>
      <Legende demos={demos} courant={courant} onChoisir={setCourant} className="lg:order-1" />
    </div>
  );
}

/** Ce que fait le logiciel de face, et le lien ; au-dessus, les trois noms. */
function Legende({
  demos,
  courant,
  onChoisir,
  className,
}: {
  demos: readonly Demo[];
  courant: number;
  onChoisir: (i: number) => void;
  className?: string;
}) {
  const d = demos[courant];
  const bloc = useRef<HTMLDivElement>(null);
  const premier = useRef(true);

  // Au changement de logiciel, la légende se relit d'un fondu court, ligne après ligne.
  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    const el = bloc.current;
    if (!el || mouvementReduit()) return;
    const tween = gsap.fromTo(
      el.children,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.05, ease: MOUVEMENT.ease, overwrite: true },
    );
    return () => {
      tween.kill();
    };
  }, [courant]);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-wrap items-center justify-center gap-1 lg:justify-start">
        {demos.map((x, i) => (
          <button
            key={x.id}
            type="button"
            onClick={() => onChoisir(i)}
            aria-current={i === courant ? "true" : undefined}
            style={{ "--color-produit": x.accent } as React.CSSProperties}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              i === courant ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-produit" />
            {x.nom}
          </button>
        ))}
      </div>

      <div ref={bloc} className="flex flex-col items-center gap-3.5 text-center lg:items-start lg:text-left">
        <p className="max-w-md text-[15px] leading-relaxed text-foreground/85">{d.description}</p>
        <Link
          href={d.lien?.href ?? "/contact"}
          className="lien-fleche mt-1 inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {d.lien?.libelle ?? "Parlons de votre outil"}
          <ArrowRight aria-hidden="true" className="fleche size-4" />
        </Link>
      </div>
    </div>
  );
}
