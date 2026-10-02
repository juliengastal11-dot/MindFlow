"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";
import { creerOutils, type AnimationDemo } from "./moteur";

/* ---------------------------------------------------------------------------
   SaaSPreviewCard : la carte d'un logiciel. Son nom et à qui il s'adresse, sa
   fenêtre de démonstration qui se sert toute seule, ce qu'il fait, et un lien.

   La carte porte la couleur du logiciel (`accent`, posée en
   `--color-produit` pour tout ce qu'elle contient) et le moteur de sa
   boucle : elle construit le film de `animation` sur sa fenêtre et le joue
   tant qu'elle est assez visible. La voisine, qui dépasse à peine au bord du
   carrousel, attend son tour là où elle en était : les démos vivent
   indépendamment du carrousel. Le bouton pause du carrousel les arrête
   toutes (critère WCAG 2.2.2). Quand la largeur de la fenêtre change, le film
   est reconstruit au même instant : le curseur vise des positions mesurées.

   Mouvement réduit : pas de boucle ; la fenêtre montre l'étape la plus
   parlante de la démo (le repère « pose » du film), sans curseur.
--------------------------------------------------------------------------- */

const M = MOUVEMENT.demos;

/** Le carrousel dit aux cartes si les démos sont en pause. */
export const PauseDemos = createContext(false);

export type SaaSPreviewCardProps = {
  nom: string;
  /** À qui le logiciel s'adresse, en une ligne. */
  pourQui: string;
  description: string;
  /** La couleur du logiciel : une valeur CSS, en général `var(--produit-…)`. */
  accent: string;
  icone: LucideIcon;
  /** Une étiquette à côté du nom : « Démo », « Disponible »… */
  statut?: string;
  fonctions?: readonly string[];
  /** Ce que la démo montre, en une phrase, pour les lecteurs d'écran. */
  resume: string;
  /** Le film de la démo, joué en boucle sur la fenêtre. */
  animation: AnimationDemo;
  lien?: { href: string; libelle: string };
  className?: string;
  /** L'interface de la démo : une `Fenetre` (components/demos/interface). */
  children: React.ReactNode;
};

export function SaaSPreviewCard({
  nom,
  pourQui,
  description,
  accent,
  icone: Icone,
  statut,
  fonctions,
  resume,
  animation,
  lien = { href: "/contact", libelle: "Parlons de votre outil" },
  className,
  children,
}: SaaSPreviewCardProps) {
  const titre = useId();
  const carte = useRef<HTMLElement>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const film = useRef<gsap.core.Timeline | null>(null);
  const pause = useContext(PauseDemos);
  const [enVue, setEnVue] = useState(false);
  const joue = enVue && !pause;
  const joueRef = useRef(joue);
  useEffect(() => {
    joueRef.current = joue;
  }, [joue]);

  // Le film : construit sur la fenêtre, reconstruit au même instant quand sa largeur change.
  useEffect(() => {
    const fenetre = cadre.current?.querySelector<HTMLElement>("[data-fenetre]");
    if (!fenetre) return;
    const reduit = mouvementReduit();
    let ctx: gsap.Context | undefined;
    let largeur = -1;
    let vivant = true;
    let minuteur = 0;

    const construire = () => {
      if (!vivant) return;
      const instant = film.current?.time() ?? 0;
      ctx?.revert();
      largeur = fenetre.offsetWidth;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ paused: true, repeat: -1 });
        animation(tl, creerOutils(fenetre));
        if (tl.duration() < M.boucle) tl.to({}, { duration: M.boucle - tl.duration() });
        film.current = tl;
        // En développement : le film accroché à sa fenêtre, pour l'avancer à la main depuis un test.
        if (process.env.NODE_ENV === "development") (fenetre as HTMLElement & { __film?: gsap.core.Timeline }).__film = tl;
        if (reduit) {
          tl.seek(tl.labels.pose ?? tl.duration() * 0.8);
          gsap.set(fenetre.querySelectorAll('[data-d="curseur"], [data-d="anneau"], [data-d="doigt"]'), { autoAlpha: 0 });
          return;
        }
        tl.time(instant);
        if (joueRef.current) tl.play();
      }, fenetre);
    };

    construire();
    const observateur = new ResizeObserver(() => {
      if (Math.abs(fenetre.offsetWidth - largeur) < 1) return;
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(construire, 150);
    });
    observateur.observe(fenetre);
    // Les polices changent les largeurs du texte : on remesure quand elles sont là.
    document.fonts?.ready.then(() => {
      if (vivant && document.fonts.status === "loaded") construire();
    });

    return () => {
      vivant = false;
      observateur.disconnect();
      window.clearTimeout(minuteur);
      ctx?.revert();
      film.current = null;
    };
  }, [animation]);

  // Assez visible pour jouer ?
  useEffect(() => {
    const el = carte.current;
    if (!el) return;
    const observateur = new IntersectionObserver(([e]) => setEnVue(e.intersectionRatio >= M.seuilVisible), {
      threshold: [0, M.seuilVisible, 0.7, 1],
    });
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  useEffect(() => {
    const tl = film.current;
    if (!tl || mouvementReduit()) return;
    if (joue) tl.play();
    else tl.pause();
  }, [joue]);

  return (
    <article
      ref={carte}
      aria-labelledby={titre}
      style={{ "--color-produit": accent } as React.CSSProperties}
      className={cn(
        "flex h-full flex-col rounded-2xl border border-foreground/10 bg-secondary/[0.93] p-2.5 shadow-carte sm:p-3",
        className,
      )}
    >
      <header className="flex items-start gap-3 px-1.5 pb-3 pt-1.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-produit text-on-produit shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
          <Icone aria-hidden="true" className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 id={titre} className="text-base font-semibold leading-tight tracking-tight">
              {nom}
            </h3>
            {statut && (
              <span className="rounded-full border border-foreground/15 px-1.5 text-[10.5px] font-medium leading-4 text-muted-foreground">
                {statut}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{pourQui}</p>
        </div>
      </header>

      <div ref={cadre} aria-hidden="true" className="@container">
        <div className="aspect-[4/5] @lg:aspect-[16/10]">{children}</div>
      </div>
      <p className="sr-only">{resume}</p>

      <footer className="flex flex-1 flex-col gap-3 px-1.5 pb-1.5 pt-3.5">
        <p className="text-[13px] leading-relaxed text-foreground/85">{description}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          {fonctions && (
            <ul aria-label={`Ce que fait ${nom}`} className="flex flex-wrap gap-1">
              {fonctions.map((f) => (
                <li key={f} className="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {f}
                </li>
              ))}
            </ul>
          )}
          <Link
            href={lien.href}
            className="lien-fleche inline-flex shrink-0 items-center gap-1.5 rounded-sm text-[13px] font-medium text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {lien.libelle}
            <ArrowRight aria-hidden="true" className="fleche size-3.5" />
          </Link>
        </div>
      </footer>
    </article>
  );
}
