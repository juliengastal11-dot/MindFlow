# La vidéo du héros de Stalika

En haut de l'accueil, une boucle de 20 s joue par-dessus le ciel (`stalika/components/ui/ciel.tsx`) :
la caméra s'approche de la falaise pendant qu'un nuage arrive de la gauche, traverse le plateau et
se déverse dans le vide, puis elle recule jusqu'au plan large.

Ce dossier n'est pas publié : la construction (Vercel) ne prend que `stalika/`.

## D'où elle vient

Deux plans Kling 3.0 Pro de 10 s, générés sur Higgsfield le 2026-10-04 (17,5 crédits chacun) :

- l'aller : du plan large à l'image B, avec le nuage (tâche `56f637b9-1d4d-4d58-9ed4-e9ec3887cc65`) ;
- le retour : de l'image B au plan large, plateau dégagé (tâche `597187a2-e38a-4586-b785-a74a2ce6c2d6`).

Les deux images clés sont la première et la dernière image du plan d'origine (tâche
`c0a43cd4-bfba-4632-ac7d-d315b8564518`), où une bouffée de poussière jaillissait du sol. Avant, la
vidéo était cet unique plan joué en aller-retour : tout ce qui bougeait repartait à l'envers au
retour. Les deux plans sont maintenant joués vers l'avant, y compris pour le recul du premier
défilement, qui prend ses images dans le plan retour.

## Refaire le montage

Il faut Node et ffmpeg. Les plans se téléchargent depuis Higgsfield par leur tâche.

```
node monter.mjs aller.mp4 retour.mp4
```

Le script écrit dans `stalika/public/hero` : `video.mp4|webm` (1928 × 1076),
`video-mobile.mp4|webm` (840 × 1506 : le bandeau de 600 px pris à x = 278, celui de la série
mobile du ciel), et les 30 images du recul (`recul/bureau`, 1600 × 895 ; `recul/mobile`,
600 × 1076 ; `001` = plan large). Chaque plan est ralenti en cosinus à ses deux bouts (la courbe
que suit `avanceeVideo` dans `ciel.tsx`), puis les deux sont raccordés par des fondus de 0,4 s,
la fin de la boucle retombant sur son début. Les vidéos restent sous 3 Mo (le garde-fou).
