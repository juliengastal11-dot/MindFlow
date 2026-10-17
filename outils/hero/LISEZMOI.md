# La vidéo du héros de Stalika

En haut de l'accueil, une boucle de 20 s joue par-dessus le ciel (`stalika/components/ui/ciel.tsx`) :
la caméra s'approche de la falaise pendant qu'un nuage arrive de la gauche, traverse le plateau et
se déverse dans le vide, puis elle recule jusqu'au plan large.

Ce dossier n'est pas publié : la construction (Vercel) ne prend que `stalika/`.

Il y a **deux chaînes de médias**, qui ne se mélangent pas :

- l'ordinateur : le plan paysage d'origine (1928 × 1076), la cabane ;
- le téléphone (moins de 768 px) : une chaîne **verticale d'origine** (Kling 9:16, 1080 × 1912),
  générée le 2026-10-17 avec un chalet en rondins, de la vidéo du hero à la plongée.

## L'ordinateur

### D'où elle vient

Deux plans Kling 3.0 Pro de 10 s, générés sur Higgsfield le 2026-10-04 (17,5 crédits chacun) :

- l'aller : du plan large à l'image B, avec le nuage (tâche `56f637b9-1d4d-4d58-9ed4-e9ec3887cc65`) ;
- le retour : de l'image B au plan large, plateau dégagé (tâche `597187a2-e38a-4586-b785-a74a2ce6c2d6`).

Les deux images clés sont la première et la dernière image du plan d'origine (tâche
`c0a43cd4-bfba-4632-ac7d-d315b8564518`), où une bouffée de poussière jaillissait du sol. Avant, la
vidéo était cet unique plan joué en aller-retour : tout ce qui bougeait repartait à l'envers au
retour. Les deux plans sont maintenant joués vers l'avant, y compris pour le recul du premier
défilement, qui prend ses images dans le plan retour.

### Refaire le montage

Il faut Node et ffmpeg. Les plans se téléchargent depuis Higgsfield par leur tâche.

```
node monter.mjs aller.mp4 retour.mp4
```

Le script écrit dans `stalika/public/hero` : `video.mp4|webm` (1928 × 1076),
`video-mobile.mp4|webm` (840 × 1506 : le bandeau de 600 px pris à x = 278, celui de l'ancienne série
mobile du ciel, remplacée le 2026-10-17), et les 30 images du recul (`recul/bureau`, 1600 × 895 ;
`recul/mobile`, 600 × 1076 ; `001` = plan large). Chaque plan est ralenti en cosinus à ses deux bouts
(la courbe que suit `avanceeVideo` dans `ciel.tsx`), puis les deux sont raccordés par des fondus de
0,4 s, la fin de la boucle retombant sur son début. La vidéo de l'ordinateur reste sous 3 Mo (le garde-fou).
**Attention : sur le téléphone, `monter.mjs` ne sert plus** : ses fichiers `video-mobile.*` et
`recul/mobile` sont écrasés par ceux de la chaîne verticale, ci-dessous.

## Le téléphone : la chaîne verticale

