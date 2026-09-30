"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Scene, useScene } from "@/components/ui/scene";
import { Trace } from "@/components/ui/trace";
import { Rouleaux } from "@/components/ui/rouleaux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { gsap } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Scène 5 · Livré (retour au jour). Quatre coches qui se cochent, puis la
   carte d'offre qui glisse en place : le prix reste immobile, seul le délai
   roule. Chronologie : blueprint §6.
--------------------------------------------------------------------------- */

const COCHES = [
  "Mentions légales et confidentialité en règle",
  "Sécurité vérifiée avant la mise en ligne",
  "Référencement soigné : titres, descriptions, plan du site, fiche Google",
  "Le code est à vous : vous partez quand vous voulez, avec votre site",
] as const;
const DEPARTS = [0.1, 0.22, 0.34, 0.46] as const;

function Offre() {
  const scene = useScene();
  const carte = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = carte.current;
    const z = zone.current;
    if (!c || !z || !scene) return;
    return scene.inscrire((tl) => {
      gsap.set(c, { y: 40, autoAlpha: 0 });
      tl.to(c, { y: 0, autoAlpha: 1, duration: 0.15 }, 0.4);
      gsap.set(z, { y: 16, autoAlpha: 0 });
      tl.to(z, { y: 0, autoAlpha: 1, duration: 0.1 }, 0.84);
    });
  }, [scene]);

  return (
    <Card
      ref={carte}
      data-film-cache
      className="border-accent p-8 shadow-[0_0_0_6px] shadow-accent/15"
    >
      <p className="font-display text-4xl md:text-5xl">À partir de 300 €</p>
      <p className="mt-2 text-muted-foreground">payable en plusieurs fois, sans frais</p>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
        <span>Première ébauche sous</span>
        <span className="font-display text-3xl tabular-nums">
          <Rouleaux valeur={72} chiffres={2} de={0.6} a={0.82} />
          &nbsp;h
        </span>
      </p>

      <div ref={zone} data-film-cache className="mt-6">
        <p className="text-muted-foreground">Partout en France, à distance</p>
        <Button asChild variant="accent" shape="pill" size="lg" className="mt-5">
          <Link href="/contact">Parlons de votre site</Link>
        </Button>
      </div>
    </Card>
  );
}

export function SceneLivre() {
  return (
    <Scene id="livre" className="bg-transparent" src="components/sections/scene-livre.tsx" aria-labelledby="livre-titre">
      {/* Voile sur le ciel commun (thème sombre hérité de Ciel), en fondu depuis le haut pour laisser voir le lever du jour. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 inset-y-0 bg-background/70 sm:inset-x-3 md:bg-transparent md:bg-linear-to-r md:from-background/90 md:via-background/55 md:to-background/5 [mask-image:linear-gradient(to_bottom,transparent,black_30%)]" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="space-y-8 md:grid md:grid-cols-2 md:items-center md:gap-12 md:space-y-0">
          <div>
            <p className="eyebrow text-encre">04 · Livré</p>
            <h2 id="livre-titre" className="mt-3 text-2xl sm:text-3xl md:text-4xl">
              Livré propre. Et il <span className="text-encre">vous appartient</span>.
            </h2>
            <ul className="mt-6 space-y-4">
              {COCHES.map((texte, i) => (
                <li key={texte} className="flex items-start gap-3">
                  <Trace
                    d="M5 12.5l4.5 4.5L19 7"
                    viewBox="0 0 24 24"
                    de={DEPARTS[i]}
                    a={DEPARTS[i] + 0.08}
                    epaisseur={2.5}
                    trait="stroke-encre"
                    className="mt-0.5 size-6 shrink-0 text-encre"
                  />
                  <span>{texte}</span>
                </li>
              ))}
            </ul>
          </div>
          <Offre />
        </div>
      </div>
    </Scene>
  );
}
