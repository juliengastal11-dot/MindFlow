"use client";

import { useEffect, useRef } from "react";
import { CarteMetier } from "@/components/sections/carte-metier";
import { Champ3D } from "@/components/ui/champ3d";
import { Decode } from "@/components/ui/decode";
import { Orbites } from "@/components/ui/orbites";
import { Scene, useScene } from "@/components/ui/scene";
import { gsap } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Scène 2 · Pas un modèle (la nuit).

   Le champ et le mot qui se décode portent le film ; le paragraphe arrive en
   dernier, de 0,82 à 0,95. L'eyebrow et le titre sont là dès le début.
--------------------------------------------------------------------------- */

const METIERS = [
  "Restaurant",
  "Coach",
  "Artisan",
  "Boutique",
  "Cabinet",
  "Traiteur",
  "Photographe",
  "Salon",
  "Association",
] as const;

const ITEMS = METIERS.map((nom) => ({
  avant: <CarteMetier nom="Modèle" modele />,
  apres: <CarteMetier nom={nom} />,
}));

function Paragraphe({ children }: { children: React.ReactNode }) {
  const scene = useScene();
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!scene || !el) return;
    return scene.inscrire((tl) => {
      gsap.set(el, { autoAlpha: 0, y: 16 });
      tl.to(el, { autoAlpha: 1, y: 0, duration: 0.13 }, 0.82);
    });
  }, [scene]);

  return (
    <p ref={ref} data-film-cache className="mt-4 max-w-xl text-base md:mt-6 md:text-lg">
      {children}
    </p>
  );
}

export function SceneModele() {
  return (
    <Scene id="sur-mesure" nuit src="components/sections/scene-modele.tsx" aria-labelledby="modele-titre">
      <Orbites />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-12">
          <div>
            <p className="eyebrow text-accent">01 · Sur mesure</p>
            <h2
              id="modele-titre"
              className="mt-3 font-display text-2xl sm:text-3xl md:mt-4 md:text-4xl"
            >
              Pas un modèle rempli à la chaîne.
              <span className="mt-2 block">
                Un site dessiné{" "}
                {/* Le point vit dans chaque mot : la largeur est réservée sur le plus
                    long, un point posé après resterait loin du mot court. */}
                <Decode
                  mots={["pour vous.", "pour votre métier.", "pour vos clients."]}
                  de={0.3}
                  a={0.85}
                  className="text-accent"
                />
              </span>
            </h2>
            <Paragraphe>
              {
                "Un outil à modèles vous donne le même site qu'au voisin, avec votre nom dedans. Moi, je pars de vous : votre image, votre façon de travailler, ce que vos clients vous demandent."
              }
            </Paragraphe>
          </div>
          <Champ3D
            label="Neuf sites, tous différents"
            de={0}
            a={0.9}
            items={ITEMS}
            className="mt-8 md:mt-0"
          />
        </div>
      </div>
    </Scene>
  );
}