Tout est généré en 1080 × 1912 (Kling renvoie 1912 ou 1916 px de haut : on rogne au centre à 1912),
puis réduit à 720 × 1274 pour les images. Le chalet est en rondins, plus gros, entièrement dans le cadre
(un peu de marge à gauche : l'écran rogne 6 % de la largeur) ; ses fenêtres et l'écran de l'ordinateur
s'allument la nuit. Le plan ne bouge pas d'une passe à l'autre (trépied), seule la lumière change.

### D'où elle vient (Higgsfield, Kling 3.0 Pro, 10 s, sans son, 17,5 crédits chacun, le 2026-10-17)

| Plan | Tâche | Départ → arrivée |
|---|---|---|
| Aller | `f190ab14-df6e-4d9d-a20c-20045d3abfa2` | plan large → plan rapproché B, un nuage traverse le plateau (variante A, choisie par J) |
| Retour | `d6ce3a44-bae7-45a3-8158-d5ad6636ca79` | B → plan large |
| Passe 1 | `dca9d998-cba0-4957-aa2c-37bc1b4ea5f2` | lumière du hero → crépuscule |
| Passe 2 | `c62b5da0-d81f-411a-bdde-0f2dc3d7e11b` | crépuscule → nuit |
| Passe 3 | `44ace8bb-99c6-4ee8-ba1c-fe227379bd1b` | nuit, le personnage s'étire |
| Passe 4 | `af7c5474-3881-41dc-87c5-abb94e2cf807` | nuit → aube |
| Passe 5 | `0de45b26-4b28-4ff5-8cef-ca86c5e27729` | aube → lumière dorée (arrivée : l'image de départ du chalet) |
| Plongée | `da98b756-b817-499c-9fee-5c2adf21de35` | **MiniMax H3**, 2K (1 440 × 2 560), 20 crédits : dernière image de la passe 5 → l'écran qui remplit l'image (`arrivee-ecran.png`, rognée dans l'image par-dessus l'épaule `f12724ec…`), d'une seule traite |

Plans écartés (17,5 crédits chacun) : l'aller `8b515e96-1917-4e26-b305-a4ffcf2b2b8c` (un nuage gonflé qui retombait le long de la
falaise : « la physique est étrange », J) ; la variante B du nuage `e4ae5801-40ac-4fc8-b878-359db9c04ba6` (un voile plat, que je préférais ;
J a choisi A) ; les plongées Kling `65149249-cfab-4b6b-a8ee-80d63c487d76` (décor rigide, mais l'herbe à la taille à la fin) et Seedance 2.5 `9f93d8b7-4dc9-4196-bed9-263d28963bd4` (720p, 70 crédits ; l'herbe remontait autour de lui) ; la plongée `bac6c8a7-c6d7-4fb2-b45b-37bc3ba1f596` (la caméra restait haute puis descendait : le sol « se levait ») ; la plongée `649a93af-faf7-498d-bfa8-3af185f78c5a` (la caméra descendait au ras de l'herbe : l'herbe « poussait » et le
personnage semblait s'enfoncer dans le sol). Le prompt de l'aller disait « pours over the edge » et « billowing » : à éviter. Celui de la plongée
disait « closer and lower » : c'est ce qui a mis la caméra au ras de l'herbe.

Images clés (gpt_image_2_5, 2k, 9:16) : le chalet en rondins `5a976c84-365a-4142-8ebc-f6cd30cb5196`, le plan de départ `9aea7484-e330-4d78-926f-1b989de3680f`,
l'écran blanc par-dessus l'épaule `f12724ec-42ee-4e64-9ba8-595d94552b59`. Les plans bruts ne sont pas gardés dans le dépôt : ils
se retéléchargent par leur tâche. Chaque passe part de la dernière image de la précédente (extraite en PNG, envoyée à Higgsfield
avec `media_upload`), et celles de la nuit à l'aube ont fini sur l'image d'arrivée imposée.

### Refaire les médias

Il faut Node, ffmpeg et Python (Pillow, numpy).

```
node monter-vertical.mjs aller.mp4 retour.mp4 [dossier] [--h264 2200] [--vp9 1600] [--hevc 1800]
node extraire-vertical.mjs ciel <dossier> passe1.mp4:21 passe2.mp4:20 passe3.mp4:30 passe4.mp4:20 passe5.mp4:20
node extraire-vertical.mjs plongee plongee.mp4 <dossier> 120 --derniere-pleine --qualite 72
python -I -X utf8 mesurer-ecran.py stalika/public/hero/plongee-mobile stalika/lib/plongee-ecran-mobile.ts ECRANS_PLONGEE_MOBILE --debug <dossier>
python -I -X utf8 mesurer-ecran.py stalika/public/hero/plongee stalika/lib/plongee-ecran-bureau.ts ECRANS_PLONGEE_BUREAU --lumiere 160 --couleur 62 --graines stalika/lib/plongee-ecran-bureau.ts
python -I -X utf8 rythme-plongee.py --mobile
python -I -X utf8 retirer-cable.py stalika/public/hero/plongee-mobile --ancre 70 --de 1 --a 99
```

- `monter-vertical.mjs` : la boucle de 20 s (même montage que `monter.mjs`, sans recadrage), en trois encodages
  (`video-mobile-hevc.mp4` pour Safari, `video-mobile.webm` en VP9, `video-mobile.mp4` en H.264 de repli ;
  réglés à 4,5 / 4,0 / 5,5 Mo, indiscernables d'un encodage deux fois plus lourd sur la zone la plus fine), et les
  30 images du recul prises dans le plan retour (`recul/mobile`, `001` = plan large) ;
- `extraire-vertical.mjs ciel` : les 111 images du ciel, bout à bout (21, 20, 30, 20, 20 par passe), `public/ciel/mobile` ;
- `extraire-vertical.mjs plongee` : 120 images **à pas égal de changement** (la différence moyenne entre deux images
  voisines est cumulée, puis découpée en parts égales : la caméra va dix fois plus vite au milieu qu'au début), `public/hero/plongee-mobile`.
  `--derniere-pleine` : la dernière image reste en 1 080 × 1 912, parce que la page finit par entrer dans cet écran
  (le zoom de `Plongee` dessine cette image jusqu'à quatre fois plus grande). `--fin <image>` coupe un plan avant un mouvement raté (servi un temps à 163 sur le vol Kling, abandonné : J veut que la caméra
  entre dans l'écran sans arrêt sur image). Les plans sont rognés au format 1 080 × 1 912 quelle que soit leur taille (MiniMax sort en 1 440 de large). **Pour un vol, le prompt
  doit dire que le décor est rigide** : les deux premiers plans faisaient lever et s'affaisser le terrain (J : « c'est la caméra qui
  arrive sur l'ordinateur, le décor ne bouge pas ») ; le troisième disait « a real, solid location… the ground never rises, sinks,
  tilts, bends or grows… only the camera moves, with natural parallax », et il tient ;
- `mesurer-ecran.py` : les quatre coins de l'écran de l'ordinateur dans chaque image de la plongée, là où la page colle le bureau
  du Mac en perspective (chaque bord ajusté par une droite sur une partie que l'épaule ne cache pas), et ce que l'épaule en cache,
  rangée par rangée (`CACHES_…`, dans le même fichier). L'écran de la série verticale est blanc ; celui de la série Kling de
  l'ordinateur est crème et montre un navigateur : `--lumiere 160 --couleur 62`, et `--graines` (des coins déjà mesurés, ici le
  fichier lui-même) pour garder la zone de l'écran plutôt que les nuages crème, plus grands ;
- `rythme-plongee.py --mobile` : de combien l'image change d'une image à la suivante (`lib/plongee-rythme-mobile.ts`) ;
- `retirer-cable.py` : retire d'une série d'images un fil fin et sombre, ici le **hauban du poteau**, qui descend du haut du poteau
  à travers la mer de nuages et ne mène nulle part (J, 2026-10-17 : « un câble électrique qui part en bas dans le vide, il faut
  l'enlever »). On le trouve dans l'image d'ancre (`--ancre`, une où il est net), puis on le suit d'une image à l'autre, vers
  l'avant et vers l'arrière, jusqu'à ce qu'il ne soit plus là ; dans chaque rangée on remplace ses 7 px par un dégradé entre les
  deux côtés. Il commence dans le câble qui s'affaisse du poteau (jamais effacé : on s'arrête sous lui) et se poursuit en bas
  tant qu'on le devine. Sans `--sortie`, il réécrit les images **sur place**, en WebP de qualité 78 (même poids ; écart moyen
  de 1,4 niveau sur 255 ; les originaux sont dans git). Vérifié : la force du fil le long de son tracé passe de 20 à 57 à moins
  de 4 (le bruit) dans les images 5 à 98. Réglé sur la série verticale MiniMax (720 × 1 274, pente 0,13 à 0,17) ; la série Kling
  de l'ordinateur a d'autres haubans, en diagonale, non traités (cette chaîne doit être refaite en 16:9).

Les points mesurés à la main, dans `stalika/lib/ciel.ts` : `POSE_BOUTON_MOBILE` (où le bouton tombé se pose : l'herbe à droite de
l'ordinateur).
