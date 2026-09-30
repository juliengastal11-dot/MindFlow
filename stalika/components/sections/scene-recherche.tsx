"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Frappe } from "@/components/ui/frappe";
import { Scene, useScene } from "@/components/ui/scene";
import { BarreNavigateur } from "@/components/ui/navigateur";
import { gsap } from "@/lib/gsap";
import { lienWhatsApp } from "@/lib/site";

/* ---------------------------------------------------------------------------
   Scène 1 · Ils vous cherchent : dans l'ordinateur du hero.

   La plongée se termine sur la page de l'écran, en plein cadre (`Plongee`,
   `EcranAccueil`). Cette scène reprend exactement la même fenêtre : même
   cadre, même barre de navigateur, même fond clair. Elle est remontée d'un
   écran (`-mt-[100svh]`) pour se trouver pile sous la page de la plongée, qui
   lui laisse la place tout au bout ; sa chronologie ne part qu'à ce moment
   (`declencheur`), quand son haut touche le haut de l'écran.

   Chronologie (fractions de la scène) :
   0    → 0,2   le texte entre, ligne à ligne, comme une page qui se charge
   0,08 → 0,42  la frappe (primitive Frappe)
   0,45 → 0,62  les trois suggestions se déplient une à une
   0,64 → 0,70  la première se surligne
   0,74 → 0,90  la barre et la liste glissent vers le haut, la phrase de fin arrive
--------------------------------------------------------------------------- */

const SUGGESTIONS = [
  "pizzeria ouverte ce soir près de moi",
  "pizzeria avis",
  "pizzeria livraison",
] as const;

function Loupe() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 stroke-current text-muted-foreground"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}


/* Les enfants directs entrent l'un après l'autre sur la chronologie de la scène. */
function EntreePage({ children }: { children: React.ReactNode }) {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!scene || !el) return;
    const enfants = Array.from(el.children) as HTMLElement[];
    return scene.inscrire((tl) => {
      gsap.set(enfants, { autoAlpha: 0, y: 12 });
      enfants.forEach((e, i) => tl.to(e, { autoAlpha: 1, y: 0, duration: 0.1 }, i * 0.035));
    });
  }, [scene]);

  return <div ref={ref}>{children}</div>;
}

function Sequence() {
  const scene = useScene();
  const bloc = useRef<HTMLDivElement>(null);
  const fin = useRef<HTMLParagraphElement>(null);
  const surlignage = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = bloc.current;
    if (!scene || !el) return;
    const lignes = Array.from(el.querySelectorAll<HTMLElement>("[data-suggestion]"));

    return scene.inscrire((tl) => {
      gsap.set(lignes, { autoAlpha: 0, y: 8 });
      if (surlignage.current) gsap.set(surlignage.current, { autoAlpha: 0 });
      if (fin.current) gsap.set(fin.current, { autoAlpha: 0, y: 16 });

      const pas = 0.17 / lignes.length;
      lignes.forEach((ligne, i) => {
        tl.to(ligne, { autoAlpha: 1, y: 0, duration: pas }, 0.45 + i * pas);
      });

      if (surlignage.current) {
        tl.to(surlignage.current, { autoAlpha: 1, duration: 0.06 }, 0.64);
      }

      tl.to(el, { y: -24, opacity: 0.6, duration: 0.16 }, 0.74);
      if (fin.current) {
        tl.to(fin.current, { autoAlpha: 1, y: 0, duration: 0.16 }, 0.74);
      }
    });
  }, [scene]);

  return (
    <>
      <div className="mt-6 md:mt-10">
        <div
          ref={bloc}
          role="img"
          aria-label="Exemple de recherche, animé au défilement"
          className="w-full max-w-2xl"
        >
          <div className="overflow-hidden rounded-card border bg-card text-card-foreground">
            <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-4">
              <Loupe />
              <span className="font-sans text-base md:text-lg">
                <Frappe texte="pizzeria ouverte ce soir" de={0.08} a={0.42} />
              </span>
            </div>
            <ul className="border-t">
              {SUGGESTIONS.map((s, i) => (
                <li
                  key={s}
                  data-suggestion
                  data-film-cache
                  className="relative flex items-center gap-3 px-4 py-2 text-sm md:px-5 md:py-2.5 md:text-base"
                >
                  {i === 0 && (
                    <span
                      ref={surlignage}
                      aria-hidden="true"
                      data-film-cache
                      className="absolute inset-0 bg-muted"
                    />
                  )}
                  <span className="relative">
                    <Loupe />
                  </span>
                  <span className="relative">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p
        ref={fin}
        data-film-cache
        className="mt-5 font-display text-xl md:mt-8 md:text-2xl"
      >
        Et là, il tombe sur vous. Ou sur un autre.
      </p>
    </>
  );
}

export function SceneRecherche() {
  return (
    // Le cadre sombre autour de la fenêtre, comme autour du hero.
    <div className="relative z-0 -mt-[100svh] bg-foreground p-2 motion-reduce:mt-0 sm:p-3">
      <Scene
        id="contenu-suite"
        src="components/sections/scene-recherche.tsx"
        aria-labelledby="recherche-titre"
        declencheur="top 3%"
        className="min-h-[calc(100svh-1rem)] flex-col items-stretch rounded-[1.5rem] sm:min-h-[calc(100svh-1.5rem)] sm:rounded-[2rem]"
      >
        <BarreNavigateur />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-14 md:py-20">
          <EntreePage>
            <p className="eyebrow text-encre">En ce moment, quelque part en France</p>
            <h2
              id="recherche-titre"
              className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl md:mt-4 md:text-5xl"
            >
              {"Quelqu'un cherche ce que vous faites."}
              <span className="block text-encre">Maintenant.</span>
            </h2>
            <p className="mt-3 max-w-xl text-base md:mt-5 md:text-lg">
              Sur son téléphone, entre deux rues. Ce qu&apos;il trouve en premier décide s&apos;il vous
              appelle.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-7">
              <Button
                asChild
                variant="accent"
                shape="pill"
                size="lg"
                className="h-11 px-6 sm:h-12 sm:px-8"
              >
                <Link href="/contact">Parlons de votre site</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                shape="pill"
                size="lg"
                className="h-11 px-6 sm:h-12 sm:px-8"
              >
                <a href={lienWhatsApp()} target="_blank" rel="noopener">
                  Écrire sur WhatsApp
                </a>
              </Button>
            </div>
          </EntreePage>
          <Sequence />
        </div>
      </Scene>
    </div>
  );
}
