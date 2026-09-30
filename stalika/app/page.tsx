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

/* L'accueil : le hero, puis le même paysage dont l'heure change sous trois
   scènes, la plongée dans l'ordinateur jusqu'à la discussion, l'offre, puis
   une fin calme. Chaque scène vit dans son fichier ; cette page ne fait
   qu'assembler, dans l'ordre. */

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
        {/* Juste sous le hero, le même paysage reste en fond et l'heure avance
            avec le défilement (passages Kling mis bout à bout : 49 images) :
            crépuscule pour Sur mesure, nuit pour Utile et La relecture, puis
            le jour se lève. C'est cette dernière image, l'aube, qui mène au
            zoom dans l'ordinateur et à la discussion (demande de J). */}
        <Ciel
          bureau={{ dossier: "/ciel/bureau", nombre: 49 }}
          mobile={{ dossier: "/ciel/mobile", nombre: 49 }}
          reperes={{ "sur-mesure": 0.04, utile: 0.42, relecture: 0.52, "ciel-aube": 1 }}
        >
          <SceneModele />
          <SceneUtile />
          <SceneRelecture />
          {/* Repère : l'aube est complète quand ce point passe au milieu de l'écran,
              juste avant que la plongée ne prenne le relais. */}
          <div id="ciel-aube" aria-hidden="true" className="h-px" />
          {/* La plongée dans l'ordinateur (Kling 3.0, du plan large au gros plan
              sur l'écran, 61 images), posée dans le cadre du ciel. */}
          <Plongee
            images={{ dossier: "/hero/plongee", nombre: 61 }}
            ecran={{ x: 0.3, y: 0.4, l: 0.275, h: 0.32 }}
            focus={{ debut: { x: 0.3, y: 0.5 }, fin: { x: 0.44, y: 0.55 } }}
            logo={{
              src: "/hero/logo/ecran.png",
              lettres: [234, 267, 309, 246, 133, 285, 269],
              hauteurLettres: 217,
              coins: ECRANS_PLONGEE,
            }}
            raccord={{
              // Mesuré sur la dernière image du ciel (l'aube) et l'image 1 de la
              // plongée, sur les contours : même cadrage, seule la lumière change.
              echelle: 1.005,
              x: 0,
              y: 0,
              bureau: { x: 0, y: 0, l: 1, h: 1 },
              // La série mobile du ciel : 600 px de large pris à 277 px dans l'image de 1924.
              mobile: { x: 277 / 1924, y: 0, l: 600 / 1924, h: 1 },
            }}
            fenetre={<Discussion />}
            alt="La caméra s'approche du personnage assis au bord de la falaise, passe derrière son épaule et entre dans l'écran de son ordinateur, où le logo Stalika est affiché."
          />
        </Ciel>
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
