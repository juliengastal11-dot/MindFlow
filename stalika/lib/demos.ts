/* ---------------------------------------------------------------------------
   Les trois logiciels montrés en démonstration dans la section 02 (demande de
   J, 2026-10-02 ; VTBON a remplacé RelancePro le 2026-10-07) : tous leurs
   textes, à part des interfaces (`components/demos/*-preview.tsx`) et de leurs
   animations (`components/demos/*-animation.ts`). VTBON a son propre écran :
   les deux maquettes de son site (`components/demos/vtbon/`).

   Des données fictives, écrites pour paraître vraies : des noms courants, des
   montants ronds sans l'être trop, des dates qui se suivent jusqu'au jour de
   la démo (le 2 octobre). Pas un mot de marketing dans les interfaces : on y
   lit ce qu'un vrai logiciel affiche.

   Typographie : espace fine insécable entre les milliers ( ), espace
   insécable avant « € », « % » et « °C » ( ).
--------------------------------------------------------------------------- */

/** Les cartes : ce qui se lit autour de la fenêtre. */
export const PRODUITS = {
  carnet: {
    nom: "Carnet",
    description: "Le suivi de vos chantiers : tâches, photos, réserves et compte-rendu, au même endroit.",
    statut: "Démo",
    /** L'heure de la barre d'état du téléphone : celle de la scène. */
    heure: "10:24",
    resume:
      "Démonstration de Carnet : on ouvre le chantier Dupont, deux tâches passent à Terminé, une photo s'ajoute, puis le compte-rendu se crée à partir du chantier.",
  },
  /* VTBON : l'application de J (le 2026-10-07, à la place de RelancePro). Ses textes sont ceux
     de vtbon.fr (`lib/i18n/fr.ts` du dépôt vtbon-site) : « bon », « facture », « relance »,
     le vouvoiement, ni tiret long ni point d'exclamation. L'écran de son téléphone est celui
     de ses deux maquettes (`components/demos/vtbon/`), qui portent leurs propres données. */
  vtbon: {
    nom: "VTBON",
    description: "Le bon de transport dicté à la voix, la facture qui suit, et la relance quand un paiement tarde.",
    statut: "Bientôt disponible",
    resume:
      "Démonstration de VTBON : le chauffeur dicte sa course, les champs du bon se remplissent et le bon part en image sur WhatsApp ; puis une facture est générée, passe en retard et reçoit sa lettre de relance.",
  },
  controle: {
    nom: "Contrôle",
    description: "Les contrôles de vos équipes, et chaque anomalie suivie jusqu'à ce qu'elle soit réglée.",
    statut: "Démo",
    heure: "22:41",
    resume:
      "Démonstration de Contrôle : pendant le contrôle de fermeture, le frigo n°2 affiche 9,2 °C ; un incident s'ouvre avec une photo et un commentaire, Thomas en devient responsable, et l'historique se remplit.",
  },
} as const;

/* --- Carnet : la gestion de chantiers -------------------------------------- */

