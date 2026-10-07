"use client";

import { Link2, MessagesSquare, Palette } from "lucide-react";
import { CarteRealisation } from "@/components/sections/carte-realisation";
import { Arrivee } from "@/components/ui/arrivee";
import { Decode } from "@/components/ui/decode";
import { Roue } from "@/components/ui/roue";
import { Scene } from "@/components/ui/scene";
import { REALISATIONS } from "@/lib/realisations";

/* ---------------------------------------------------------------------------
   Scène 2 · Sur mesure (le crépuscule, sur le ciel commun).

   À gauche, la roue des sites (demande de J, 2026-10-01) : quatre sites de
   Julien, chacun en action, AR Transfert en tête (2026-10-04). Elle tourne seule, on l'attrape, on la lance ; le
   site de face défile dans sa carte, au doigt sur téléphone, après un clic à
   la souris. À droite, ce que « sur mesure » veut dire. Même disposition sur
   téléphone : la roue à gauche, le texte à droite.

   La chronologie de la scène : la roue arrive lancée et se pose sur la
   première carte (0 à 0,92) ; le mot se décode (0,3 à 0,85) ; le texte et
   les trois points arrivent ensuite. L'eyebrow et le titre sont là dès le
   début.
--------------------------------------------------------------------------- */

// Une icône par point à la place du tiret (demande de J, 2026-10-02). Lucide, le jeu que
// les composants de 21st utilisent : palette pour les envies, bulles pour les échanges, lien pour le lien.
const POINTS = [
  { icone: Palette, titre: "Selon vos envies", texte: "couleurs, ton, animations : on choisit ensemble, rien n'est imposé." },
  { icone: MessagesSquare, titre: "Beaucoup d'échanges", texte: "vous me racontez votre métier, je vous montre, vous réagissez." },
  {
    icone: Link2,
    titre: "Un lien pour corriger",
    texte: "une fois la première maquette élaborée, vous recevez un lien de visualisation qui vous permet aussi d'éditer. Je reçois vos commentaires et je mets à jour à votre guise.",
  },
  // « Au-delà du site » (logiciels et applications) est passé dans la section 02, à la demande de J (2026-10-02).
] as const;

export function SceneModele() {
  return (
    <Scene id="sur-mesure" nuit className="min-h-0 bg-transparent" src="components/sections/scene-modele.tsx" aria-labelledby="modele-titre">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3.5 py-3 sm:px-6 md:py-6">
        <div className="grid grid-cols-[minmax(0,43fr)_minmax(0,57fr)] items-center gap-3 sm:gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-10">
          <Roue
            label="Quatre sites, quatre styles"
            legendes={REALISATIONS.map((r) => ({ titre: r.nom, sous: r.sous }))}
            visitable
            className="h-[min(80svh,660px)] [--roue-ext-d:30px] [--roue-ext-g:14px] [--roue-h:calc(var(--roue-l)/0.6)] [--roue-l:min(38vw,200px)] md:h-[min(90svh,880px)] md:[--roue-ext-d:28px] md:[--roue-ext-g:28px] md:[--roue-l:clamp(220px,22vw,290px)] md:[--roue-x:36%]"
            rendu={(i, etat, actions) => <CarteRealisation site={REALISATIONS[i]} etat={etat} actions={actions} />}
          />

          <div className="sur-ciel min-w-0">
            <p className="eyebrow text-accent">01 · Sur mesure</p>
            <h2 id="modele-titre" data-rebond="" className="mt-2.5 font-display text-[1.1875rem] leading-[1.15] sm:text-3xl md:mt-4 md:text-4xl md:leading-[1.1]">
              Pas un modèle rempli à la chaîne
              <span className="mt-1.5 block md:mt-2">
                Un site dessiné <Decode mots={["pour vous", "pour votre métier", "pour vos clients"]} de={0.3} a={0.85} className="text-accent" />
              </span>
            </h2>
            <Arrivee de={0.42}>
              <p data-rebond="" className="mt-3 text-[0.8125rem] leading-relaxed text-foreground/85 sm:text-base md:mt-6 md:text-lg">
                Chaque site part d&apos;une page blanche et naît de nos échanges et réflexions. Votre métier, vos clients, vos envies. Tout est modifiable à volonté, jusqu&apos;à satisfaction.
              </p>
            </Arrivee>
            <ul data-rebond="" className="mt-3.5 space-y-2.5 md:mt-8 md:space-y-4">
              {POINTS.map((point, i) => (
                <li key={point.titre}>
                  <Arrivee de={0.56 + i * 0.08} className="flex gap-2.5 md:gap-3.5">
                    <point.icone aria-hidden="true" strokeWidth={1.75} className="mt-[0.12em] size-3.5 shrink-0 text-accent md:size-[1.15rem]" />
                    <p className="text-[0.75rem] leading-snug text-foreground/80 sm:text-sm md:text-base">
                      <strong className="font-semibold text-foreground">{point.titre}</strong> : {point.texte}
                    </p>
                  </Arrivee>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Scene>
  );
}
