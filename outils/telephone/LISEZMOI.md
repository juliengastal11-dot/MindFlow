# Le pont du téléphone

Voir et mesurer le site sur un vrai iPhone, en direct, depuis ce PC (créé le 2026-10-17, à la demande de J).

## Ce que c'est, et ce que ce n'est pas

Un iPhone ne se pilote pas depuis Windows : il n'y a pas d'équivalent au débogage sans fil ADB d'Android (la
« Recopie de l'iPhone » d'Apple ne marche que sur Mac, et pas en France ; vérifié le 2026-10-07). On pilote donc
**la page** ouverte dans Safari sur le téléphone, pas le téléphone.

```
iPhone (Safari)  ──►  pont.mjs (ce PC, port 3100)  ──►  serveur du site (port 3000)
                         └─ ajoute `client.js` à chaque page : il remonte la console et les erreurs,
                            et répond aux ordres de `ctl.mjs`
```

Le site n'est pas touché : rien de ceci n'est dans `stalika/` ni dans la version en ligne. Les modifications du
code arrivent sur le téléphone en une ou deux secondes (rechargement à chaud de Next, qui traverse le pont).

## Démarrer

1. Le site tourne (`npm --prefix stalika run dev`, port 3000).
2. `node outils/telephone/pont.mjs` : il affiche l'adresse à ouvrir (du genre `http://192.168.1.53:3100`).
3. Sur l'iPhone, **dans Safari**, branché au même Wi-Fi que la box : ouvrir cette adresse.
4. Pendant la séance : écran allumé (Réglages, Affichage et luminosité, Verrouillage automatique, Jamais) et Safari au
   premier plan. Verrouillé ou en arrière-plan, le téléphone ne répond plus.

À arrêter avec Ctrl+C quand on a fini.

## Les ordres (`ctl.mjs`)

| Commande | Effet |
|---|---|
| `clients` | qui est connecté, sur quelle page, à quelle hauteur |
| `info` | ce que le téléphone dit de lui : fenêtre, zone sûre, flou pris en charge, mouvement réduit, unités svh/dvh... |
| `eval "document.title"` | du JavaScript dans la page (plusieurs instructions : finir par `return`) |
| `scroll 1200` / `scroll "#livre"` / `scroll fin` | défiler |
| `tap "a[href='#livre']"` | toucher un élément ; si quelque chose le recouvre, rien n'est envoyé et le rapport le dit (`--force` pour envoyer quand même) |
| `rects ".sel" [--styles opacity,color]` | position, taille et styles |
| `texte "#faq"` / `html "#livre"` | le texte ou le HTML d'un bloc |
| `perf [--de 0] [--a 5000] [--ms 8000]` | **fluidité** : les images d'un défilement continu (fps moyen, médiane, p95, p99, saccades) |
| `journal [--niveaux erreur,error,warn,ressource]` | la console du téléphone, ses erreurs, les images ou vidéos qui ne chargent pas |
| `reload`, `goto /contact`, `vider` | recharger, aller à une page, vider le journal |

Option commune : `--client <id>` (par défaut, le dernier iPhone qui s'est présenté).

## Ce qu'il ne fait pas

- **Pas de capture d'écran** : Safari ne le permet pas à une page. Pour voir les pixels : une capture de J, ou un récepteur
  AirPlay sur le PC qui montre l'écran du téléphone (logiciel tiers, non installé, non testé).
- **Pas de vrais touchers** : `tap` envoie à l'élément la suite d'évènements d'un toucher (pointer, souris, clic). Les
  gestes (glisser, pincer) et ce qui exige un vrai geste de l'utilisateur (lancer une vidéo avec le son, par exemple)
  restent à faire au doigt.
- **L'espace privé (`/admin`) ne s'ouvre pas par le pont** (la connexion renvoie vers `localhost`). Il se teste sur le PC.
- Adresse en `http` : `isSecureContext` est faux (pas de capteurs de mouvement, pas de service worker). Sans objet pour le
  site actuel.

## Sécurité

- Le relais écoute sur le réseau local (le téléphone doit l'atteindre) et ne donne que ce que le serveur de développement
  donne déjà : Next écoute sur toutes les adresses. Le pare-feu de Windows laisse déjà passer `node.exe` sur ce réseau.
- Les ordres passent par une autre porte, ouverte sur **ce PC seulement** (`127.0.0.1`, port 3101), fermée à tout
  navigateur (une requête avec `Origin` est refusée), qui vérifie le `Host` et exige un jeton tiré au sort à chaque
  démarrage (écrit dans le dossier temporaire, effacé à l'arrêt).
- Un appareil du réseau qui se ferait passer pour le téléphone ne reçoit que ce qu'on lui envoie : les prises des
  téléphones ne se parlent pas entre elles, et rien ne passe de l'une à l'autre.
- `client.js` est ajouté juste avant `</head>`. Au début de `<head>`, il décale ce que React attend à l'hydratation
  (alerte « a tree hydrated but some attributes... », vue et corrigée le 2026-10-17).
