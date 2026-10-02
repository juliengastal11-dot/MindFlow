"use client";

import { useEffect, useRef } from "react";
import { CarteRealisation } from "@/components/sections/carte-realisation";
import { Decode } from "@/components/ui/decode";
import { Roue } from "@/components/ui/roue";
import { Scene, useScene } from "@/components/ui/scene";
import { gsap } from "@/lib/gsap";
import { REALISATIONS } from "@/lib/realisations";

/* ---------------------------------------------------------------------------
   Scène 2 · Sur mesure (le crépuscule, sur le ciel commun).

   À gauche, la roue des sites (demande de J, 2026-10-01) : trois sites de
   Julien, chacun en action. Elle tourne seule, on l'attrape, on la lance ; le
   site de face défile dans sa carte, au doigt sur téléphone, après un clic à
   la souris. À droite, ce que « sur mesure » veut dire. Même disposition sur
   téléphone : la roue à gauche, le texte à droite.

   La chronologie de la scène : la roue arrive lancée et se pose sur la
   première carte (0 à 0,92) ; le mot se décode (0,3 à 0,85) ; le texte et
   les trois points arrivent ensuite. L'eyebrow et le titre sont là dès le
   début.
--------------------------------------------------------------------------- */

const POINTS = [
  { titre: "Selon vos envies", texte: "couleurs, ton, animations : on choisit ensemble, rien n'est imposé." },
  { titre: "Beaucoup d'échanges", texte: "vous me racontez votre métier, je vous montre, vous réagissez." },
  { titre: "Un lien pour corriger", texte: "vous cliquez sur ce que vous voulez changer, à votre guise, et j'applique." },
] as const;

/** Un bloc qui arrive en montant, à la position `de` de la chronologie. */
function Arrivee({ de, className, children }: { de: number; className?: string; children: React.ReactNode }) {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!scene || !el) return;
    return scene.inscrire((tl) => {
      gsap.set(el, { autoAlpha: 0, y: 16 });
      tl.to(el, { autoAlpha: 1, y: 0, duration: 0.13, ease: "power2.out" }, de);
    });
  }, [scene, de]);

  return (
    <div ref={ref} data-film-cache className={className}>
      {children}
    </div>
  );
}

export function SceneModele() {
  return (
    <Scene id="sur-mesure" nuit className="bg-transparent" src="components/sections/scene-modele.tsx" aria-labelledby="modele-titre">
      {/* Voile sur le ciel commun : partout sur téléphone ; sur ordinateur, plus
          dense à droite, sous le texte, pour laisser la roue dans le ciel. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 inset-y-0 bg-background/60 sm:inset-x-3 md:bg-transparent md:bg-linear-to-l md:from-background/90 md:via-background/50 md:to-background/10" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3.5 py-8 sm:px-6 md:py-12">
        <div className="grid grid-cols-[minmax(0,43fr)_minmax(0,57fr)] items-center gap-3 sm:gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-10">
          <Roue
            label="Trois sites, trois styles"
            legendes={REALISATIONS.map((r) => ({ titre: r.nom, sous: r.sous }))}
            visitable
            className="h-[min(80svh,660px)] [--roue-ext-d:30px] [--roue-ext-g:14px] [--roue-h:calc(var(--roue-l)/0.6)] [--roue-l:min(38vw,200px)] md:h-[min(90svh,880px)] md:[--roue-ext-d:28px] md:[--roue-ext-g:28px] md:[--roue-l:clamp(220px,22vw,290px)] md:[--roue-x:36%]"
            rendu={(i, etat, actions) => <CarteRealisation site={REALISATIONS[i]} etat={etat} actions={actions} />}
          />

          <div className="min-w-0">
            <p className="eyebrow text-accent">01 · Sur mesure</p>
            <h2 id="modele-titre" data-rebond="" className="mt-2.5 font-display text-[1.1875rem] leading-[1.15] sm:text-3xl md:mt-4 md:text-4xl md:leading-[1.1]">
              Pas un modèle rempli à la chaîne.
              <span className="mt-1.5 block md:mt-2">
                Un site dessiné{" "}
                {/* Le point vit dans chaque mot : la largeur est réservée sur le plus
                    long, un point posé après resterait loin du mot court. */}
                <Decode mots={["pour vous.", "pour votre métier.", "pour vos clients."]} de={0.3} a={0.85} className="text-accent" />
              </span>
            </h2>
            <Arrivee de={0.42}>
              <p data-rebond="" className="mt-3 text-[0.8125rem] leading-relaxed text-foreground/85 sm:text-base md:mt-6 md:text-lg">
                Chaque site part d&apos;une page blanche : votre métier, vos clients, vos envies. Rien n&apos;est figé tant que vous n&apos;avez pas dit oui.
              </p>
            </Arrivee>
            <ul data-rebond="" className="mt-3.5 space-y-2.5 md:mt-8 md:space-y-4">
              {POINTS.map((point, i) => (
                <li key={point.titre}>
                  <Arrivee de={0.56 + i * 0.08} className="flex gap-2.5 md:gap-3.5">
                    <span aria-hidden="true" className="mt-[0.45em] h-px w-3 shrink-0 bg-accent md:w-5" />
                    <p className="text-[0.75rem] leading-snug text-muted-foreground sm:text-sm md:text-base">
                      <strong className="font-semibold text-foreground">{point.titre}</strong> : {point.texte}
                    </p>
                  </Arrivee>
                </li>
              ))}
            </ul>
            <Arrivee de={0.84}>
              <p className="mt-4 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-accent/90 md:mt-9 md:text-xs">
                Attrapez la roue : aucun site ne ressemble au voisin.
              </p>
            </Arrivee>
          </div>
        </div>
      </div>
    </Scene>
  );
}
