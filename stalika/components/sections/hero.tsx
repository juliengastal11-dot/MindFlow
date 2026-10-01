import Link from "next/link";
import { LogoBrouille } from "@/components/ui/logo-brouille";
import { EntreeHero } from "@/components/ui/entree-hero";

/* ---------------------------------------------------------------------------
   Le hero de l'accueil : un grand cadre arrondi, une vidéo plein cadre, et
   STALIKA en très grand qui se compose lettre par lettre.

   Mise en page reprise d'un hero repéré par J sur 21st (la forme seulement :
   cadre arrondi sur fond sombre, menu en onglet accroché au bord haut, nom
   géant en bas à gauche, texte court et bouton pilule en bas à droite). Rien
   de son code, de son image ni de ses textes : la vidéo est la nôtre
   (image Flux Pro Ultra, animée par Kling 3.0, générées le 2026-09-30),
   montée en aller-retour adouci : le zoom avance 10 s, ralentit jusqu'à
   s'arrêter, puis recule 10 s ; aucune reprise au début, donc aucun fondu.
   La vidéo et le plan ne sont plus ici : ils vivent dans `Ciel`, le fond
   commun du hero jusqu'à la discussion (demande de J). Le hero n'est plus
   qu'une section transparente posée dessus : menu, nom, texte, bouton.

   Le hero vit dans la version sombre de la palette (`.nuit`, posée par
   `Ciel`) : le texte clair se lit sur le plan grâce à un dégradé sombre vers
   le bas, dans les jetons du thème. Mouvement réduit : la vidéo disparaît
   (règle de `VideoAdaptative`), le plan reste, le nom s'affiche entier.
--------------------------------------------------------------------------- */

/* Les sept lettres du logo validé, découpées au milieu des espaces dans le
   fichier d'origine (1 743 px de large pour le mot, 217 px de haut). */
const LETTRES = [
  { src: "/hero/logo/lettre-1.png", largeur: 234 },
  { src: "/hero/logo/lettre-2.png", largeur: 267 },
  { src: "/hero/logo/lettre-3.png", largeur: 309 },
  { src: "/hero/logo/lettre-4.png", largeur: 246 },
  { src: "/hero/logo/lettre-5.png", largeur: 133 },
  { src: "/hero/logo/lettre-6.png", largeur: 285 },
  { src: "/hero/logo/lettre-7.png", largeur: 269 },
] as const;

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
    <section id="accueil" data-src="components/sections/hero.tsx" aria-labelledby="hero-titre" className="relative text-foreground">
      {/* Le dégradé qui pose le texte sur le plan, en haut et surtout en bas.
          Plus haut que l'écran, il s'efface sous la section suivante : pas de
          bord visible quand le hero remonte sur le plan fixe. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-2 h-[160svh] rounded-t-[1.5rem] sm:inset-x-3 sm:top-3 sm:rounded-t-[2rem]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, color-mix(in oklab, var(--color-background) 45%, transparent), transparent 22%, color-mix(in oklab, var(--color-background) 85%, transparent) 58%, transparent)",
        }}
      />
      <div className="relative flex h-svh min-h-[34rem] flex-col p-2 sm:p-3">
        {/* Le menu, dans un onglet accroché au bord haut du cadre. */}
        <nav aria-label="Principale" className="mx-auto flex max-w-full items-center gap-0.5 rounded-b-2xl bg-background px-1.5 py-1.5 sm:gap-2 sm:px-5 sm:py-2">
          <a
            href="#sur-mesure"
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
          <h1 id="hero-titre" className="w-[86vw] max-w-[62rem] sm:w-[72vw] lg:w-[54vw]">
            <LogoBrouille
              nom="STALIKA, Digital & Conseil"
              lettres={LETTRES}
              hauteur={217}
              baseline={{ src: "/hero/logo/baseline.png", largeur: 1320, hauteur: 65, gauche: 206, ecart: 71 }}
              delai={0.3}
            />
            <span className="sr-only"> · sites sur mesure pour restaurants, coachs, artisans et commerces</span>
          </h1>

          <EntreeHero delai={1.2} className="max-w-md pb-2 lg:pb-5">
            {/* Les deux lignes de J (overlay, 2026-10-02), telles qu'il les a écrites. */}
            <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">
              Votre site sur mesure, dessiné pour vous en accord avec vos besoins. Tout type de profession libérale ou entreprise, première maquette en 72h
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85 sm:text-base">Audit de besoin IA en entreprise, création et accompagnement, avec vous</p>
            <Link
              href="/contact"
              className="group mt-5 inline-flex cursor-pointer items-center gap-3 rounded-full bg-foreground py-1.5 pl-5 pr-1.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Parlons de votre projet
              <span className="grid size-8 place-items-center rounded-full bg-background text-foreground transition-transform group-hover:translate-x-0.5">
                <Fleche />
              </span>
            </Link>
          </EntreeHero>
        </div>
      </div>
    </section>
  );
}