export const CARNET = {
  entreprise: "Atelier Morel",
  utilisateur: "KM",
  nav: ["Chantiers", "Planning", "Équipe", "Documents"],
  vue: "Mes chantiers",
  enCours: "3 en cours",
  nouveau: "Nouveau chantier",
  filtres: ["En cours", "Planifiés", "Terminés"],
  colonnes: ["Chantier", "Progression", "Statut", "Fin prévue"],
  chantiers: [
    { client: "Dupont", travaux: "Rénovation salle de bain", progression: 72, statut: "En cours", fin: "14 oct.", equipe: ["KM", "LB"] },
    { client: "Martin", travaux: "Terrasse bois", progression: 40, statut: "En cours", fin: "24 oct.", equipe: ["AR"] },
    { client: "Entreprise Garcia", travaux: "Local commercial", progression: 12, statut: "Démarrage", fin: "28 nov.", equipe: ["KM", "AR", "LB"] },
  ],
  detail: {
    titre: "Chantier Dupont",
    adresse: "Rénovation salle de bain · 12 rue des Lilas, Lyon 3e",
    statut: "En cours",
    progression: "Progression",
    valeur: "72 %",
    onglets: ["Tâches", "Photos", "Compte-rendu", "Équipe", "Réserves"],
    reserves: "1",
  },
  /* Dans l'ordre d'affichage. Les deux premières passent à « Terminé » pendant la démo. */
  taches: [
    { label: "Pose carrelage", qui: "KM", fait: false },
    { label: "Installation douche", qui: "LB", fait: false },
    { label: "Raccordement plomberie", qui: "LB", fait: true },
  ],
  aFaire: "À faire",
  termine: "Terminé",
  photos: {
    titre: "4 photos",
    ajouter: "Ajouter",
    envoi: "Envoi…",
    liste: [
      { matiere: "sol", legende: "Sol", date: "29/09" },
      { matiere: "plomberie", legende: "Plomberie", date: "30/09" },
      { matiere: "douche", legende: "Douche", date: "01/10" },
      { matiere: "faience", legende: "Faïence", date: "02/10" },
    ],
  },
  compteRendu: {
    vide: "Aucun compte-rendu pour cette semaine",
    aide: "Il reprend les tâches terminées, les photos et les réserves du chantier.",
    bouton: "Créer le compte-rendu",
    enCours: "Création…",
    titre: "Compte-rendu du chantier",
    meta: "Chantier Dupont · 2 octobre 2026",
    rubrique: "Travaux réalisés",
    travaux: ["Pose du carrelage", "Installation de la douche", "Raccordement plomberie"],
    reserve: "Réserve : joint silicone à reprendre",
    suite: "Prochaine intervention : lundi 6 octobre",
    format: "PDF · 1 page",
    envoyer: "Envoyer au client",
  },
  notification: "Compte-rendu prêt",
} as const;

/* --- Contrôle : les checklists et les incidents ----------------------------- */

export const CONTROLE = {
  entreprise: "Le Comptoir",
  utilisateur: "CR",
  nav: ["Aujourd'hui", "Checklists", "Incidents", "Équipe", "Historique"],
  vue: "Aujourd'hui",
  liste: {
    titre: "Contrôle fermeture",
    meta: "Jeu. 2 oct. · 22:40 · Équipe du soir",
    avancement: "4/5",
    points: [
      { label: "Frigos", heure: "22:31", qui: "T" },
      { label: "Nettoyage", heure: "22:34", qui: "L" },
      { label: "Caisse", heure: "22:36", qui: "T" },
      { label: "Sols", heure: "22:38", qui: "K" },
    ],
    releve: {
      label: "Température frigo n°2",
      seuil: "Seuil 0 à 4 °C",
      horsSeuil: "Hors seuil · 0 à 4 °C",
      vide: "— °C",
      chiffres: ["9", ",", "2"],
      unite: " °C",
    },
    signaler: "Signaler",
  },
  incident: {
    titre: "Nouvel incident",
    numero: "#248",
    ouvert: "Ouvert",
    enCours: "En cours",
    equipement: "Frigo n°2",
    releve: "9,2 °C · seuil 4 °C",
    commentaire: "Température trop élevée.",
    auteur: "Léa",
    heure: "22:41",
    champs: [
      { label: "Responsable", valeur: "Thomas" },
      { label: "Action", valeur: "Vérifier le frigo" },
      { label: "Échéance", valeur: "Demain à 10:00" },
    ],
    choisir: "Choisir…",
    equipe: ["Thomas", "Léa", "Karim"],
  },
  historique: {
    titre: "Historique",
    lignes: [
      { texte: "Incident créé", heure: "22:41" },
      { texte: "Responsable assigné · Thomas", heure: "22:41" },
      { texte: "Action en cours", heure: "22:42" },
    ],
  },
  notification: "Thomas est prévenu",
} as const;

export type Ton = "neutre" | "produit" | "succes" | "attente" | "retard";
