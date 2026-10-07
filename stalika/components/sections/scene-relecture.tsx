"use client";

import { Check } from "lucide-react";
import { Scene } from "@/components/ui/scene";
import { MOUVEMENT } from "@/lib/mouvement";
import { cn } from "@/lib/utils";
import { FenetreRelecture } from "./relecture-fenetre";

/* ---------------------------------------------------------------------------
   Scène 4 · La relecture (la nuit), refaite le 2026-10-07 à la demande de J.

   Le plus de STALIKA : c'est le client qui décide et qui a la main. Il reçoit
   un lien, il édite son site à sa guise ; Julien regarde, écoute, échange, et
   met en place vite. La scène le montre sur le vrai site d'AR Transfert, le
   chauffeur VTC de Béziers : le client passe en mode Édition, réécrit un
   texte, retire une animation, commente une photo (`relecture-fenetre.tsx`).

   La scène suit le défilement : une piste plus haute que l'écran, dans
   laquelle le contenu reste collé (`position: sticky`, donc par le
   navigateur) ; le film avance avec le défilement, de l'instant où la fenêtre
   se colle au milieu de l'écran jusqu'à celui où elle se décolle. Sur
   ordinateur, le texte reste collé à côté de la fenêtre ; sur téléphone, il
   défile avant la piste, et la fenêtre seule reste collée. La fenêtre s'ajuste à la
   place qui lui reste dans l'écran (voir `relecture-fenetre.tsx`) : elle ne recouvre
   plus le titre sur un écran large mais court. La longueur de la piste et le lissage
   sont dans `MOUVEMENT.relecture`. Pour revenir à un film
   qui se joue seul à l'arrivée : retirer `defilement` de la scène, et la
   piste (`data-piste`) de la mise en page.

   Les éléments de cette scène ne portent plus `data-rebond` : le bouton qui
   tombe mesure les positions de la page au départ de sa chute, et un contenu
   collé n'a plus la même place une fois la piste engagée.
--------------------------------------------------------------------------- */

const RETOUCHES = ["Réécrire un texte", "Garder ou retirer une animation", "Commenter une photo"] as const;

/** Les trois retouches du film, qui se cochent à mesure qu'elles sont appliquées. */
function Retouches({ className }: { className?: string }) {
  return (
    <ol aria-label="Ce que le client peut retoucher" className={cn("space-y-2.5", className)}>
      {RETOUCHES.map((t, i) => (
        <li key={t} data-rang={i} className="flex items-center gap-3 text-sm">
          <span aria-hidden="true" className="relative grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-foreground/30">
            <span data-film-cache data-rang-plein className="absolute inset-0 grid place-items-center rounded-full bg-accent text-on-accent">
              <Check className="size-3" strokeWidth={3} />
            </span>
          </span>
          <span data-rang-label className="text-foreground">
            {t}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Le titre et le texte, une fois sur téléphone (avant la piste) et une fois sur ordinateur (dans la colonne collée). */
function Texte({ avecId = false }: { avecId?: boolean }) {
  return (
    <div>
      <p className="eyebrow text-accent">03 · La relecture</p>
      {/* Sur un écran court (un téléphone couché), la colonne collée n'a plus la place de tout dire : le titre rétrécit, le texte et la liste s'effacent. */}
      <h2 id={avecId ? "relecture-titre" : undefined} className="mt-3 text-2xl sm:text-3xl md:text-4xl [@media(max-height:560px)]:md:text-2xl">
        Le plus de STALIKA, c&apos;est vous qui décidez <span className="block text-accent">et avez la main</span>
      </h2>
      <p className="mt-4 text-sm text-muted-foreground md:text-base [@media(max-height:560px)]:md:hidden">
        Vous recevez un lien et vous éditez votre site à votre guise. De mon côté, je regarde, j&apos;écoute, j&apos;échange avec
        vous et je mets en place rapidement.
      </p>
    </div>
  );
}

export function SceneRelecture() {
  return (
    <Scene id="relecture" nuit defilement className="bg-transparent" src="components/sections/scene-relecture.tsx" aria-labelledby="relecture-titre">
      {/* Voile sur le ciel commun (composant Ciel, dans la page) : horizontal, pour que deux sections de nuit se raccordent sans couture. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 inset-y-0 bg-background/55 sm:inset-x-3 md:bg-transparent md:bg-linear-to-r md:from-background/90 md:via-background/55 md:to-background/25" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <div className="pb-6 pt-12 md:hidden">
          <Texte />
        </div>
        <div
          data-piste
          className="grid items-start md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12 motion-reduce:min-h-0!"
          style={{ minHeight: `${(1 + MOUVEMENT.relecture.ecrans) * 100}svh` }}
        >
          <div className="sticky top-0 hidden h-svh flex-col justify-center md:flex motion-reduce:static">
            <Texte avecId />
            <Retouches className="mt-8 [@media(max-height:560px)]:hidden" />
          </div>
          <div className="sticky top-0 flex h-svh flex-col py-6 motion-reduce:static">
            <FenetreRelecture pied={<Retouches className="rel-pied" />} />
          </div>
        </div>
      </div>
    </Scene>
  );
}
