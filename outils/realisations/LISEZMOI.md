# Les médias de la roue des sites

La scène « Sur mesure » de Stalika montre trois sites dans une roue (`stalika/components/ui/roue.tsx`).
Chaque carte vient d'une capture faite avec les scripts de ce dossier, le 2026-10-01.
Le résultat est dans `stalika/public/realisations/<id>/`, et la liste des sites dans `stalika/lib/realisations.ts`.

Ce dossier n'est pas publié : Netlify construit `stalika/` seulement.

## Ce qu'il y a ici

- `capturer.mjs` : ouvre un site dans Chrome (sans fenêtre), à la taille d'un téléphone dans la carte
  (390 × 650 px, densité 2). Il enregistre le haut de page en action (images du compositeur,
  horodatées), puis la page entière, écran par écran, en masquant les barres fixes ; avec
  `--pleine-page`, aussi d'un seul tenant (utile quand le hero est en parallaxe).
- `produire.mjs` : fabrique les fichiers des cartes à partir des captures (vidéos MP4 et WebM en
  deux tailles, affiche, page entière en tranches WebP).
- `servir.mjs` : un petit serveur statique, pour capturer un site construit en local.

## Refaire une capture

Il faut Node, Chrome et ffmpeg. Depuis ce dossier :

```
npm init -y
npm install playwright-core
node capturer.mjs popec https://popec-run.vercel.app 5 --pleine-page
node produire.mjs ../../stalika/public/realisations popec
```

Les durées et les instants de découpe des vidéos sont réglés en tête de `produire.mjs` : boucle sans
couture pour un haut de page qui vit (pizzeria), entrée jouée une fois pour un haut de page qui arrive
(VTBON), entrée puis boucle quand les deux se suivent (Popec et sa bande qui défile). Après une
nouvelle capture, reporter dans `stalika/lib/realisations.ts` la hauteur des tranches
(`produire.mjs` l'écrit dans `sorties/<id>/page.json`) et, pour une entrée suivie d'une boucle,
l'instant de reprise qu'il affiche.

Captures du 2026-10-01 : pizzeria-des-allees.vercel.app, vtbon.fr et popec-run.vercel.app.
