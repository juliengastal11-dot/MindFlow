import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Plongee } from "@/components/ui/plongee";
import { Ciel } from "@/components/ui/ciel";
import { Discussion } from "@/components/ui/discussion";
import { ECRANS_PLONGEE } from "@/lib/plongee-ecran";
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
        {/* Le hero, puis la plongée dans l'ordinateur au défilement (Kling 3.0,
            du plan figé du hero au gros plan sur l'écran) : 61 images. Le
            focus de départ reprend le cadrage de la vidéo mobile du hero. */}
        <Plongee
          images={{ dossier: "/hero/plongee", nombre: 61 }}
          ecran={{ x: 0.3, y: 0.4, l: 0.275, h: 0.32 }}
          focus={{ debut: { x: 0.31, y: 0.5 }, fin: { x: 0.44, y: 0.55 } }}
          logo={{
            src: "/hero/logo/ecran.png",
            lettres: [234, 267, 309, 246, 133, 285, 269],
            hauteurLettres: 217,
            coins: ECRANS_PLONGEE,
          }}
          raccord={{
            // Mesuré sur l'image 241 du hero et l'image 1 de la plongée : écart quadratique moyen 30,8 → 15,6 sur 255, en niveaux de gris.
            echelle: 1.155,
            x: 0.031,
            y: 0.056,
            bureau: { x: 0, y: 0, l: 1, h: 1 },
            // La vidéo mobile du hero : 560 × 1000 px pris à (320, 76) dans l'image de 1928 × 1076.
            mobile: { x: 320 / 1928, y: 76 / 1076, l: 560 / 1928, h: 1000 / 1076 },
          }}
          fenetre={<Discussion />}
          alt="La caméra s'approche du personnage assis au bord de la falaise, passe derrière son épaule et entre dans l'écran de son ordinateur, où le logo Stalika est affiché."
        >
          <Hero />
        </Plongee>
        {/* Un seul plan derrière l'histoire : la falaise du hero, du crépuscule
            à l'aube, dont l'heure avance avec le défilement (passages Kling
            mis bout à bout : 49 images). Heure de chaque section, de 0 à 1 :
            la nuit tombe entre Sur mesure et Utile, le jour se lève avant Livré. */}
        <Ciel
          bureau={{ dossier: "/ciel/bureau", nombre: 49 }}
          mobile={{ dossier: "/ciel/mobile", nombre: 49 }}
          reperes={{ "sur-mesure": 0.04, utile: 0.42, relecture: 0.52, livre: 0.97 }}
        >
          <SceneModele />
          <SceneUtile />
          <SceneRelecture />
          <SceneLivre />
        </Ciel>
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
