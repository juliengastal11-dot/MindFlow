/* ---------------------------------------------------------------------------
   L'effet Génie de macOS, à l'ouverture : une fenêtre sort de son icône du
   Dock comme d'un entonnoir, monte, s'élargit, puis se pose à sa place.

   Comment : la fenêtre est recopiée (copie inerte, sans identifiants) dans
   `tranches` bandes horizontales. Chaque bande montre sa part de la fenêtre et
   reçoit sa propre transformation (position, largeur, hauteur) : vue de loin,
   la fenêtre se courbe le long de l'entonnoir. La vraie fenêtre reste cachée
   pendant l'effet et prend le relais à la fin, à la même place.

   Le tout est piloté par une avancée de 0 à 1 (le défilement, dans `Plongee`),
   donc réversible : en remontant, la fenêtre rentre dans son icône.

   Idée : le comportement du Génie de macOS ; le découpage en bandes est la
   façon courante de le rejouer sans WebGL.
--------------------------------------------------------------------------- */

export type Boite = { x: number; y: number; l: number; h: number };

const borne = (x: number) => Math.min(1, Math.max(0, x));
const douce = (x: number) => x * x * (3 - 2 * x);
const sortie = (x: number) => 1 - Math.pow(1 - x, 3);
const melange = (a: number, b: number, t: number) => a + (b - a) * t;

export type Genie = {
  /** Pose l'effet à l'avancée `g` (0 : dans l'icône, 1 : fenêtre à sa place). */
  poser: (g: number, fenetre: Boite, icone: Boite) => void;
  detruire: () => void;
};

/** Prépare l'effet : `source` est la vraie fenêtre (recopiée telle qu'elle est maintenant), `hote` l'élément où poser les bandes. */
export function creerGenie(source: HTMLElement, hote: HTMLElement, tranches: number): Genie {
  const l = source.offsetWidth;
  const h = source.offsetHeight;
  const hb = h / tranches;
  const scene = document.createElement("div");
  scene.setAttribute("aria-hidden", "true");
  scene.inert = true;
  Object.assign(scene.style, { position: "absolute", inset: "0", pointerEvents: "none", zIndex: "1" });
  const bandes: HTMLDivElement[] = [];
  for (let k = 0; k < tranches; k++) {
    const bande = document.createElement("div");
    Object.assign(bande.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: `${l}px`,
      height: `${hb}px`,
      overflow: "hidden",
      transformOrigin: "0 0",
      willChange: "transform",
    });
    const copie = source.cloneNode(true) as HTMLElement;
    copie.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    copie.removeAttribute("id");
    Object.assign(copie.style, {
      position: "absolute",
      left: "0",
      top: `${-k * hb}px`,
      width: `${l}px`,
      height: `${h}px`,
      transform: "none",
      visibility: "visible",
      opacity: "1",
    });
    bande.appendChild(copie);
    scene.appendChild(bande);
    bandes.push(bande);
  }
  hote.appendChild(scene);

  const poser = (g: number, f: Boite, i: Boite) => {
    scene.style.visibility = g <= 0.001 ? "hidden" : "visible";
    if (g <= 0.001) return;
    // Deux temps qui se chevauchent : la fenêtre monte hors de l'icône (g1), puis elle s'élargit et se pose (g2).
    const g1 = sortie(borne(g / 0.62));
    const g2 = douce(borne((g - 0.38) / 0.62));
    const ancre = i.y + i.h * 0.5; // le bas de l'entonnoir : le milieu de l'icône
    const haut = melange(ancre, f.y, g1);
    const bas = melange(ancre, f.y + f.h, g2);
    const cxFenetre = f.x + f.l / 2;
    const cxIcone = i.x + i.l / 2;
    // À la hauteur y, quelle part de la largeur de la fenêtre ? Près de l'icône, celle de l'icône ; plus haut, toute.
    const ouverture = (y: number) => {
      const s = borne((ancre - y) / Math.max(1, ancre - f.y));
      const entonnoir = douce(borne(s / 0.85));
      return melange(entonnoir, 1, g2);
    };
    // Chaque bande est un trapèze : son bord haut a la largeur de l'entonnoir à sa hauteur, son bord bas aussi. Sans
    // cela, les bords de la fenêtre feraient des marches d'escalier.
    const bord = (y: number) => {
      const o = ouverture(y);
      return { largeur: melange(i.l, f.l, o), cx: melange(cxIcone, cxFenetre, o) };
    };
    let dessus = bord(haut);
    for (let k = 0; k < tranches; k++) {
      const y0 = melange(haut, bas, k / tranches);
      const y1 = melange(haut, bas, (k + 1) / tranches);
      const dessous = bord(y1);
      const gauche = Math.min(dessus.cx - dessus.largeur / 2, dessous.cx - dessous.largeur / 2);
      const droite = Math.max(dessus.cx + dessus.largeur / 2, dessous.cx + dessous.largeur / 2);
      const sx = Math.max(0.0001, (droite - gauche) / l);
      // un pixel d'écran de plus vers le bas : sans lui, un fil passe entre deux bandes, même très comprimées
      const sy = Math.max(0.0001, (y1 - y0 + 1) / hb);
      // du repère de l'écran à celui de la bande, avant sa mise à l'échelle
      const local = (x: number) => (x - gauche) / sx;
      const b = bandes[k].style;
      b.transform = `translate(${gauche}px, ${y0}px) scale(${sx}, ${sy})`;
      b.clipPath = `polygon(${local(dessus.cx - dessus.largeur / 2)}px 0, ${local(dessus.cx + dessus.largeur / 2)}px 0, ${local(dessous.cx + dessous.largeur / 2)}px ${hb}px, ${local(dessous.cx - dessous.largeur / 2)}px ${hb}px)`;
      dessus = dessous;
    }
    scene.style.opacity = String(borne(g / 0.06));
  };

  return { poser, detruire: () => scene.remove() };
}
