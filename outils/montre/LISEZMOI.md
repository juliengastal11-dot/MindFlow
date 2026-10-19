# La montre en photo de la section 04

Dans la section 04 de l'accueil (depuis le 2026-10-19, à la place de la montre 3D), la montre se fabrique
au défilement avec de vraies pièces en photo : les pièces d'une vue éclatée glissent sur le fil d'or jusqu'au boîtier, étape après
étape, puis la montre finie se relève jusqu'à la photo de trois quarts (un morphing, sans fondu visible), et la caméra s'en
approche à peine. Le composant est `stalika/components/ui/montre-photo.tsx`, la chorégraphie `stalika/lib/montre-photo.ts`,
le morphing `stalika/lib/morphing.ts`.

Ce dossier n'est pas publié : la construction ne prend que `stalika/`.

## D'où viennent les images

Quatre images faites par J dans ChatGPT le 2026-10-19, gratuitement, d'après les consignes de la
conversation (vue éclatée verticale, puis la même montre assemblée, puis de dos) :

- `Montre Stalika en éclaté luxueux.png` : la vue éclatée, 941 × 1672 ;
- `Montre dorée Stalika.png` (demandée ensuite, même jour) : la montre montée vue de trois quarts, d'où l'on voit son
  épaisseur ; c'est elle qu'on voit quand la montre est finie ;
- `Montre dorée STALIKA sur cuir noir.png` et `Montre dorée à mouvement apparent.png` : la montre de face et de dos. Elles
  servaient au retournement de la fin, retiré le soir même (J : « le retournement ne sert à rien finalement ») ; on les
  découpe encore, la page ne les publie plus.

Toutes sont sur un fond gris clair uni : c'est ce qui permet de détourer sans rien payer.

## Refaire la découpe

Python 3 avec numpy et Pillow, rien d'autre. Depuis `decoupe/`, dans l'ordre :

```
python decouper_eclate.py    # les 13 pièces de la vue éclatée, détourées, à leur place (cornes resserrées : cornes.py)
python decouper_photos.py    # les photos de la montre montée, détourées
python exporter.py           # les WebP dans stalika/public/montre, les boîtes dans stalika/lib/montre-photo-boites.ts
python voir_ellipses.py      # pour vérifier les ellipses relevées à la main (ellipses.json)
```

Après `decouper_eclate.py`, les bracelets sont ceux de la vue éclatée : refaire ensuite la relève
au complet (plus bas), qui les remplace par ceux de la photo.

Tout ce qui sert à vérifier atterrit dans `decoupe/sortie/` (non suivi) : `verif-eclate.png` montre
toutes les pièces à leur place sur un fond de nuit, `verif-face.png` et `verif-dos.png` les deux
photos. Les WebP sortent identiques d'une fois sur l'autre.

## Comment c'est découpé

- **Le fond** (`fond.py`) : un polynôme lisse ajusté sur ce qui est du fond, par itérations. Pour la
  vue éclatée, les bandes des côtés suffisent. Les deux photos ont un halo de lumière derrière la
  montre : le fond y est ajusté sur tout le gris neutre, clair et sans détail qui touche le bord.
- **Les pièces** (`decouper_eclate.py`) : chaque pièce a sa zone, l'écart au fond donne sa forme.
  Là où deux pièces se frôlent, une courbe passe par le fond qui les sépare ; le cadran (chaud)
  se sépare du mouvement (acier) par la couleur, la lunette du verre aussi. La trotteuse fine de la
  vue éclatée est laissée de côté : la montre montée n'en a pas.
- **Les trous** : bouchés dans les pièces pleines (l'acier clair du mouvement ressemble au fond),
  gardés ouverts là où l'on voit vraiment le fond (le grand trou de la lunette et du boîtier, les
  jours de la boucle, les petits trous du cadran).
- **Le verre et la glace du fond** (`mater_verre`) : transparents ; l'écart au fond devient le reflet.
- **Le bord** (`mater`) : alpha par projection sur la couleur de la pièce, couleur décontaminée,
  puis le bord rongé d'un pixel (le liseré clair du fond d'origine ne fait pas de halo sur la nuit).
- **Les ombres portées** des photos (le bracelet sur le fond) : le fond assombri à l'identique sur
  les trois couleurs, retiré.
