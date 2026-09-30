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
        {/* Un seul plan du hero jusqu'à la discussion (demande de J) : la vidéo
            du hero en haut de page, puis la même falaise dont l'heure avance
            au défilement, en un seul mouvement régulier. 51 images : la
            lumière du hero (1), les passages Kling crépuscule → nuit → aube
            (2 à 50), la première image de la plongée (51). */}
        <Ciel
          bureau={{ dossier: "/ciel/bureau", nombre: 51 }}
          mobile={{ dossier: "/ciel/mobile", nombre: 51 }}
          cadrageMobile={{ x: 277 / 1924, y: 0, l: 600 / 1924, h: 1 }}
          jalons={[
            [0, 0],
            [0.2, 1],
            [0.5, 25],
            [0.8, 49],
            [1, 50],
          ]}
          // Étoiles filantes pendant la nuit (images 15 à 37), dans la bande de ciel
          // au-dessus des nuages (13 % du haut de l'image).
          cometes={{ de: 14, a: 36, hauteur: 0.13 }}
          reperes={{ accueil: 0, "sur-mesure": 0.3, utile: 0.5, relecture: 0.7, "ciel-fin": 1 }}
          video={{
            bureau: { webm: "/hero/video.webm", mp4: "/hero/video.mp4" },
            mobile: { webm: "/hero/video-mobile.webm", mp4: "/hero/video-mobile.mp4" },
            duree: 20,
            // Zoom de l'image 241 par rapport à l'image 1, mesuré (quasi linéaire entre les deux).
            zoom: { echelle: 1.16, x: 0.031, y: 0.056 },
            // La vidéo mobile : 560 × 1000 px pris à (320, 76) dans chaque image de 1928 × 1076.
            recadrageMobile: { x: 320 / 1928, y: 76 / 1076, l: 560 / 1928, h: 1000 / 1076 },
          }}
          alt="Un plateau d'herbe au-dessus d'une mer de nuages ; une personne travaille sur un ordinateur, au bord de la falaise. La lumière passe du coucher du soleil à la nuit, puis à l'aube."
        >
          <Hero />
          <SceneModele />
          <SceneUtile />
          <SceneRelecture />
          {/* Repère : la lumière dorée est revenue (dernière image du ciel, qui est
              la première de la plongée) quand ce point passe au milieu de l'écran. */}
          <div id="ciel-fin" aria-hidden="true" className="h-px" />
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
              // La dernière image du ciel EST la première de la plongée : aucun écart.
              echelle: 1,
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
