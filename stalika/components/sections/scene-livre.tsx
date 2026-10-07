"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Arrivee } from "@/components/ui/arrivee";
import { FondPoints } from "@/components/ui/fond-points";
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

   Refaite le 2026-10-07 à la demande de J : la scène parle aussi de
   l'hébergement. Sous les coches, deux voies, « Chez vous » et « Chez moi »,
   arrivent l'une après l'autre, puis la ligne qui vaut pour les deux. La carte
   « à partir de 300 € » n'a pas bougé.

   Les faits sont ceux de J, donnés le même jour : chez lui, l'hébergement et
   la maintenance (mises à jour, surveillance, modifications à la demande dans
   la limite du raisonnable) se facturent par un petit abonnement mensuel, sans
   montant sur la page, comme la FAQ (« c'est écrit dans le devis ») ; chez le
   client, J livre le site prêt à publier et l'accompagne pour la mise en
   ligne ; dans les deux cas, le nom de domaine est au nom du client.
--------------------------------------------------------------------------- */

const COCHES = [
  "Mentions légales et confidentialité en règle",
  "Sécurité vérifiée avant la mise en ligne",
  "Référencement soigné : titres, descriptions, plan du site, fiche Google",
  "Le code est à vous : vous partez quand vous voulez, avec votre site",
] as const;
const DEPARTS = [0.06, 0.15, 0.24, 0.33] as const;

const VOIES = [
  {
    titre: "Chez vous",
    texte: "Vous avez déjà un hébergeur, ou vous préférez garder la main. Je vous livre le site prêt à publier et je vous accompagne pour le mettre en ligne.",
    de: 0.46,
  },
  {
    titre: "Chez moi",
    texte:
      "Je m'occupe de l'hébergement et de la maintenance : mises à jour, surveillance. Vous demandez une modification, je la fais, dans la limite du raisonnable. En échange, un petit abonnement mensuel.",
    de: 0.57,
  },
] as const;

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
        {/* Le prix ci-dessus est celui d'un site vitrine : un logiciel ou une application se parle d'abord. */}
        <p className="mt-1 text-muted-foreground">Un logiciel ou une application sur mesure ? Dites-moi ce qu&apos;il vous faut.</p>
        <Button asChild variant="accent" shape="pill" size="lg" className="mt-5">
          <Link href="/contact">Parlons de votre projet</Link>
        </Button>
      </div>
    </Card>
  );
}

export function SceneLivre() {
  return (
    <Scene id="livre" duree={3.4} src="components/sections/scene-livre.tsx" aria-labelledby="livre-titre">
      {/* Le fond en points de J (2026-10-07), derrière tout le contenu. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <FondPoints />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="space-y-8 md:grid md:grid-cols-2 md:items-center md:gap-12 md:space-y-0">
          <div>
            <p className="eyebrow text-encre">04 · Livré</p>
            <h2 id="livre-titre" className="mt-3 text-2xl sm:text-3xl md:text-4xl">
              Livré propre, <span className="block text-encre">hébergé comme vous voulez</span>
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
            <div className="mt-8 space-y-5">
              {VOIES.map((v) => (
                <Arrivee key={v.titre} de={v.de} className="border-t border-foreground/15 pt-3">
                  <h3 className="eyebrow font-sans text-encre">{v.titre}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/85 md:text-base">{v.texte}</p>
                </Arrivee>
              ))}
              <Arrivee de={0.68}>
                <p className="text-sm text-muted-foreground">
                  Dans les deux cas, le nom de domaine est à votre nom. Chaque projet se règle avec vous, un par un, et c&apos;est écrit dans le devis.
                </p>
              </Arrivee>
            </div>
          </div>
          <Offre />
        </div>
      </div>
    </Scene>
  );
}
