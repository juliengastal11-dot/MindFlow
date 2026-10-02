# Les médias de la roue des sites

La scène « Sur mesure » de Stalika montre trois sites sur une roue en forme de cylindre
(`stalika/components/ui/roue.tsx`, `stalika/components/sections/carte-realisation.tsx`).
Chaque carte vient d'une capture faite avec les scripts de ce dossier, le 2026-10-01.
Le résultat est dans `stalika/public/realisations/<id>/`, et la liste des sites dans `stalika/lib/realisations.ts`.

Ce dossier n'est pas publié : la construction (Vercel) ne prend que `stalika/`.

## Deux façons de composer un site

- **« Plat »** (pizzeria, Popec) : une affiche, une vidéo du haut de page (capturée en images du
  compositeur), et la page entière en tranches opaques.
- **« Calques »** (VTBON) : le site a un fond fixe derrière toute la page, un film que le défilement
  fait avancer. La capture « à plat » le perdait (elle masque les éléments fixes). On le capture donc
  à part : le film en images, la page en tranches TRANSPARENTES, et les mesures du héros pour
  rejouer son entrée. La carte les recompose en direct.

## Ce qu'il y a ici

- `capturer.mjs` : ouvre un site dans Chrome (sans fenêtre), à la taille d'un téléphone dans la carte
  (390 × 650 px, densité 2). Il enregistre le haut de page en action (images du compositeur,
  horodatées), puis la page entière, écran par écran, en masquant les barres fixes ; avec
  `--pleine-page`, aussi d'un seul tenant (utile quand le hero est en parallaxe).
- `produire.mjs` : fabrique les fichiers d'une carte « plate » (vidéos MP4 et WebM en deux tailles,
  affiche, page en tranches WebP).
- `capturer-calques.mjs` : capture une page « en calques » : sans le fond fixe, sur fond transparent,
  et relève la fin du défilement (`finPage`) et les boîtes des enfants de l'entrée du héros.
- `produire-calques.mjs` : fabrique les fichiers d'une carte « en calques » : les images du film
  (rognées comme le fait le site), la page en tranches avec transparence (alpha ramené à 16 niveaux :
  le texte sur fond transparent se code presque entièrement dans l'alpha), l'affiche.
- `servir.mjs` : un petit serveur statique, pour capturer un site construit en local.

## Refaire une capture

Il faut Node, Chrome et ffmpeg. Depuis ce dossier :

```
npm init -y
npm install playwright-core

# un site « plat »
node capturer.mjs popec https://popec-run.vercel.app 5 --pleine-page
node produire.mjs ../../stalika/public/realisations popec

# un site « en calques » : le film du fond doit être téléchargé à part
node capturer-calques.mjs vtbon https://vtbon.fr
node produire-calques.mjs ../../stalika/public/realisations vtbon film.mp4 40
```

Les durées et les instants de découpe des vidéos « plates » sont réglés en tête de `produire.mjs` :
boucle sans couture pour un haut de page qui vit (pizzeria), entrée puis boucle quand les deux se
suivent (Popec et sa bande qui défile). Après une nouvelle capture, reporter dans
`stalika/lib/realisations.ts` la hauteur des tranches (écrite dans `sorties/<id>/page.json`) et, pour
une entrée suivie d'une boucle, l'instant de reprise qu'affiche `produire.mjs`. Pour VTBON, reporter
aussi `finPage` et les boîtes du héros (`sorties/vtbon/calques.json`).

Le film de VTBON : `https://vtbon.fr/video/hero-portrait.mp4` (720 × 1280, 18,6 s, 8 Mo). Sa courbe
d'avancement et son voile sont ceux du site (`components/video/fond-video.tsx` et
`lib/mouvement.ts` du dépôt `vtbon-site`), recopiés dans `stalika/lib/realisations.ts`.

Captures du 2026-10-01 : pizzeria-des-allees.vercel.app, vtbon.fr et popec-run.vercel.app.
