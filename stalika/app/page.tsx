import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { SceneRecherche } from "@/components/sections/scene-recherche";
import { SceneModele } from "@/components/sections/scene-modele";
import { SceneUtile } from "@/components/sections/scene-utile";
import { SceneRelecture } from "@/components/sections/scene-relecture";
import { SceneLivre } from "@/components/sections/scene-livre";
import { Confiance } from "@/components/sections/confiance";
import { Julien } from "@/components/sections/julien";
import { Faq } from "@/components/sections/faq";
import { Appel } from "@/components/sections/appel";
import { PiedDePage } from "@/components/sections/pied-de-page";
import { Consentement } from "@/components/sections/consentement";
import { JsonLd } from "@/components/seo/json-ld";

/* L'accueil est un film joué au défilement : cinq scènes épinglées, l'arc
   jour, nuit, jour du blueprint (§6), puis une fin calme. Chaque scène vit
   dans son fichier ; cette page ne fait qu'assembler, dans l'ordre. */

export const metadata: Metadata = {
  title: { absolute: "Stalika · Sites sur mesure, pas un modèle" },
  description:
    "Sites sur mesure pour restaurants, coachs, artisans et commerces. Pas un modèle : un site dessiné pour vous, première ébauche sous 72 h.",
  alternates: { canonical: "/" },
};

export default function Accueil() {
  return (
    <>
      <main id="contenu">
        <Hero />
        <SceneRecherche />
        <SceneModele />
        <SceneUtile />
        <SceneRelecture />
        <SceneLivre />
        <Confiance />
        <Julien />
        <Faq />
        <Appel />
      </main>
      <PiedDePage />
      <Consentement />
      <JsonLd />
    </>
  );
}
