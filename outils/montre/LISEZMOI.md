# La montre de la section 04

Dans la section 04 de l'accueil, la montre se fabrique au défilement : ses pièces, enfilées sur un fil
d'or, redescendent une à une sur le boîtier, une étape du processus après l'autre, puis la caméra vient
voir la montre finie de plus près. C'est une séquence d'images rendue dans Blender (ce dossier,
`blender/`) : une vraie montre en volume, et chaque image est un rendu complet de la même montre,
sans fondu ni pièce qui change de forme (J, 2026-10-20). La page la joue image par image, au
défilement (`stalika/components/ui/montre-film.tsx`, `stalika/lib/montre-film.ts`), avec un fondu
entre deux images voisines pour que le mouvement reste lisse.

Ce dossier n'est pas publié : la construction ne prend que `stalika/`.

## D'où ça vient

- `Montre dorée Stalika.png` : la montre finie vue de trois quarts, faite par J dans ChatGPT le
  2026-10-19. C'est la référence de style (or jaune poli, cadran champagne soleillé à index bâtons, petite
  seconde à 6 h, alligator noir, boucle ardillon), et la source des textures : le cadran est redressé
  depuis l'ellipse de la photo, ses aiguilles effacées (`blender/cadran.py`) ; le cuir des bracelets est
  une tuile tirée du bracelet (`blender/cuir.py`).
- `blender/mouvement-tripo.glb` : le mouvement, généré en 3D sur Tripo (studio.tripo3d.ai, compte de J,
  30 crédits, le 2026-10-20) à partir de la photo de dos (`Montre dorée à mouvement apparent.png`). Sa
  texture cuite, sortie du GLB (`blender/textures/mouvement-tripo-couleur.jpg`), est teintée par matière
  dans le rendu : acier gris pour les ponts, or pour les roues, rubis (`blender/mouvement-texture.py`).
  Tripo a aussi été essayé sur la montre entière : inutilisable (bracelet refermé en boucle, cadran
  vide) ; tout le reste de la montre est donc modélisé dans Blender.
- Les deux autres images (`Montre Stalika en éclaté luxueux.png`, `Montre dorée STALIKA sur cuir noir.png`)
  ont servi aux versions d'avant (pièces en photo, morphing), gardées dans l'historique jusqu'au commit
  `cf7e1f7`.

## La montre dans Blender (`blender/montre.py`)

Tout est en millimètres, l'axe de la montre est Z (le cadran regarde +Z), midi est +Y, la couronne +X.
Les cotes sont celles de la montre 3D d'avant (boîtier de rayon 19,1, cadran 15,6, mouvement 12,25).

- Le boîtier : la carrure (profil tourné), quatre cornes effilées, la lunette (un anneau à part, qui
  serre le verre), le fond (anneau d'or et glace saphir), la couronne cannelée et sa tige.
- Le cadran : un disque, sa face peinte avec `textures/cadran.png` ; les index (masque lissé
  `cadran-index.png`) sont de l'or poli, le champagne un métal satiné.
- Les aiguilles dauphine en acier bleui, à 10 h 08 comme la photo ; la petite seconde en or.
- Le verre : une coque bombée de saphir (verre pour la caméra, transparent pour les ombres).
- Les bracelets : balayés le long d'une courbe (à plat entre les cornes, puis enroulés comme sur un
  poignet), cuir alligator en relief ; la boucle ardillon, l'ardillon, le passant ; les barrettes.
- La lumière : un ciel de studio dégradé et quatre grandes nappes (`eclairage`).
- La chorégraphie (`plan`, `poser`) : chaque pièce part écartée le long de son axe et revient pendant
  son étape (1 le mouvement ; 2 le fond et la couronne ; 3 le cadran ; 4 les aiguilles ; 5 le verre et
  la lunette ; 6 les bracelets, qui viennent des côtés), avec un rebond de 1,5 % à l'arrivée. La caméra
  (`camera`) suit le centre de la pile, se relève de 27° à 44° et s'approche à la fin.

## Refaire la séquence

Blender 5.2 (`C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`), Python 3 avec numpy et
Pillow. Depuis `blender/` :

```
python cadran.py                  # la face du cadran, et le masque des index
python cuir.py                    # la tuile de cuir et son relief
python mouvement-texture.py       # les textures du mouvement, teintées par matière
blender -b -P montre.py -- test <dossier> 0.02,0.5,0.98 540 960 48      # des images d'essai à ces instants
blender -b -P montre.py -- dessus <image.png> 0.6                       # le cadran vu de dessus, pour le lire
blender -b -P montre.py -- rendu <dossier> 180 0 180 810 1440 96        # les 180 images (3 s chacune sur la RTX 3060 Ti)
python sequence-webp.py <dossier> ../../../stalika/public/montre/film/bureau 810 80
python sequence-webp.py <dossier> ../../../stalika/public/montre/film/mobile 540 78
```

`rendu` saute les images déjà présentes : relancé, il reprend. Le nombre d'images (180) et leurs tailles
sont ceux de `stalika/lib/montre-film.ts` : les changer ici, c'est les changer là. L'image 179 de la série
du téléphone sert aussi de montre immobile (sans film, mouvement réduit).
