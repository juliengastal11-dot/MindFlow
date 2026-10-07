# Stalika · CONTENU

Chaque ligne que le visiteur lira, section par section. Les agents câblent ces lignes telles
quelles : aucune reformulation, aucun texte de leur cru. Une ligne qui manque s'écrit
`[[À CONFIRMER PAR L'UTILISATEUR : …]]` et se signale dans le rapport.

Voix : Julien parle en son nom (« je »), et vouvoie le visiteur. Ton familier, phrases courtes,
aucun tiret long. Le mot en accent d'un titre est indiqué entre `*astérisques*`.

---

## Commun

- Lien d'évitement : `Aller au contenu`
- Nav · logo : `Stalika` (monogramme + mot)
- Nav · bouton : `Contact` → `/contact`
- Nav · lien : `WhatsApp` → lien wa.me, message pré-écrit : `Bonjour Julien, je viens de votre site Stalika.`
- Indice de défilement (accueil, sous le héros) : `Faites défiler : la suite se joue sous vos doigts.`

## Bandeau de consentement (statistiques)

- Texte : `Des statistiques de visite, avec votre accord. Elles m'aident à savoir ce qui vous a été utile. Rien n'est déposé tant que vous n'avez pas répondu.`
- Bouton 1 : `D'accord`
- Bouton 2 (même poids) : `Non merci`
- Lien : `En savoir plus` → `/confidentialite#cookies`

---

## Accueil `/`

