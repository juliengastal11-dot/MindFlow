# Les médias de la roue des sites

La scène « Sur mesure » de Stalika montre cinq sites dans une roue (`stalika/components/ui/roue.tsx`).
Chaque carte vient d'une capture faite avec les scripts de ce dossier, le 2026-10-01.
Le résultat est dans `stalika/public/realisations/<id>/`, et la liste des sites dans `stalika/lib/realisations.ts`.

Ce dossier n'est pas publié : Netlify construit `stalika/` seulement.

## Ce qu'il y a ici

- `capturer.mjs` : ouvre un site dans Chrome (sans fenêtre), à la taille d'un téléphone dans la carte
  (390 × 650 px, densité 2). Il enregistre le haut de page en action (images du compositeur,
  horodatées), puis la page entière, écran par écran, en masquant les barres fixes.
- `produire.mjs` : fabrique les fichiers des cartes à partir des captures (vidéos MP4 et WebM en
  deux tailles, affiche, page entière en tranches WebP).
- `servir.mjs` : un petit serveur statique, pour capturer un site construit en local.
- `inventes/` : les deux sites d'exemple, Ocre & Cendre (céramiste, le bol tourne) et Le Signet
  (librairie). Ils sont imaginaires, et leur pied de page le dit.

## Refaire une capture

Il faut Node, Chrome et ffmpeg. Depuis ce dossier :

```
npm init -y
npm install playwright-core
node capturer.mjs pizzeria https://pizzeria-des-allees.vercel.app 12
node produire.mjs ../../stalika/public/realisations
```

Les durées et les instants de découpe des vidéos sont réglés en tête de `produire.mjs` : boucle sans
couture pour un haut de page qui vit (pizzeria, céramiste), entrée jouée une fois pour un haut de
page qui arrive (VTBON, Popec). Après une nouvelle capture, mettre à jour la hauteur des tranches dans
`stalika/lib/realisations.ts` (`produire.mjs` l'écrit dans `sorties/<id>/page.json`).

Popec n'a pas d'adresse publique : il a été construit depuis son dépôt (`juliengastal11-dot/Popec`,
dossier `frontend`, `npx craco build`, avec `ajv@8`), puis servi par `servir.mjs`.
