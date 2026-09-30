import Link from "next/link";
import { VideoFond } from "@/components/ui/video-fond";
import { MotBrouille } from "@/components/ui/mot-brouille";
import { EntreeHero } from "@/components/ui/entree-hero";
import { SITE } from "@/lib/site";

/* ---------------------------------------------------------------------------
   Le hero de l'accueil : un grand cadre arrondi, une vidéo plein cadre, et
   STALIKA en très grand qui se compose lettre par lettre.

   Mise en page reprise d'un hero repéré par J sur 21st (la forme seulement :
   cadre arrondi sur fond sombre, menu en onglet accroché au bord haut, nom
   géant en bas à gauche, texte court et bouton pilule en bas à droite). Rien
   de son code, de son image ni de ses textes : la vidéo est la nôtre
   (image Flux Pro Ultra, animée par Kling 3.0, générées le 2026-09-30).

   Le cadre vit dans la version sombre de la palette (`.nuit`) : le texte clair
   se lit sur la vidéo grâce à un dégradé sombre vers le bas, dans les jetons
   du thème. Mouvement réduit : l'affiche reste, la vidéo disparaît (règle du
   composant `VideoFond`), le nom s'affiche entier.
--------------------------------------------------------------------------- */

const LIENS = [
  { href: "#sur-mesure", libelle: "Sur mesure" },
  { href: "#utile", libelle: "Utile" },
  { href: "#relecture", libelle: "La relecture" },
  { href: "#livre", libelle: "Livré" },
] as const;

function Fleche() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-current">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function Hero() {
  return (
    <div data-src="components/sections/hero.tsx" className="nuit bg-background p-2 sm:p-3">
      <VideoFond
        src="/hero/video.mp4"
        srcMobile="/hero/video-mobile.mp4"
        srcWebm="/hero/video.webm"
        srcMobileWebm="/hero/video-mobile.webm"
        affiche="/hero/affiche.jpg"
        afficheMobile="/hero/affiche-mobile.jpg"
        alt="Un plateau d'herbe au-dessus d'une mer de nuages, au coucher du soleil ; une personne travaille sur un ordinateur, au loin."
        voile={0}
        aria-labelledby="hero-titre"
        className="flex h-[calc(100svh-1rem)] min-h-[34rem] flex-col rounded-[1.5rem] text-foreground sm:h-[calc(100svh-1.5rem)] sm:rounded-[2rem]"
      >
        {/* Le dégradé qui pose le texte sur l'image, en haut et surtout en bas. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-background/45 via-transparent via-40% to-background/85"
        />

        {/* Le menu, dans un onglet accroché au bord haut du cadre. */}
        <nav aria-label="Principale" className="mx-auto flex max-w-full items-center gap-0.5 rounded-b-2xl bg-background px-1.5 py-1.5 sm:gap-2 sm:px-5 sm:py-2">
          <a
            href="#contenu-suite"
            className="sr-only focus:not-sr-only focus:rounded-md focus:px-2 focus:text-sm"
          >
            Aller au contenu
          </a>
          {LIENS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="inline-block cursor-pointer whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:px-3 sm:text-xs"
            >
              {l.libelle}
            </a>
          ))}
          <Link
            href="/contact"
            className="cursor-pointer whitespace-nowrap rounded-full bg-accent px-3 py-1.5 text-[11px] font-medium text-on-accent sm:px-4 sm:text-xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Contact
          </Link>
        </nav>

        {/* Le bas du cadre : le nom géant à gauche, le texte et le bouton à droite. */}
        <div className="mt-auto flex flex-col gap-6 px-5 pb-6 sm:px-8 sm:pb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <h1 id="hero-titre" className="font-display font-semibold leading-[0.85] tracking-tight">
            <MotBrouille
              mot="STALIKA"
              delai={0.3}
              className="text-[19vw] sm:text-[17vw] lg:text-[13.5vw]"
            />
            <span className="sr-only"> · sites sur mesure pour restaurants, coachs, artisans et commerces</span>
          </h1>

          <EntreeHero delai={1.2} className="max-w-sm pb-2 lg:pb-5">
            <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">{SITE.description}</p>
            <Link
              href="/contact"
              className="group mt-5 inline-flex cursor-pointer items-center gap-3 rounded-full bg-foreground py-1.5 pl-5 pr-1.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Parlons de votre site
              <span className="grid size-8 place-items-center rounded-full bg-background text-foreground transition-transform group-hover:translate-x-0.5">
                <Fleche />
              </span>
            </Link>
          </EntreeHero>
        </div>
      </VideoFond>
    </div>
  );
}
