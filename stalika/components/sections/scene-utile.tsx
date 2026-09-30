"use client";

import { useEffect, useRef } from "react";
import { Scene, useScene } from "@/components/ui/scene";
import { Cascade } from "@/components/ui/cascade";
import { Trace } from "@/components/ui/trace";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Scène 3 · Utile (la nuit tombe sur la falaise du hero). Un bento de quatre cartes : les dessins de
   chaque carte se jouent sur la chronologie de la scène (blueprint §6).
   Rien ici n'est cliquable ni ne réagit au curseur.
--------------------------------------------------------------------------- */

const CRENEAUX = ["9h", "10h", "11h", "14h", "15h", "16h"] as const;
/* Index des créneaux qui se remplissent, et leur position dans la scène. */
const RESERVES: Record<number, number> = { 1: 0.3, 3: 0.4, 5: 0.5 };

const glyphe = "pointer-events-none absolute right-4 top-4 size-20 text-muted-foreground/40 md:size-24";

function GlypheAgenda() {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={glyphe}>
      <rect x="12" y="20" width="72" height="64" rx="8" />
      <path d="M12 38h72M32 12v14M64 12v14" />
      <path d="M28 54h8M44 54h8M60 54h8M28 68h8M44 68h8" />
    </svg>
  );
}

function GlypheCourbe() {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={glyphe}>
      <path d="M14 14v68h68" />
      <path d="M24 66l16-16 12 10 22-28" />
      <path d="M62 32h12v12" />
    </svg>
  );
}

function GlypheContrat() {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={glyphe}>
      <path d="M26 10h30l16 16v60H26z" />
      <path d="M56 10v16h16" />
      <path d="M36 44h26M36 56h26M36 68h14" />
    </svg>
  );
}

function GlypheItineraire() {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={glyphe}>
      <path d="M48 86C32 68 22 56 22 42a26 26 0 0 1 52 0c0 14-10 26-26 44z" />
      <circle cx="48" cy="42" r="9" />
    </svg>
  );
}

/* ---- Carte 1 : l'agenda ------------------------------------------------- */

function Agenda() {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    const couches = Array.from(el.querySelectorAll<HTMLElement>("[data-reserve]"));
    return scene.inscrire((tl) => {
      for (const couche of couches) {
        const pos = RESERVES[Number(couche.dataset.reserve)];
        gsap.set(couche, { scaleY: 0, transformOrigin: "50% 100%" });
        tl.to(couche, { scaleY: 1, duration: 0.06 }, pos);
      }
    });
  }, [scene]);

  return (
    <div ref={ref} className="grid grid-cols-3 gap-2">
      {CRENEAUX.map((h, i) => {
        const reserve = i in RESERVES;
        return (
          <div key={h} className="relative overflow-hidden rounded-md border px-2 py-3 text-center text-sm">
            <span>{h}</span>
            {reserve && <span className="sr-only"> Réservé</span>}
            {reserve && (
              <span
                aria-hidden="true"
                data-film-cache
                data-reserve={i}
                className="absolute inset-0 flex flex-col items-center justify-center bg-accent text-on-accent"
              >
                <span>{h}</span>
                <span className="text-xs font-medium">Réservé</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---- Carte 3 : le contrat ---------------------------------------------- */

function PageDessinee({ titre, className, ...props }: { titre: string } & React.ComponentProps<"div">) {
  return (
    <div className={cn("w-32 rounded-md border bg-muted p-3 shadow-sm", className)} {...props}>
      <p className="mb-2 text-xs font-medium">{titre}</p>
      <div className="space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-muted-foreground/30" />
        <div className="h-1.5 w-5/6 rounded-full bg-muted-foreground/30" />
        <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/30" />
      </div>
    </div>
  );
}

function Contrat() {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    const page = el.querySelector<HTMLElement>("[data-page]");
    const envoye = el.querySelector<HTMLElement>("[data-envoye]");
    if (!page || !envoye) return;
    return scene.inscrire((tl) => {
      gsap.set(page, { y: 24, autoAlpha: 0 });
      gsap.set(envoye, { autoAlpha: 0 });
      tl.to(page, { y: 0, autoAlpha: 1, duration: 0.1 }, 0.45);
      tl.to(envoye, { autoAlpha: 1, duration: 0.08 }, 0.6);
    });
  }, [scene]);

  return (
    <div ref={ref} className="flex items-center gap-4">
      <div className="relative h-28 w-44 shrink-0">
        <PageDessinee titre="Contrat" className="absolute left-0 top-0" />
        <PageDessinee titre="Signé" data-page data-film-cache className="absolute left-10 top-5" />
      </div>
      <div className="flex items-center gap-2">
        <Trace
          d="M5 12.5l4.5 4.5L19 7"
          viewBox="0 0 24 24"
          de={0.6}
          a={0.68}
          epaisseur={2.5}
          className="size-7 shrink-0"
        />
        <span data-envoye data-film-cache className="text-sm font-medium">
          Envoyé
        </span>
      </div>
    </div>
  );
}

/* ---- Carte 4 : avis et itinéraire -------------------------------------- */

const ETOILE = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z";

function Avis() {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    const etoiles = Array.from(el.querySelectorAll<HTMLElement>("[data-etoile]"));
    const bouton = el.querySelector<HTMLElement>("[data-itineraire]");
    if (!bouton) return;
    return scene.inscrire((tl) => {
      etoiles.forEach((etoile, i) => {
        gsap.set(etoile, { autoAlpha: 0.25, scale: 0.8, transformOrigin: "50% 50%" });
        tl.to(etoile, { autoAlpha: 1, scale: 1, duration: 0.04 }, 0.5 + i * 0.04);
      });
      gsap.set(bouton, { autoAlpha: 0, y: 12 });
      tl.to(bouton, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.75);
    });
  }, [scene]);

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-1" role="img" aria-label="4,8 sur 5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} data-etoile data-film-cache aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-accent">
              <path d={ETOILE} />
            </svg>
          ))}
        </div>
        <p className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl">4,8</span>
          <span className="text-sm text-muted-foreground">sur 5</span>
        </p>
      </div>
      <div
        aria-hidden="true"
        data-itineraire
        data-film-cache
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "pointer-events-none w-fit cursor-default hover:bg-transparent",
        )}
      >
        Itinéraire
      </div>
    </div>
  );
}