- **Le bout coupé** par le cadre (le haut du bracelet de la vue éclatée, les deux bouts du bracelet
  de dos) s'efface en douceur (`exporter.py`).

## Les mesures à la main

Les cornes du boîtier de la vue éclatée sont bien plus écartées que le bracelet (ChatGPT les a
dessinées ainsi) ; dans la photo de la montre finie, elles le serrent. `cornes.py` les ramène, dès
la découpe, à leur place dans la photo, par un glissement horizontal plein sur les cornes et nul sur
le corps du boîtier : elles n'ont plus à se resserrer quand la montre se relève (J : « les 4
branches qui se réduisent pour attraper le bracelet »).

Les pièces de la vue éclatée ne sont pas vues sous le même angle (le cadran et le mouvement plus
de face, le boîtier plus de biais). Les ellipses de chaque pièce ronde sont relevées dans
`ellipses.json` (centre, demi-axes) : elles donnent, dans `lib/montre-photo.ts`, l'échelle que
prend chaque pièce en glissant pour entrer dans le boîtier. Le centre et le rayon de la lunette de
la photo de trois quarts (461, 652, 342) la calent sur le boîtier de la vue éclatée.

Le boîtier de la vue éclatée est vu de biais (b / a ≈ 0,46, mesuré sur le trou de son alpha). Ce
qui entre dedans (le mouvement, le cadran) ne se voit que dans son trou, et d'autant plus bas qu'il
est enfoncé : au-dessus du mouvement, on voit la paroi intérieure du boîtier (le relief).

## La montre qui se relève

La pile de pièces, une fois la montre finie, se déforme jusqu'à la photo de trois quarts : un
morphing en WebGL, où chaque détail (lunette, cadran, index, aiguilles, cornes, couronne, bracelets,
boucle) va de sa place dans la pile à sa place dans la photo pendant que l'une passe à l'autre. Les
mêmes détails restant aux mêmes places, on ne voit pas deux images l'une sur l'autre.

Les bracelets de la pile sont ceux de la photo (J : « le bracelet change entre les deux vues, il faut
le même tout le temps ») : `bracelets.py` reporte le cuir et la boucle de la photo dans la forme
qu'ils ont dans la pile, par la déformation même de la relève. Quand la montre se relève, ils ne
changent que de forme. Le jour entre la carrure et le cuir y devient une ombre ; le reflet clair des
cornes du bas, dans la photo, est assombri (`exporter.py`).

Pour tout refaire (après un changement des pièces, de la caméra ou de la photo), le site tournant
en local, depuis `decoupe/` :

```
node photographier-pile.mjs  # la pile, telle qu'à l'écran au début de la relève (avec les bracelets du moment)
python releve.py points      # les correspondances, relevées sur cette pile, gelées dans releve-points.json
python releve.py             # la déformation : la grille (releve.bin)
python bracelets.py          # les bracelets refaits d'après la photo, par cette déformation
python exporter.py           # publiés
node photographier-pile.mjs  # la pile, avec ses nouveaux bracelets
python releve.py --essais    # la texture de la pile (la grille ne bouge plus : les points sont gelés), et les essais
```

Si seule la caméra ou la photo change, les deux dernières lignes suffisent pour la texture ; les
correspondances, elles, se relèvent sur une pile aux bracelets d'origine (`decouper_eclate.py`, puis
`exporter.py`).

- **Les correspondances** (`releve_points.py`) : la silhouette (les bords gauche et droit, tronçon
  par tronçon, de la pile à la photo), la lunette et le bord du cadran (ellipses), les index, le
  nom, les aiguilles sur leur longueur, la petite seconde, les coins des cornes, le flanc et la
  boucle (lus sur des profils de luminance). Les relever à la loupe : un point faux fait un détail
  en double à mi-course.
- **La déformation** : une spline de plaque mince sur ces points, évaluée sur une grille de 71 × 129
  sommets, puis dépliée là où elle se replierait (depuis que les cornes sont resserrées, nulle part).
- **Les essais** : `sortie/releve-050.png` (la mi-course) doit montrer une seule montre ;
  `sortie/releve-anaglyphe.png` (la pile déformée en rouge, la photo en cyan) montre en franges
  colorées ce qui ne tombe pas juste.
