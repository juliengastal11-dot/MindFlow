/* ---------------------------------------------------------------------------
   Les dix questions de la conversation `/contact`, source unique.

   La page de contact les déroule une à une, l'action serveur valide les
   réponses contre ces libellés, et l'espace privé les relit avec les mêmes
   intitulés. Pur : aucune dépendance, importable partout.

   Les textes sont ceux de `CONTENU.md`, tels quels. Chaque `id` est une
   colonne du modèle `Demande` (prisma/schema.prisma), sauf `contact`, qui se
   range en deux colonnes : `contactMode` et `contactValeur`.
--------------------------------------------------------------------------- */

export type Question =
  | {
      id: "prenom" | "demandeClients" | "siteAime";
      type: "texte";
      question: string;
      indication: string;
      facultatif?: boolean;
    }
  | {
      id: "activite" | "situation" | "actifs" | "budget" | "delai";
      type: "choix";
      question: string;
      choix: readonly string[];
      /** Le choix qui ouvre un champ libre, et l'indication de ce champ. */
      autre?: { choix: string; indication: string };
    }
  | {
      id: "objectifs";
      type: "choixMultiple";
      question: string;
      mention: string;
      choix: readonly string[];
      bouton: string;
    }
  | {
      id: "contact";
      type: "contact";
      question: string;
      choix: readonly ["Sur WhatsApp", "Par e-mail"];
      indications: { whatsapp: string; email: string };
      consentement: string;
      bouton: string;
    };

export const QUESTIONS: readonly Question[] = [
  { id: "prenom", type: "texte", question: "D'abord, comment on vous appelle ?", indication: "Votre prénom" },
  {
    id: "activite",
    type: "choix",
    question: "Vous faites quoi dans la vie ?",
    choix: ["Restaurant, bar, traiteur", "Coach, sport, bien-être", "Artisan, bâtiment", "Boutique, commerce", "Autre"],
    autre: { choix: "Autre", indication: "Dites-moi" },
  },
  {
    id: "situation",
    type: "choix",
    question: "Et côté site, vous en êtes où ?",
    choix: ["Aucun site", "Une page Instagram ou Facebook, c'est tout", "Un site que je n'aime plus", "Un site à améliorer"],
  },
  {
    id: "objectifs",
    type: "choixMultiple",
    question: "Le site doit servir à quoi, avant tout ?",
    mention: "Plusieurs réponses possibles",
    choix: [
      "Être trouvé sur Google",
      "Prendre des réservations ou des rendez-vous",
      "Recevoir des demandes de devis",
      "Montrer mon travail",
      "Vendre en ligne",
    ],
    bouton: "Voilà",
  },
  {
    id: "demandeClients",
    type: "texte",
    question: "Une question que vos clients vous posent tout le temps ?",
    indication: "Vous êtes ouverts le dimanche ?",
    facultatif: true,
  },
  {
    id: "actifs",
    type: "choix",
    question: "Vous avez déjà un logo, des photos ?",
    choix: ["Les deux", "Le logo seulement", "Des photos seulement", "Rien encore"],
  },
  {
    id: "siteAime",
    type: "texte",
    question: "Un site que vous aimez, pour l'ambiance ?",
    indication: "Une adresse, ou juste ce qui vous plaît",
    facultatif: true,
  },
  {
    id: "budget",
    type: "choix",
    question: "Quel budget vous avez en tête ?",
    choix: ["Autour de 300 €", "Entre 300 et 800 €", "Plus de 800 €", "Je ne sais pas encore"],
  },
  {
    id: "delai",
    type: "choix",
    question: "Pour quand ?",
    choix: ["Le plus tôt possible", "Dans le mois", "Dans quelques mois", "Je regarde, c'est tout"],
  },
  {
    id: "contact",
    type: "contact",
    question: "Où je vous réponds ?",
    choix: ["Sur WhatsApp", "Par e-mail"],
    indications: { whatsapp: "Votre numéro", email: "Votre adresse e-mail" },
    consentement: "J'accepte que Julien garde ces réponses pour me répondre. Rien d'autre.",
    bouton: "Envoyer à Julien",
  },
] as const;

/** Les textes autour des questions, eux aussi de `CONTENU.md`. */
export const CONVERSATION = {
  accueil: "Salut, moi c'est Julien. Dix questions, cinq minutes, et je reviens vers vous avec une première idée. On y va ?",
  boutonAccueil: "On y va",
  retour: "Modifier ma réponse précédente",
  passer: "Passer",
  valider: "C'est noté",
  succes: (prenom: string) =>
    `Merci ${prenom} ! Je reviens vers vous sous 72 heures avec une première idée. En attendant, si c'est urgent : WhatsApp.`,
  boutonSucces: "Écrire sur WhatsApp",
  lienSucces: "Retour à l'accueil",
  erreurs: {
    prenom: "Il me faut au moins votre prénom.",
    contact: "Il me faut un moyen de vous répondre.",
    consentement: "Cochez la case pour que je puisse garder vos réponses.",
    envoi: "Ça n'est pas parti. Réessayez, ou écrivez-moi sur WhatsApp.",
    debit: "Doucement : réessayez dans quelques minutes, ou écrivez-moi sur WhatsApp.",
  },
} as const;

/** Le libellé d'une question, pour l'espace privé. */
export function libelleQuestion(id: Question["id"]): string {
  return QUESTIONS.find((q) => q.id === id)?.question ?? id;
}

/** Séparateur des réponses multiples en base (colonne `objectifs`). */
export const SEPARATEUR_MULTIPLE = "|";
