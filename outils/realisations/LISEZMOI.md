# Les médias de la roue des sites

La scène « Sur mesure » de Stalika montre quatre sites sur une roue en forme de cylindre
(`stalika/components/ui/roue.tsx`, `stalika/components/sections/carte-realisation.tsx`).
Chaque carte vient d'une capture faite avec les scripts de ce dossier, le 2026-10-01, et le
2026-10-04 pour AR Transfert.
Le résultat est dans `stalika/public/realisations/<id>/`, et la liste des sites dans `stalika/lib/realisations.ts`.

Ce dossier n'est pas publié : la construction (Vercel) ne prend que `stalika/`.

## Deux façons de composer un site

- **« Plat »** (pizzeria, Popec, AR Transfert) : une affiche, une vidéo du haut de page (capturée
  en images du compositeur), et la page entière en tranches opaques.
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

# un site « plat » ; la vidéo brute se monte d'abord à partir des images capturées
node capturer.mjs popec https://popec-run.vercel.app 5 --pleine-page
cd sorties/popec && ffmpeg -f concat -safe 0 -i images.ffconcat -fps_mode cfr -r 30 -c:v libx264 -crf 8 -preset fast -pix_fmt yuv420p brut.mp4 && cd ../..
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

AR Transfert (2026-10-04, refaite plusieurs fois ; dernière capture le 2026-10-05 après sa nouvelle
ouverture en trois temps, les phares seuls, le logo qui s'écrit, puis le titre) :
`node capturer.mjs ar-transfert https://ar-transfert-apercu.vercel.app 30 --pleine-page`. Le site
remet ses apparitions à zéro quand elles quittent l'écran et n'allume que le chapitre qu'on lit :
`capturer.mjs` les fige pour la page entière (`MASQUES`), avec la barre de trajet pleine ; il pose le
reflet des boutons au repos et la carte de note Google dans son état final (`FIGES_PAGE`, et
`FIGES_JS` pour la note et le nombre d'avis, que la carte remet à zéro hors de l'écran), garde le
bandeau photo des récits, collant mais plus bas que le seuil des barres (`GARDES`), et attend 5,5 s
en haut de page que le héros ait rejoué son entrée (`ATTENTE_HAUT`). Pour ne refaire que la page sans refilmer le haut (et garder les instants
de boucle déjà relevés) : `--page-seule`. La boucle vit sur deux rythmes qui ne se recalent jamais (les appels de
phares, le reflet du bouton de l'en-tête) : ses deux bouts se prennent là où les deux sont au repos,
trouvés en mesurant l'écart d'une image à la suivante, zone par zone, sur les images décodées
(`mesurer.cjs <brut.mp4> <sortie.json>`, qui lit `ffmpeg -f rawvideo` ; puis `couture.cjs` compare
les images des deux bouts pour choisir le couple de reprise). Le haut de la page prend l'affiche au
repos (`hautAffiche` dans `produire.mjs`) : la capture de la page entière tombe au hasard dans la
boucle de phares. Les filtres `signalstats` (YDIF) et `tblend` de ffmpeg
ont signalé ici des écarts qu'on ne voyait pas sur les images : ne pas s'y fier. Voir `produire.mjs`.

Captures du 2026-10-01 : pizzeria-des-allees.vercel.app, vtbon.fr et popec-run.vercel.app ; du
2026-10-04 : ar-transfert-apercu.vercel.app.
