# La montre en photo de la section 04

Sur la page d'essai `/essai/montre-photo`, la montre se fabrique au défilement avec de vraies pièces
en photo : les pièces d'une vue éclatée glissent sur le fil d'or jusqu'au boîtier, étape après
étape, puis la photo de la montre montée prend le relais, de face, et se retourne sur son fond.
Le composant est `stalika/components/ui/montre-photo.tsx`, la chorégraphie `stalika/lib/montre-photo.ts`.

Ce dossier n'est pas publié : la construction ne prend que `stalika/`.

## D'où viennent les images

Trois images faites par J dans ChatGPT le 2026-10-19, gratuitement, d'après les consignes de la
conversation (vue éclatée verticale, puis la même montre assemblée, puis de dos) :

- `Montre Stalika en éclaté luxueux.png` : la vue éclatée, 941 × 1672 ;
- `Montre dorée STALIKA sur cuir noir.png` : la montre montée, de face ;
- `Montre dorée à mouvement apparent.png` : la montre de dos, le mouvement sous la glace saphir.

Les trois sont sur un fond gris clair uni : c'est ce qui permet de détourer sans rien payer.

## Refaire la découpe

Python 3 avec numpy et Pillow, rien d'autre. Depuis `decoupe/`, dans l'ordre :

```
python decouper_eclate.py    # les 13 pièces de la vue éclatée, détourées, à leur place
python decouper_photos.py    # les deux photos de la montre montée, détourées
python exporter.py           # les WebP dans stalika/public/montre, les boîtes dans stalika/lib/montre-photo-boites.ts
python voir_ellipses.py      # pour vérifier les ellipses relevées à la main (ellipses.json)
```

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

Les pièces de la vue éclatée ne sont pas vues sous le même angle (le cadran et le mouvement plus
de face, le boîtier plus de biais). Les ellipses de chaque pièce ronde sont relevées dans
`ellipses.json` (centre, demi-axes) : elles donnent, dans `lib/montre-photo.ts`, l'échelle que
prend chaque pièce en glissant pour entrer dans le boîtier. Les centres et rayons des boîtiers des
deux photos (464, 708, 330 de face ; 469, 708, 343 de dos) les calent sur le boîtier de la vue
éclatée.
