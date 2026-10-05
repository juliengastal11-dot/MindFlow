import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Plongee } from "@/components/ui/plongee";
import { Ciel } from "@/components/ui/ciel";
import { Discussion } from "@/components/ui/discussion";
import { ECRANS_PLONGEE } from "@/lib/plongee-ecran";
import { CADRAGE_MOBILE } from "@/lib/ciel";
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
  title: { absolute: "Stalika · Sites, logiciels et applications sur mesure" },
  description:
    "Sites, logiciels et applications sur mesure pour restaurants, coachs, artisans et commerces. Pas un modèle. Première ébauche de site sous 72 h.",
  alternates: { canonical: "/" },
};

export default function Accueil() {
  return (
    <>
      <main id="contenu">
        {/* Un seul plan du hero jusqu'à la discussion (demande de J) : la vidéo
            du hero en haut de page (la caméra s'approche, un nuage arrive de la
            gauche, traverse le plateau et se déverse dans le vide, puis elle
            recule), puis la même falaise dont l'heure avance au
            défilement, en un seul mouvement régulier. 111 images tirées de cinq
            passages Kling bout à bout : lumière du hero → crépuscule (1 à 21),
            → nuit (22 à 41), la nuit où le personnage s'étire (42 à 71),
            → aube (72 à 91), → lumière dorée, première image de la plongée
            (92 à 111). */}
        <Ciel
          bureau={{ dossier: "/ciel/bureau", nombre: 111 }}
          mobile={{ dossier: "/ciel/mobile", nombre: 111 }}
          cadrageMobile={CADRAGE_MOBILE}
          jalons={[
            [0.08, 0],
            [1, 110],
          ]}
          // Étoiles filantes pendant la nuit, dans la bande de ciel au-dessus des nuages.
          cometes={{ de: 30, a: 82, hauteur: 0.13 }}
          reperes={{ accueil: 0, "sur-mesure": 0.3, utile: 0.5, relecture: 0.7, "ciel-fin": 1 }}
          video={{
            bureau: { webm: "/hero/video.webm", mp4: "/hero/video.mp4" },
            // Même recadrage que la série mobile du ciel : aucun saut au premier défilement.
            mobile: { webm: "/hero/video-mobile.webm", mp4: "/hero/video-mobile.mp4" },
            duree: 20,
            retour: {
              bureau: { dossier: "/hero/recul/bureau", nombre: 30 },
              mobile: { dossier: "/hero/recul/mobile", nombre: 30 },
            },
            recul: 0.08,
          }}
          alt="Un plateau d'herbe au-dessus d'une mer de nuages ; une personne travaille sur un ordinateur, au bord de la falaise, près d'une cabane. La lumière passe du coucher du soleil à la nuit étoilée, puis à l'aube."
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
              // Le dernier passage du ciel se termine sur la première image de la plongée
              // (imposée à Kling comme image d'arrivée) : aucun écart de cadrage.
              echelle: 1,
              x: 0,
              y: 0,
              bureau: { x: 0, y: 0, l: 1, h: 1 },
              // La série mobile du ciel (mesures dans lib/ciel.ts).
              mobile: CADRAGE_MOBILE,
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
