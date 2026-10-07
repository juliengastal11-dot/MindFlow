/* ---------------------------------------------------------------------------
   Le logo STALIKA, découpé en sept lettres et une baseline, pour `LogoBrouille`
   (components/ui/logo-brouille.tsx). Les deux versions ont exactement la même
   géométrie, celle du logo validé par J : mêmes largeurs de lettres, même
   baseline. Seules les couleurs changent.

   - `LOGO_NUIT` : lettres lin, triangles camel, pour un fond sombre (le héros) ;
     les morceaux sont dans `public/hero/logo/`.
   - `LOGO_JOUR` : lettres graphite, triangles camel, pour un fond clair (le menu
     des autres pages, le pied de page, l'espace privé) ; les morceaux sont dans
     `public/logo/`, découpés le 2026-10-07 dans la planche de l'écran de la
     plongée (`public/hero/logo/ecran.png`, mêmes coupes que le héros).
--------------------------------------------------------------------------- */

/** Largeur de chaque lettre, en pixels, dans le fichier source (1 743 px en tout). */
const LARGEURS = [234, 267, 309, 246, 133, 285, 269] as const;

const morceaux = (dossier: string) => LARGEURS.map((largeur, i) => ({ src: `${dossier}/lettre-${i + 1}.png`, largeur }));

/** La baseline « Digital & Conseil », sous les lettres, dans le même repère. */
const baseline = (dossier: string) => ({ src: `${dossier}/baseline.png`, largeur: 1320, hauteur: 65, gauche: 206, ecart: 71 });

export const LOGO_NUIT = { lettres: morceaux("/hero/logo"), hauteur: 217, baseline: baseline("/hero/logo") } as const;
export const LOGO_JOUR = { lettres: morceaux("/logo"), hauteur: 217, baseline: baseline("/logo") } as const;
