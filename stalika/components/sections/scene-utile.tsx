"use client";

import { Scene } from "@/components/ui/scene";
import { Reveal } from "@/components/ui/reveal";
import { SaaSCarousel } from "@/components/demos/saas-carousel";

/* ---------------------------------------------------------------------------
   Scène 3 · Utile (la nuit tombe sur la falaise du hero) : la création de
   logiciels et d'applications.

   Sous le titre, un carrousel de trois logiciels en démonstration (demande
   de J, 2026-10-02) : Carnet (chantiers), RelancePro (devis et factures) et
   Contrôle (checklists et incidents). Chaque carte montre une vraie
   interface qui se sert toute seule, en boucle (components/demos). Il
   remplace le bento de quatre cartes (agenda, espace client, contrat, avis),
   qui parlait de sites.
--------------------------------------------------------------------------- */

export function SceneUtile() {
  return (
    <Scene id="utile" nuit className="bg-transparent" src="components/sections/scene-utile.tsx" aria-labelledby="utile-titre">
      {/* Voile sur le ciel commun (composant Ciel, dans la page) : horizontal, pour que deux sections de nuit se raccordent sans couture. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 inset-y-0 bg-background/55 sm:inset-x-3 md:bg-transparent md:bg-linear-to-r md:from-background/85 md:via-background/40 md:to-background/15" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-8 max-w-2xl md:mb-10">
          <p className="eyebrow text-accent">02 · Utile</p>
          <h2 id="utile-titre" data-rebond="" className="mt-3 text-2xl sm:text-3xl md:text-4xl">
            Création de logiciels et applications <span className="text-accent">personnalisés</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            <strong className="font-semibold text-foreground">Vous avez un problème, il y a forcément une solution.</strong> Je
            crée des SaaS, des CRM et des logiciels sur mesure : l&apos;outil qui automatise vos tâches et vous fait gagner des
            heures, pensé pour votre activité.
          </p>
        </div>

        <Reveal>
          <SaaSCarousel />
        </Reveal>
      </div>
    </Scene>
  );
}
