/* ---------------------------------------------------------------------------
   Les trois logiciels montrés en démonstration dans la section 02 (demande de
   J, 2026-10-02) : tous leurs textes, à part des interfaces
   (`components/demos/*-preview.tsx`) et de leurs animations
   (`components/demos/*-animation.ts`).

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
    pourQui: "Pour les artisans et les entreprises du bâtiment",
    description: "Le suivi de vos chantiers : tâches, photos, réserves et compte-rendu, au même endroit.",
    fonctions: ["Chantiers", "Tâches", "Photos", "Comptes-rendus", "Réserves", "Planning"],
    statut: "Démo",
    resume:
      "Démonstration de Carnet : on ouvre le chantier Dupont, deux tâches passent à Terminé, une photo s'ajoute, puis le compte-rendu se crée à partir du chantier.",
  },
  relance: {
    nom: "RelancePro",
    pourQui: "Pour les TPE, les indépendants et les petites entreprises",
    description: "Vos devis et vos factures suivis jusqu'au paiement, et des relances qui partent à temps.",
    fonctions: ["Factures", "Devis", "Échéances", "Relances", "Paiements", "Historique"],
    statut: "Démo",
    resume:
      "Démonstration de RelancePro : la facture n°124 de M. Martin a dépassé son échéance ; on ouvre le message de relance, on l'envoie, et l'historique de la facture se complète.",
  },
  controle: {
    nom: "Contrôle",
    pourQui: "Pour les restaurants, les commerces et les hôtels",
    description: "Les contrôles de vos équipes, et chaque anomalie suivie jusqu'à ce qu'elle soit réglée.",
    fonctions: ["Checklists", "Contrôles", "Incidents", "Photos", "Responsables", "Historique"],
    statut: "Démo",
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

/* --- RelancePro : le suivi des devis et des factures ------------------------ */

export const RELANCE = {
  entreprise: "Lenoir & Fils",
  utilisateur: "SL",
  nav: ["Tableau de bord", "Factures", "Devis", "Clients", "Relances"],
  vue: "Tableau de bord",
  indicateurs: [
    { label: "À encaisser", valeur: "4 490 €", ton: "neutre" },
    { label: "En retard", valeur: "1 240 €", ton: "retard" },
    { label: "Payé en septembre", valeur: "8 920 €", ton: "succes" },
  ],
  titreListe: "À relancer aujourd'hui",
  aRelancer: [
    { client: "Martin", initiales: "M", piece: "Facture #124", montant: "1 240 €", statut: "En retard · 7 j", ton: "retard" },
    { client: "Dupont", initiales: "D", piece: "Facture #131", montant: "2 800 €", statut: "Échéance demain", ton: "attente" },
    { client: "Garcia", initiales: "G", piece: "Devis D-087", montant: "450 €", statut: "Devis sans réponse", ton: "neutre" },
  ],
  facture: {
    numero: "Facture #124",
    client: "Martin",
    montant: "1 240,00 €",
    retard: "Échéance dépassée",
    alerte: "7 jours de retard · échéance le 25/09",
    details: [
      { label: "Émise le", valeur: "15/09/2026" },
      { label: "Échéance", valeur: "25/09/2026" },
      { label: "Règlement", valeur: "Virement" },
      { label: "Pièce", valeur: "Facture-124.pdf" },
    ],
    relancer: "Relancer",
    payee: "Marquer payée",
    relancee: "Relance envoyée",
  },
  message: {
    titre: "Message de relance",
    a: "M. Martin",
    objet: "Facture n°124 en attente de règlement",
    corps: [
      "Bonjour Monsieur Martin,",
      "Sauf erreur de notre part, la facture n°124 reste en attente de règlement.",
    ],
    signature: ["Bien cordialement,", "Sophie Lenoir"],
    piece: "Facture-124.pdf",
    annuler: "Annuler",
    envoyer: "Envoyer la relance",
    envoi: "Envoi…",
    envoye: "Relance envoyée",
  },
  historique: {
    titre: "Historique",
    lignes: [
      { date: "02/10", texte: "Relance envoyée" },
      { date: "28/09", texte: "Premier rappel" },
      { date: "15/09", texte: "Facture créée" },
    ],
  },
  notification: "Relance envoyée à M. Martin",
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
