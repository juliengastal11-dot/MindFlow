import Image from "next/image";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Navigateur : la fenêtre de navigateur de l'ordinateur du hero.

   À la fin de la plongée, on entre dans l'écran : la page affichée par
   l'ordinateur se détache de l'écran et grandit jusqu'à remplir le cadre
   (`EcranAccueil`, posé par `Plongee`). La section suivante reprend
   exactement la même fenêtre (`BarreNavigateur` en haut, fond clair), si
   bien qu'on reste « dans l'ordinateur » quand la page se met à défiler.

   La barre imite celle de l'écran de l'image (trois pastilles, une barre
   d'adresse), dans les jetons de la palette. Pas d'adresse de domaine : le
   nom de domaine du site n'est pas encore fixé, la barre montre le titre.
--------------------------------------------------------------------------- */

function Cadenas() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" strokeWidth="1.6" strokeLinecap="round" className="shrink-0 stroke-current">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
    </svg>
  );
}

export function BarreNavigateur({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-barre-navigateur
      className={cn("flex h-11 shrink-0 items-center gap-3 border-b bg-secondary px-4 sm:px-5", className)}
    >
      <span className="flex w-14 gap-1.5">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-primary" />
        <span className="size-2.5 rounded-full bg-muted-foreground/40" />
      </span>
      <span className="mx-auto flex h-7 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-background px-3 text-xs text-muted-foreground sm:max-w-md">
        <Cadenas />
        <span className="truncate">Stalika · Sites sur mesure</span>
      </span>
      <span className="w-14" />
    </div>
  );
}

/* La page de l'écran : la barre, puis le fond clair avec le logo au centre,
   comme le fond d'écran que la plongée dessine sur l'ordinateur. */
export function EcranAccueil() {
  return (
    <div className="jour flex h-full w-full flex-col bg-background">
      <BarreNavigateur />
      <div className="relative flex-1">
        <Image
          data-page-logo
          src="/hero/logo/ecran.png"
          alt=""
          width={1743}
          height={353}
          sizes="42vw"
          className="absolute left-1/2 top-[45%] h-auto w-[42%] -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  );
}