Titre d'onglet : `Stalika · Sites, logiciels et applications sur mesure` (adapté le 2026-10-02, à la demande de J, pour les logiciels et applications ; avant : `Stalika · Sites sur mesure, pas un modèle`)
Description (150 caractères au plus ; reprise par l'image de partage et les données structurées) : `Sites, logiciels et applications sur mesure pour restaurants, coachs, artisans et commerces. Pas un modèle. Première ébauche de site sous 72 h.`

### Héros actuel (le haut de page, avec le nom géant)

Textes de J, posés par l'overlay le 2026-10-02, tels qu'il les a écrits (à droite du nom) :

- Ligne 1 : `Votre site sur mesure, dessiné et pensé pour vous, en accord avec vos besoins.`
- Ligne 2 : `Audit de besoin IA en entreprise, création de logiciels personnalisés et accompagnement` (J a ajouté « de logiciels personnalisés » et retiré « , avec vous », overlay du 2026-10-02)
- Ligne 3 : `Tout type de profession libérale ou entreprise, première maquette en 72h` (c'était la seconde phrase de sa première ligne ; il l'a fait passer après la ligne de l'audit, overlay du 2026-10-02)
- Bouton : `Parlons projet` → `/contact` (demande de J, 2026-10-02 : « écris juste dans le bouton : Parlons projet »). C'est un Cyber Button de 21st (capitales en police mono, flèche) : premier clic, il se décroche et se balance au menu ; second clic, il tombe de scène en scène jusqu'à l'ordinateur (`components/ui/bouton-chute.tsx`). Sans JavaScript ou en mouvement réduit, c'est un simple lien vers `/contact`.

La description des moteurs de recherche (`Description` plus haut) ne change pas.

### Scène 1 · Ils vous cherchent (héros)

- Eyebrow : `En ce moment, quelque part en France`
- H1 : `Quelqu'un cherche ce que vous faites. *Maintenant.*`
- Texte : `Sur son téléphone, entre deux rues. Ce qu'il trouve en premier décide s'il vous appelle.`
- Barre de recherche, texte qui se tape : `pizzeria ouverte ce soir`
- Suggestions (dans l'ordre) : `pizzeria ouverte ce soir près de moi` · `pizzeria avis` · `pizzeria livraison`
- Suggestion choisie : la première
- Phrase de fin de scène : `Et là, il tombe sur vous. Ou sur un autre.`
- Bouton principal : `Parlons de votre site` → `/contact`
- Bouton secondaire : `Écrire sur WhatsApp` → wa.me
- Libellé accessible de la barre : `Exemple de recherche, animé au défilement`

### Scène 2 · Pas un modèle

- Eyebrow : `01 · Sur mesure`
- H2 : `Pas un modèle rempli à la chaîne.`
- Ligne 2, le mot se décode : `Un site dessiné *pour vous*.` → `*pour votre métier*` → `*pour vos clients*`
- Texte : `Chaque site part d'une page blanche et naît de nos échanges et réflexions. Votre métier, vos clients, vos envies. Tout est modifiable à volonté, jusqu'à satisfaction.` (mots de J, overlay du 2026-10-02, orthographe corrigée)
- Point 1 : `Selon vos envies` · `couleurs, ton, animations : on choisit ensemble, rien n'est imposé.`
- Point 2 : `Beaucoup d'échanges` · `vous me racontez votre métier, je vous montre, vous réagissez.`
- Point 3 : `Un lien pour corriger` · `une fois la première maquette élaborée, vous recevez un lien de visualisation qui vous permet aussi d'éditer. Je reçois vos commentaires et je mets à jour à votre guise.` (mots de J, overlay du 2026-10-02, orthographe corrigée)
- Le point « Au-delà du site » est passé dans la section 02 (demande de J, overlay du 2026-10-02) : voir son texte.
- Invitation `Attrapez la roue : aucun site ne ressemble au voisin.` : supprimée (J, overlay, 2026-10-02). Le nom et le sous-titre de la carte de face sous la roue (téléphone), le bouton pause et les points sont retirés de l'affichage ; ils ne subsistent que pour le clavier et les lecteurs d'écran.
- La roue (2026-10-01, remplace le champ de neuf cartes), libellé accessible `Quatre sites, quatre styles` (AR Transfert ajouté en tête le 2026-10-04, demande de J). Une carte par site, avec son nom et son sous-titre, dans l'ordre :
  - `AR Transfert` · `chauffeur VTC · Béziers`
  - `La Pizzeria des Allées` · `pizzeria · Béziers`
  - `VTBON` · `application des chauffeurs VTC`
  - `Popec` · `coach sportif · Béziers`
- Sur la carte de face, au survol (ordinateur) : `Cliquez pour visiter le site` ; en visite : `Faites défiler · Échap pour sortir`, bouton `Refermer la visite`
- Au doigt, la première fois qu'une carte s'offre au défilement : `Faites défiler le site`
- Commandes : `Mettre la roue en pause` / `Relancer la roue`, et un point par carte `Voir <nom>`

### Scène 3 · Utile

- Eyebrow : `02 · Utile`
- H2 : `Création de logiciels et applications *personnalisés*` (titre de J, overlay du 2026-10-02 ; avant : « Un site qui travaille, pas une plaquette. »)
- Texte (demande de J, overlay du 2026-10-02 : SaaS, CRM, logiciels sur mesure, une phrase choc, quatre lignes ; la phrase choc est en gras) : `**Vous avez un problème, il y a forcément une solution.** Je crée des SaaS, des CRM et des logiciels sur mesure : l'outil qui automatise vos tâches et vous fait gagner des heures, pensé pour votre activité.`
- Sous le texte, trois logiciels en démonstration, chacun sur l'écran d'un iPhone du carrousel « Phone Mockups 1 » (demande de J, 2026-10-02, scénarios et textes d'interface de J), et la légende du logiciel de face. Ils remplacent le bento de quatre cartes (agenda, espace client, contrat, avis). Tous les textes, légendes et interfaces, sont dans `lib/demos.ts` ; ce qui suit en est le résumé.
- Légende 1 · `Carnet` · `Démo` · `Pour les artisans et les entreprises du bâtiment` · `Le suivi de vos chantiers : tâches, photos, réserves et compte-rendu, au même endroit.` · fonctions : `Chantiers` `Tâches` `Photos` `Comptes-rendus` `Réserves` `Planning` · heure du téléphone `10:24`
- Légende 2 · `VTBON` · `Bientôt disponible` · `Pour les chauffeurs VTC et les taxis` · `Le bon de transport dicté à la voix, la facture qui suit, et la relance quand un paiement tarde.` · fonctions : `Dictée vocale` `Bons de transport` `Factures` `Relances` `Partage WhatsApp` `Historique` (l'application de J, qui a remplacé RelancePro le 2026-10-07 ; l'écran du téléphone est celui de ses deux maquettes, avec leurs textes : voir le CONTENU de vtbon-site)
- Légende 3 · `Contrôle` · `Démo` · `Pour les restaurants, les commerces et les hôtels` · `Les contrôles de vos équipes, et chaque anomalie suivie jusqu'à ce qu'elle soit réglée.` · fonctions : `Checklists` `Contrôles` `Incidents` `Photos` `Responsables` `Historique` · heure `22:41`
- Lien de chaque légende : `Parlons de votre outil` → `/contact`
- Commandes du carrousel : `Logiciel précédent`, `Mettre en pause le défilement et les démos` / `Relancer le défilement et les démos`, `Logiciel suivant` (les trois boutons sur le téléphone) ; les trois noms au-dessus de la légende (position) ; nom du carrousel pour les lecteurs d'écran : `Les logiciels, sur iPhone`
- Dans les interfaces, les données de J : `Mes chantiers` · Dupont, `Rénovation salle de bain` · Martin, `Terrasse bois` · Entreprise Garcia, `Local commercial` · `Progression 72 %` · tâches `Pose carrelage`, `Installation douche`, `Raccordement plomberie` · `Compte-rendu du chantier` ; `Contrôle fermeture` · `Frigos` `Nettoyage` `Caisse` `Sols` `Température frigo n°2` · `9,2 °C` · `Incident #248` · `Température trop élevée.` · `Thomas` · `Vérifier le frigo` · échéance `Demain à 10:00` (J avait écrit l'heure après un tiret long, un tic de texte généré que le garde-fou relève).

### Scène 4 · La relecture

- Eyebrow : `03 · La relecture`
- H2 : `Un mot à changer ? *Changez-le sur la page.*`
- Texte : `Vous recevez un lien. Vous relisez votre site en vrai, vous réécrivez un texte à sa place, vous gardez ou retirez une animation, vous commentez une photo. Puis j'applique, et je publie. Rien ne casse.`
- Maquette client, titre de la page fictive : `Votre restaurant`
- Maquette, ligne d'origine : `Ouvert du mardi au samedi`
- Maquette, bulle de la personne : `Ajoute le dimanche midi`
- Maquette, ligne réécrite : `Ouvert du mardi au dimanche midi`
- Maquette, tampon final : `Appliqué · publié`
- Légende sous la maquette : `C'est comme ça que la Pizzeria des Allées a relu son site.`
- Libellé accessible de la maquette : `Exemple de relecture, animé au défilement`

### Scène 5 · Livré

- Eyebrow : `04 · Livré`
- H2 : `Livré propre. Et il *vous appartient*.`
- Coche 1 : `Mentions légales et confidentialité en règle`
- Coche 2 : `Sécurité vérifiée avant la mise en ligne`
- Coche 3 : `Référencement soigné : titres, descriptions, plan du site, fiche Google`
- Coche 4 : `Le code est à vous : vous partez quand vous voulez, avec votre site`
- Offre, grand chiffre : `À partir de 300 €`
- Offre, sous le chiffre : `payable en plusieurs fois, sans frais`
- Offre, délai (les rouleaux) : `Première ébauche sous 72 h`
- Offre, zone : `Partout en France, à distance`
- Offre, ligne ajoutée le 2026-10-02 (le prix est celui d'un site vitrine) : `Un logiciel ou une application sur mesure ? Dites-moi ce qu'il vous faut.`
- Bouton : `Parlons de votre projet` → `/contact` (avant : `Parlons de votre site`)

### Ils m'ont fait confiance (bandeau)

- Titre du bandeau (petit, au-dessus) : `Ils m'ont fait confiance`
- Élément 1 : `La Pizzeria des Allées` · sous-titre `Béziers` · lien `[[À CONFIRMER PAR L'UTILISATEUR : adresse du site de la pizzeria]]`
- Élément 2 : `VTBON` · sous-titre `l'application des chauffeurs VTC` · lien `https://vtbon.fr`
- Élément 3 : `Popec` · sous-titre `coach sportif` · lien `https://popec-run.vercel.app` (donné par J le 2026-10-01)

### Julien

- Eyebrow : `Julien`
- H2 : `Je dessine et je code des sites, des logiciels et des applications pour des gens qui ont autre chose à faire.`
- Texte : `Aujourd'hui, je conçois des sites, des logiciels et des applications sur mesure pour des restaurants, des coachs, des artisans et des commerces, depuis Béziers et pour toute la France. Je m'occupe de tout : le dessin, le code, les textes avec vous, la mise en ligne, et je reste joignable après. Vous relisez sur la page, vous corrigez, j'applique. Un seul interlocuteur, du premier message à la mise en ligne.`

### Questions fréquentes

- Eyebrow : `Avant de signer`
- H2 : `Vos questions, mes réponses`
- Q1 : `Combien ça coûte, vraiment ?` · R1 : `À partir de 300 € pour un site vitrine simple, payable en plusieurs fois sans frais. Le prix est écrit avant de commencer et il ne bouge pas en route. Une fonction en plus, une réservation ou un espace client, se chiffre à part, avant, jamais après.`
- Q2 : `C'est un modèle ou une page blanche ?` · R2 : `Une page blanche. Je pars de votre activité et de vos clients, pas d'un gabarit à remplir. Deux sites Stalika ne se ressemblent pas.`
- Q3 (ajoutée le 2026-10-02) : `Faites-vous aussi des logiciels et des applications ?` · R3 : `Oui. Au-delà du site, je crée des logiciels et des applications personnalisés pour votre activité, comme VTBON, l'application des chauffeurs VTC. Dites-moi ce que vous voulez simplifier ou automatiser, et je reviens vers vous avec une première idée.`
- Q4 : `Je pourrai modifier mon site moi-même ?` · R4 : `Vous relisez et vous corrigez directement sur la page, avec le lien de relecture. J'applique et je publie : vous n'avez rien à casser. Plus tard, pour un changement, un message suffit.`
- Q5 : `Je serai propriétaire de mon site ?` · R5 : `Oui. Le code, les textes, les images que vous m'avez confiées : tout est à vous. Vous pouvez partir avec.`
- Q6 : `Et l'hébergement, le nom de domaine ?` · R6 : `Je peux m'en occuper, ou vous laisser la main. On décide ensemble, et c'est écrit dans le devis.`
- Q7 : `Sous combien de temps ?` · R7 : `Une première ébauche sous 72 heures. Ensuite, le rythme dépend de vos retours : plus ils arrivent vite, plus le site sort vite.`

### On en parle ?

- Eyebrow : `On en parle ?`
- H2 : `Dix questions, cinq minutes, et je vous réponds avec une première idée.`
- Bouton principal : `Répondre aux questions` → `/contact`
- Bouton secondaire : `Ou directement sur WhatsApp` → wa.me

### Pied de page

- Ligne 1 : `Stalika · Julien Gastal`
- Ligne 2 : `Sites, logiciels et applications sur mesure pour ceux qui font tourner leur boutique. Toute la France, à distance.`
- WhatsApp : `06 45 74 86 08` (lien wa.me)
- Liens légaux : `Mentions légales` · `Confidentialité`
- Lien discret : `Espace privé` → `/connexion`

---

## Contact `/contact` : la conversation

Titre d'onglet : `Parlons de votre projet` (avant : `Parlons de votre site`)
Description : `Dix questions, cinq minutes. Je reviens vers vous sous 72 heures avec une première idée.`

- H1 (en tête de la conversation) : `Parlons de votre projet`
- Progression : `{n} / 10`
- Lien de retour sur chaque question : `Modifier ma réponse précédente`
- Bouton de passage des questions facultatives : `Passer`
- Bouton de validation d'un champ texte : `C'est noté`

Bulle d'accueil (Julien) : `Salut, moi c'est Julien. Dix questions, cinq minutes, et je reviens vers vous avec une première idée. On y va ?` · bouton : `On y va`

1. `D'abord, comment on vous appelle ?` · champ texte, indication `Votre prénom`
2. `Vous faites quoi dans la vie ?` · choix : `Restaurant, bar, traiteur` · `Coach, sport, bien-être` · `Artisan, bâtiment` · `Boutique, commerce` · `Autre` (ouvre un champ, indication `Dites-moi`)
3. `Et côté site, vous en êtes où ?` · choix : `Aucun site` · `Une page Instagram ou Facebook, c'est tout` · `Un site que je n'aime plus` · `Un site à améliorer`
4. `Le site doit servir à quoi, avant tout ?` (plusieurs réponses possibles, mention `Plusieurs réponses possibles`) · choix : `Être trouvé sur Google` · `Prendre des réservations ou des rendez-vous` · `Recevoir des demandes de devis` · `Montrer mon travail` · `Vendre en ligne` · bouton de validation : `Voilà`
5. `Une question que vos clients vous posent tout le temps ?` (facultatif) · champ texte, indication `Vous êtes ouverts le dimanche ?`
6. `Vous avez déjà un logo, des photos ?` · choix : `Les deux` · `Le logo seulement` · `Des photos seulement` · `Rien encore`
7. `Un site que vous aimez, pour l'ambiance ?` (facultatif) · champ texte, indication `Une adresse, ou juste ce qui vous plaît`
8. `Quel budget vous avez en tête ?` · choix : `Autour de 300 €` · `Entre 300 et 800 €` · `Plus de 800 €` · `Je ne sais pas encore`
9. `Pour quand ?` · choix : `Le plus tôt possible` · `Dans le mois` · `Dans quelques mois` · `Je regarde, c'est tout`
10. `Où je vous réponds ?` · choix : `Sur WhatsApp` · `Par e-mail` · champ selon le choix, indication `Votre numéro` ou `Votre adresse e-mail` · case : `J'accepte que Julien garde ces réponses pour me répondre. Rien d'autre.` · bouton : `Envoyer à Julien`

Réponse de la personne, bulle de droite : ce qu'elle a choisi ou tapé, tel quel.

- Succès (bulle Julien) : `Merci {prénom} ! Je reviens vers vous sous 72 heures avec une première idée. En attendant, si c'est urgent : WhatsApp.` · bouton : `Écrire sur WhatsApp` · lien : `Retour à l'accueil`
- Erreur, prénom vide : `Il me faut au moins votre prénom.`
- Erreur, contact vide ou mal formé : `Il me faut un moyen de vous répondre.`
- Erreur, case non cochée : `Cochez la case pour que je puisse garder vos réponses.`
- Erreur d'envoi : `Ça n'est pas parti. Réessayez, ou écrivez-moi sur WhatsApp.`
- Trop d'envois : `Doucement : réessayez dans quelques minutes, ou écrivez-moi sur WhatsApp.`

---

## Espace privé `/admin`

Titre d'onglet : `Demandes`

- Nav : `Demandes` · `Voir le site` · `Déconnexion`
- H1 : `Demandes reçues`
- Colonnes : `Date` · `Prénom` · `Activité` · `Budget` · `Délai` · `Statut`
- Statuts : `À traiter` · `Répondu` · `Archivée`
- État vide : `Aucune demande pour l'instant. Elles arriveront ici dès que quelqu'un ira au bout de la conversation.`
- Compteur en tête : `{n} à traiter`

### Détail `/admin/demandes/[id]`

- Retour : `Toutes les demandes`
- H1 : `{prénom} · {activité}`
- Sous-titre : `Reçue le {date} à {heure}`
- Libellés des réponses : `Situation` · `Le site doit servir à` · `Ce que ses clients demandent` · `Logo et photos` · `Un site qu'il aime` · `Budget` · `Délai` · `Contact` · `Consentement`
- Boutons : `Répondre sur WhatsApp` (si WhatsApp) · `Répondre par e-mail` (si e-mail) · `Marquer répondu` · `Archiver` · `Supprimer`
- Confirmation de suppression : `Supprimer cette demande ? C'est définitif.` · `Oui, supprimer` · `Annuler`
- Succès : `Statut mis à jour.` · `Demande supprimée.`

## Connexion `/connexion`

Textes du module, conservés : titre `Connexion`, champs `E-mail` et `Mot de passe`, bouton `Se connecter`, erreur `Identifiants incorrects.`

## Page introuvable

- Eyebrow : `Page introuvable`
- H1 : `Cette page n'existe pas.`
- Texte : `Elle a été déplacée, ou n'a jamais existé. Reprenons depuis le début.`
- Boutons : `Retour à l'accueil` · `Parlons de votre projet`

## Confidentialité `/confidentialite` : ce qui s'ajoute au gabarit

- Section `Le questionnaire de contact` : `En répondant aux questions du site, vous me confiez votre prénom, votre activité, vos réponses et un moyen de vous joindre. Je m'en sers pour vous répondre, et pour rien d'autre. Base légale : votre consentement, coché avant l'envoi. Ces réponses sont gardées douze mois, puis supprimées, ou plus tôt si vous me le demandez. Personne d'autre que moi ne les lit.`
- Section `Cookies et statistiques` (ancre `cookies`) : `Ce site mesure ses visites avec Google Analytics, uniquement si vous avez cliqué sur « D'accord » dans le bandeau. Tant que vous n'avez pas répondu, ou si vous avez refusé, aucun cookie de mesure n'est déposé. Vous pouvez changer d'avis à tout moment : le lien « Cookies » en bas de page rouvre le bandeau. Le seul autre cookie est celui de session de l'espace privé, réservé à l'éditeur.`
- Lien de pied de page : `Cookies` (rouvre le bandeau)
