"use client";

import { useEffect, useRef } from "react";
import { Scene, useScene } from "@/components/ui/scene";
import { Orbites } from "@/components/ui/orbites";
import { Frappe } from "@/components/ui/frappe";
import { Barre } from "@/components/ui/barre";
import { Card } from "@/components/ui/card";
import { gsap } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Scène 4 · La relecture (la nuit). Une maquette de site sur laquelle un
   pointeur désigne une ligne, une bulle demande le changement, la ligne se
   barre et se réécrit, un tampon dit « appliqué ». Chronologie : blueprint §6.
--------------------------------------------------------------------------- */

function Maquette() {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s);
    const pointeur = q("[data-pointeur]");
    const pointille = q("[data-pointille]");
    const plein = q("[data-plein]");
    const bulle = q("[data-bulle]");
    const origine = q("[data-origine]");
    const tampon = q("[data-tampon]");
    const legende = q("[data-legende]");
    if (!pointeur || !pointille || !plein || !bulle || !origine || !tampon || !legende) return;

    return scene.inscrire((tl) => {
      gsap.set(pointeur, { x: 160, y: 140, autoAlpha: 0 });
      tl.to(pointeur, { x: 0, y: 0, autoAlpha: 1, duration: 0.12 }, 0.1);

      gsap.set(pointille, { autoAlpha: 0 });
      gsap.set(plein, { autoAlpha: 0 });
      tl.to(pointille, { autoAlpha: 1, duration: 0.08 }, 0.22);
      tl.to(plein, { autoAlpha: 1, duration: 0.04 }, 0.3);
      tl.to(pointille, { autoAlpha: 0, duration: 0.04 }, 0.3);

      gsap.set(bulle, { autoAlpha: 0, scale: 0.9, transformOrigin: "12% 0%" });
      tl.to(bulle, { autoAlpha: 1, scale: 1, duration: 0.1 }, 0.36);

      tl.to(origine, { autoAlpha: 0.5, duration: 0.04 }, 0.7);

      gsap.set(tampon, { autoAlpha: 0, scale: 1.4 });
      tl.to(tampon, { autoAlpha: 1, scale: 1, duration: 0.06 }, 0.9);

      gsap.set(legende, { autoAlpha: 0 });
      tl.to(legende, { autoAlpha: 1, duration: 0.06 }, 0.94);
    });
  }, [scene]);

  return (
    <div ref={ref} role="img" aria-label="Exemple de relecture, animé au défilement">
      <Card className="relative overflow-hidden">
        <div className="flex items-center gap-1.5 border-b px-4 py-3" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
        </div>

        <div className="relative space-y-3 p-5 text-sm md:p-6">
          <p className="font-display text-xl md:text-2xl">Votre restaurant</p>
          <div className="space-y-2" aria-hidden="true">
            <div className="h-2 w-full rounded-full bg-muted" />
            <div className="h-2 w-4/5 rounded-full bg-muted" />
          </div>

          <div className="relative pt-2">
            <div className="relative px-1 py-1">
              <span
                aria-hidden="true"
                data-pointille
                className="pointer-events-none absolute -inset-1 rounded-md opacity-0 outline-dashed outline-2 outline-accent"
              />
              <span
                aria-hidden="true"
                data-plein
                data-film-cache
                className="pointer-events-none absolute -inset-1 rounded-md outline outline-2 outline-accent"
              />
              <p data-origine className="relative">
                <Barre de={0.62} a={0.7}>
                  Ouvert du mardi au samedi
                </Barre>
              </p>
              <p className="relative min-h-[1.5em]">
                <Frappe texte="Ouvert du mardi au dimanche midi" de={0.72} a={0.88} />
              </p>
              <svg
                aria-hidden="true"
                data-pointeur
                data-film-cache
                viewBox="0 0 24 24"
                className="pointer-events-none absolute -bottom-2 right-6 size-6 fill-foreground"
              >
                <path d="M4 2l15 9-6.5 1.8L9.5 19z" />
              </svg>
            </div>

            <div
              data-bulle
              data-film-cache
              className="relative mt-4 w-fit max-w-full rounded-card bg-accent px-4 py-2.5 text-on-accent"
            >
              <span
                aria-hidden="true"
                className="absolute -top-1.5 left-5 size-3 rotate-45 rounded-[2px] bg-accent"
              />
              <Frappe texte="Ajoute le dimanche midi" de={0.4} a={0.58} />
            </div>
          </div>

          <span
            aria-hidden="true"
            data-tampon
            data-film-cache
            className="eyebrow absolute bottom-4 right-4 -rotate-6 rounded-md border-2 border-accent px-2 py-1 text-accent"
          >
            Appliqué · publié
          </span>
        </div>
      </Card>
      <p data-legende data-film-cache className="mt-3 text-sm text-muted-foreground">
        C&apos;est comme ça que la Pizzeria des Allées a relu son site.
      </p>
    </div>
  );
}

export function SceneRelecture() {
  return (
    <Scene nuit src="components/sections/scene-relecture.tsx" aria-labelledby="relecture-titre">
      <Orbites />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="space-y-8 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-12 md:space-y-0">
          <div>
            <p className="eyebrow text-accent">03 · La relecture</p>
            <h2 id="relecture-titre" className="mt-3 text-2xl sm:text-3xl md:text-4xl">
              Un mot à changer ? <span className="block text-accent">Changez-le sur la page.</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Vous recevez un lien. Vous relisez votre site en vrai, vous réécrivez un texte à sa place, vous gardez
              ou retirez une animation, vous commentez une photo. Puis j&apos;applique, et je publie. Rien ne casse.
            </p>
          </div>
          <Maquette />
        </div>
      </div>
    </Scene>
  );
}
