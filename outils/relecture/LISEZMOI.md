# La capture de « La relecture »

La scène 4 de Stalika (`stalika/components/sections/relecture-fenetre.tsx`) montre le site d'AR Transfert,
le chauffeur VTC de Béziers, dans une fenêtre de navigateur. La page n'est pas refaite : c'est une capture du
site en ligne (`https://ar-transfert-apercu.vercel.app`), faite avec `capturer.mjs`, le 2026-10-07.

Ce dossier n'est pas publié : la construction (Vercel) ne prend que `stalika/`.

## Ce que fait le script

`node capturer.mjs` (Node, Chrome et ffmpeg ; Playwright vient de `../realisations/node_modules`) ouvre le
site à deux largeurs, attend que son ouverture soit jouée (9 s), puis :

- **cache le paragraphe d'introduction** (`.lead`), que la scène refait en vrai texte pour le réécrire lettre
  à lettre, et le bouton WhatsApp flottant ;
- **prend dix images** à 0,6 s d'écart et garde la plus calme, celle où la lumière autour des phares est la
  plus faible : le site fait un appel de phares toutes les 4 s, et la scène refait le sien en code ;
- **mesure** le paragraphe (boîte, corps, interligne), les phares, la plaque : `sortie/mesures-<nom>.json`.

| Mise en page | Viewport | Image | Pour |
|---|---|---|---|
| `bureau` | 1024 × 700, densité 1,5 | la page entière, 1536 × 1050 | fenêtre d'au moins 576 px |
| `mobile` | 390 × 700, densité 2 | recadrée de 140 à 700 px : 780 × 1120 | fenêtre plus étroite |

## Les poser dans le site

```
cp sortie/ar-bureau.webp sortie/ar-mobile.webp ../../stalika/public/relecture/
```

Puis reporter dans `MISES` (`relecture-fenetre.tsx`) ce que les mesures disent : la taille du dessin (`l`, `h`),
la boîte du paragraphe (`texte`), le centre des phares (`phares.g` et `.d`), le cadre qui les entoure, et le
point où le client épingle son commentaire. Les mesures sont en pixels de la page, le recadrage du mobile en
décale les ordonnées (de 140 px).

Si le site d'AR Transfert change, refaire la capture ; si son paragraphe change, `LIGNES` et `ANCIEN` dans
`relecture-fenetre.tsx` le disent aussi : les retours à la ligne y sont posés à la main, comme sur le site
(`text-wrap: pretty`).
