/* ---------------------------------------------------------------------------
   Identité du site pour tout ce qui sort du HTML : titres et descriptions,
   image de partage, robots.txt, sitemap, URL canoniques, et le seul moyen de
   contact affiché pour l'instant, WhatsApp.

   Fichier-contrat, réglé une fois au bootstrap, comme le thème et le
   mouvement. Tout ce que les moteurs de recherche et les réseaux sociaux
   voient du site part d'ici ; un nom changé ici change partout.

   Pur : aucun accès à la base, importable depuis un composant navigateur
   (le bouton WhatsApp en a besoin).

   L'URL publique vient de l'environnement : en développement, localhost ;
   en production, `NEXT_PUBLIC_SITE_URL` dans `.env`, à confirmer par
   l'utilisateur au moment de la mise en ligne. Sur l'aperçu Vercel, sans
   cette variable, c'est l'adresse de production du projet, que Vercel
   fournit lui-même (`NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`, sans le
   protocole).
--------------------------------------------------------------------------- */

const urlVercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const SITE = {
  nom: "Stalika",
  /** Une phrase, 150 caractères au plus : c'est celle que Google affiche. */
  description:
    "Sites, logiciels et applications sur mesure pour restaurants, coachs, artisans et commerces. Pas un modèle. Première ébauche de site sous 72 h.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? (urlVercel ? `https://${urlVercel}` : "http://localhost:3000"),
  locale: "fr_FR",

  /** Pages publiques listées dans le sitemap. */
  pages: ["/", "/contact"] as readonly string[],

  /** Chemins tenus hors des moteurs : back-office, API, connexion, outils de dev. */
  prives: ["/admin", "/api/", "/connexion", "/blueprint"] as readonly string[],

  /**
   * Couleurs de l'image de partage. Pas des tokens Tailwind : cette image est
   * rendue hors CSS, en PNG. Calées sur le logo camel : fond sombre de la palette, lin, camel clair.
   */
  partage: { fond: "#1a1a18", texte: "#f8f7f2", accent: "#d4bc8b" },

  /** Le numéro de Julien, en international pour le lien wa.me, et tel qu'il s'affiche. */
  whatsapp: "33645748608",
  whatsappAffiche: "06 45 74 86 08",

  /** Qui parle sur le site : Julien, en son nom. */
  auteur: "Julien Gastal",
  zone: "Toute la France",
};

/** Adresse absolue d'un chemin du site, pour les canoniques et le sitemap. */
export function urlAbsolue(chemin = "/"): string {
  return new URL(chemin, SITE.url).toString();
}

/** Le lien WhatsApp, avec un premier message déjà écrit pour ne pas laisser la personne devant un champ vide. */
export function lienWhatsApp(message = "Bonjour Julien, je viens de votre site Stalika."): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}