/* ---- La scène ---------------------------------------------------------- */

export function SceneUtile() {
  return (
    <Scene id="utile" nuit className="bg-transparent" src="components/sections/scene-utile.tsx" aria-labelledby="utile-titre">
      {/* Voile sur le ciel commun (composant Ciel, dans la page) : horizontal, pour que deux sections de nuit se raccordent sans couture. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 inset-y-0 bg-background/55 sm:inset-x-3 md:bg-transparent md:bg-linear-to-r md:from-background/85 md:via-background/40 md:to-background/15" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-8 max-w-2xl md:mb-10">
          <p className="eyebrow text-accent">02 · Utile</p>
          <h2 id="utile-titre" className="mt-3 text-2xl sm:text-3xl md:text-4xl">
            Un site qui <span className="text-accent">travaille</span>, pas une plaquette.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            Réservation avec agenda, espace client, contrat en PDF, avis et itinéraire : ce que vos clients font
            aujourd&apos;hui au téléphone, votre site peut le faire à leur place.
          </p>
        </div>

        <Cascade className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-6">
          <Card className="relative overflow-hidden md:row-span-2">
            <GlypheAgenda />
            <CardHeader>
              <CardTitle className="font-display">Réservation avec agenda</CardTitle>
              <CardDescription>Le créneau se prend en trois gestes, et le doublon est impossible.</CardDescription>
            </CardHeader>
            <CardContent>
              <Agenda />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden md:col-span-2">
            <GlypheCourbe />
            <CardHeader>
              <CardTitle className="font-display">Espace client</CardTitle>
              <CardDescription>Chacun retrouve ses séances, ses documents, sa progression.</CardDescription>
            </CardHeader>
            <CardContent>
              <Trace
                d="M6 100C40 98 62 92 92 78S150 58 190 46S270 20 314 10"
                viewBox="0 0 320 120"
                de={0.35}
                a={0.75}
                epaisseur={3}
                titre="Progression"
                className="h-20 w-full md:h-24"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Semaine 1</span>
                <span>Progression</span>
                <span>Semaine 8</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <GlypheContrat />
            <CardHeader>
              <CardTitle className="font-display">Contrat en PDF</CardTitle>
              <CardDescription>Rempli, signé, envoyé, sans rien imprimer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Contrat />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <GlypheItineraire />
            <CardHeader>
              <CardTitle className="font-display">Avis et itinéraire</CardTitle>
              <CardDescription>Les étoiles de votre fiche Google, et le chemin jusqu&apos;à votre porte.</CardDescription>
            </CardHeader>
            <CardContent>
              <Avis />
            </CardContent>
          </Card>
        </Cascade>
      </div>
    </Scene>
  );
}
