# La montre de la section 04

Dans la section 04 de l'accueil, la montre se fabrique au défilement : ses pièces, enfilées sur un fil
d'or, redescendent une à une sur le boîtier, une étape du processus après l'autre, puis la caméra vient
voir la montre finie de plus près. Depuis le 2026-10-21, c'est un film fait avec Higgsfield (`higgsfield/`,
J : « un résultat ultra réaliste ») : les pièces de la vue éclatée de J, sept images clés, six plans vidéo.
Hors de la pièce qui bouge, chaque image reprend l'image clé exacte : rien d'autre ne bouge, rien ne se
fond, rien ne change de forme (J, 2026-10-20). La page la joue image par image, au défilement
(`stalika/components/ui/montre-film.tsx`, `stalika/lib/montre-film.ts`), avec un fondu entre deux images
voisines pour que le mouvement reste lisse. La version d'avant, rendue dans Blender (`blender/`), est
décrite plus bas et reste dans le dépôt.

Ce dossier n'est pas publié : la construction ne prend que `stalika/`.

## D'où ça vient

- `Montre Stalika en éclaté luxueux.png` : la vue éclatée faite par J dans ChatGPT le 2026-10-19. C'est la
  source du film Higgsfield : toutes ses pièces y sont découpées (`higgsfield/`).
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
- `Montre dorée STALIKA sur cuir noir.png` a servi, avec la vue éclatée, aux versions d'avant (pièces en
  photo, morphing), gardées dans l'historique jusqu'au commit `cf7e1f7`.

## La montre dans Blender (`blender/montre.py`, la version d'avant)

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

## Le film Higgsfield (`higgsfield/`, 2026-10-21)

### L'idée

La vue éclatée de J n'est pas à l'échelle : le mouvement et le cadran y sont 1,45 fois trop grands pour le
boîtier, et chaque pièce est vue sous une inclinaison différente. Un modèle vidéo à qui l'on donne cette image
et la montre montée doit donc rétrécir les pièces en les faisant descendre : un morphing. Le film est fait
autrement :

1. **Des calques** (`calques.py`) : chaque pièce est découpée de la vue éclatée, avec sa transparence, puis
   remise à sa vraie taille par rapport au boîtier et à la même inclinaison que lui (rapport des ellipses 0,51).
   Le boîtier vient de deux rendus GPT Image 2.5 (`sources/g1b.png`, le mouvement posé dedans ; `sources/e0.png`,
   le même, vide) ; le bracelet du haut, d'un rendu de la version longue du bout de bracelet de la vue éclatée
   (`sources/sangle_long.png`), pour qu'il puisse descendre jusqu'aux cornes.
2. **Sept images clés** (`dispositions.py`) : les mêmes calques, posés autrement à chaque étape (rien de posé ;
   le mouvement ; le fond et la couronne ; le cadran ; les aiguilles ; le verre et la lunette ; les bracelets).
   Ce qui est posé dans la carrure est coupé par son bord avant.
3. **Six plans vidéo** (Kling 3.0 Pro sur Higgsfield, 5 s, 1080 x 1920, sans son ; `sources/plans/s1.mp4` à
   `s6.mp4`) : chacun va d'une image clé à la suivante, avec une consigne qui ne fait bouger que la pièce de
   l'étape.
4. **Le film** (`film.py`) : ce qui ne bouge pas pendant un plan vient des calques exacts (net, déjà détouré). De
   la vidéo, recalée en couleur sur ses deux images clés, on ne prend que la pièce qui bouge : sa position est
   suivie image par image (sa forme est connue, c'est son calque), elle est détourée là (`detoure.py` : le fond est
   la plaque grise connue plus l'écart lisse du plan ; une ombre grise mise dans l'air par le modèle est du fond),
   et son calque rebouche les plages d'acier qui ont la couleur du fond. Le bord avant de la carrure repasse
   par-dessus ce qui entre dedans (le modèle faisait passer le cadran devant), la tête par-dessus les bracelets.
   Les aiguilles (trop fines), le verre (transparent) et les bracelets (leur cuir se répète trop pour être suivi)
   sont posés d'après leur calque exact, au rythme mesuré dans la vidéo. 36 images par plan, puis 20 images où
   la caméra s'approche : 237 images.

### Refaire le film

Python 3 avec numpy et Pillow, ffmpeg. Depuis `higgsfield/` :

```
python preparer.py                       # la vue éclatée à 1080 x 1920, son fond seul, la tête (tete.py)
python dispositions.py                   # les sept images clés : c0.png à c6.png (et leurs calques exacts)
for k in 1 2 3 4 5 6; do mkdir -p plans/s$k; ffmpeg -i sources/plans/s$k.mp4 plans/s$k/%03d.png; done
python film.py                           # film/000.png à 236.png (RGBA), environ 15 minutes
python ../blender/sequence-webp.py film ../../../stalika/public/montre/film/bureau 810 66 70   # 15,5 Mo
python ../blender/sequence-webp.py film ../../../stalika/public/montre/film/mobile 540 65 70   # 8,4 Mo
```

Le nombre d'images et la table qui les cale sur les huit temps sont dans `stalika/lib/montre-film.ts`
(`PLAN`, `APPROCHE`) : les changer ici, c'est les changer là.

### Ce que ça a coûté (crédits Higgsfield, offre Plus de J)

Cinq images GPT Image 2.5 (2,75 chacune, dont deux essais écartés : la vue éclatée remise en page, le cadran
posé, qui redessinait tout le boîtier) et sept plans Kling 3.0 Pro (8,75 chacun, dont un essai écarté : le
mouvement qui rétrécissait en descendant) : 75 crédits. Pour retoucher une étape, on refait son image clé
(`dispositions.py`, gratuit) et son seul plan (8,75 crédits), les deux plans voisins si l'image clé change.
