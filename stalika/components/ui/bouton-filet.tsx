import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Le bouton « Filet d'or » (J, 2026-10-18, piste choisie parmi trois, à la place
   du Cyber Button de 21st) : un cadre d'un seul fil doré, deux coins appuyés
   (haut gauche, bas droit), le texte en capitales très espacées comme la
   baseline « Digital & Conseil ». Au survol, l'or monte du bas et remplit le
   bouton, le texte passe en noir. (Sans flèche depuis le 2026-10-21, J : le
   libellé s'écrit à la plume, comme le cadre.)

   Idées : « Fill Up » et « Arrow Push » d'animatedbuttons (Colorion), redits
   avec les jetons du thème. Le cadre, les coins et le texte portent des
   repères (`data-filet-…`) : `EntreeDessin` s'en sert pour dessiner le bouton
   à la main à son arrivée ; le cadre CSS est le trait définitif.

   `asChild` : les classes vont sur l'enfant (un lien), comme le Cyber Button
   qu'il remplace ; c'est ce que `BoutonChute` attend, pour le vrai lien comme
   pour la copie qui tombe.
--------------------------------------------------------------------------- */

const BOUTON =
  "relative inline-flex h-12 cursor-pointer select-none items-center justify-center whitespace-nowrap px-7 text-xs font-medium uppercase tracking-[0.34em] text-foreground outline-none transition-[color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-on-accent group-hover:shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--color-accent)_60%,transparent)] active:translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Les couches du bouton : le remplissage du survol, le cadre, les deux coins, et le calque où se dessine le trait d'arrivée. */
function Couches() {
  return (
    <>
      {/* le remplissage, dans sa propre boîte qui le coupe : les coins et le trait débordent, eux */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute inset-0 translate-y-[101%] bg-linear-to-t from-accent to-[color-mix(in_oklab,var(--color-accent)_70%,var(--color-lin))] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
      </span>
      <span data-filet-cadre="" aria-hidden="true" className="pointer-events-none absolute inset-0 border border-accent/75" />
      <span data-filet-coin="hg" aria-hidden="true" className="pointer-events-none absolute -left-px -top-px size-[7px] border-l-2 border-t-2 border-accent transition-colors duration-500 group-hover:border-encre" />
      <span data-filet-coin="bd" aria-hidden="true" className="pointer-events-none absolute -bottom-px -right-px size-[7px] border-b-2 border-r-2 border-accent transition-colors duration-500 group-hover:border-encre" />
      <svg data-filet-trait="" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible text-accent" />
    </>
  );
}

export type BoutonFiletProps = { children: React.ReactElement<{ className?: string; children?: React.ReactNode }>; className?: string };

/** Le Filet d'or, posé sur son enfant (un lien ou un `span`). */
export function BoutonFilet({ children, className }: BoutonFiletProps) {
  const enfant = children;
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <Couches />
      {React.cloneElement(
        enfant,
        { className: cn(BOUTON, enfant.props.className) },
        <span data-filet-texte="" className="relative z-10 inline-flex items-center gap-3.5">
          {enfant.props.children}
        </span>,
      )}
    </span>
  );
}
