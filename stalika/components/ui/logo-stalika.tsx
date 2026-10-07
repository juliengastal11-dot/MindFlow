import { LogoBrouille, type LogoBrouilleProps } from "@/components/ui/logo-brouille";
import { LOGO_JOUR, LOGO_NUIT } from "@/lib/logo";

/* ---------------------------------------------------------------------------
   Le logo STALIKA, partout où il paraît (demande de J, 2026-10-07 : « tous les
   logos avec les petites lettres qui bouclent aléatoirement ») : le héros, le
   menu des autres pages, le pied de page, l'espace privé. C'est toujours
   `LogoBrouille` : une lettre au hasard se rebrouille de temps en temps. Ce
   composant ne choisit que la version des couleurs, selon le fond.

   Il se dimensionne par sa largeur (la hauteur suit, 4,9 fois moins) : poser
   une classe `w-…` dessus.
--------------------------------------------------------------------------- */

export type LogoStalikaProps = Omit<LogoBrouilleProps, "lettres" | "hauteur" | "baseline" | "nom"> & {
  /** `jour` : pour un fond clair (lettres graphite) ; `nuit` : pour un fond sombre (lettres lin). */
  fond?: "jour" | "nuit";
  /** Ce que lit un lecteur d'écran. */
  nom?: string;
};

export function LogoStalika({ fond = "jour", nom = "Stalika, Digital & Conseil", ...reste }: LogoStalikaProps) {
  const logo = fond === "nuit" ? LOGO_NUIT : LOGO_JOUR;
  return <LogoBrouille nom={nom} lettres={logo.lettres} hauteur={logo.hauteur} baseline={logo.baseline} {...reste} />;
}
