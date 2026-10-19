/* ---------------------------------------------------------------------------
   Un morphing en WebGL : deux images posées sur une même grille de triangles,
   dont chaque sommet a sa place dans la première (A) et sa place dans la
   seconde (B). À l'instant `g`, les sommets sont entre les deux places ; les
   deux images s'y déforment ensemble et passent de l'une à l'autre (`w`). Les
   mêmes détails restant aux mêmes places, on voit une seule chose qui se
   transforme, jamais deux images l'une sur l'autre.

   Tout se mesure dans un même repère (les pixels de la vue éclatée, pour la
   montre) : la zone de la toile, la zone de chaque image, la grille.
--------------------------------------------------------------------------- */

export type Zone = { x: number; y: number; l: number; h: number };

const SOMMETS = `
attribute vec2 aA;
attribute vec2 aB;
uniform float uG;
uniform vec4 uZone;
uniform vec4 uZoneA;
uniform vec4 uZoneB;
uniform vec2 uEchA;
uniform vec2 uEchB;
varying vec2 vA;
varying vec2 vB;
void main() {
  vec2 p = mix(aA, aB, uG);
  vec2 n = (p - uZone.xy) / uZone.zw;
  gl_Position = vec4(n.x * 2.0 - 1.0, 1.0 - n.y * 2.0, 0.0, 1.0);
  vA = (aA - uZoneA.xy) / uZoneA.zw;
  vB = (aB - uZoneB.xy) / uZoneB.zw;
}`;

const FRAGMENTS = `
precision mediump float;
uniform sampler2D tA;
uniform sampler2D tB;
uniform vec2 uEchA;
uniform vec2 uEchB;
uniform float uW;
varying vec2 vA;
varying vec2 vB;
vec4 lire(sampler2D t, vec2 uv, vec2 ech) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  // un peu plus net que le filtrage trilinéaire : aussi net que l'image de la page, qui prend le relais à la fin
  return texture2D(t, uv * ech, -0.6);
}
void main() {
  gl_FragColor = mix(lire(tA, vA, uEchA), lire(tB, vB, uEchB), uW);
}`;

function compiler(gl: WebGLRenderingContext, type: number, source: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

const puissance = (n: number) => 2 ** Math.ceil(Math.log2(n));

/* L'image, posée dans le coin d'une texture aux côtés en puissances de deux (les mipmaps marchent alors partout, WebGL 1
   compris) : la montre réduite à l'écran ne scintille pas. Rend l'échelle de ses coordonnées dans la texture. */
function texture(gl: WebGLRenderingContext, image: HTMLImageElement) {
  const l = image.naturalWidth;
  const h = image.naturalHeight;
  const toile = document.createElement("canvas");
  toile.width = puissance(l);
  toile.height = puissance(h);
  toile.getContext("2d")?.drawImage(image, 0, 0);
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  // les couleurs prémultipliées par l'alpha : le mélange des deux images et le bord transparent restent justes
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toile);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return [l / toile.width, h / toile.height] as const;
}

/**
 * Prépare le morphing dans `toile`. La grille : `nx` × `ny` sommets répartis sur `zone`, et pour chacun son déplacement
 * de A à B (`deplacements` : x puis y, rangée par rangée). Rend `null` sans WebGL.
 */
export function creerMorphing(
  toile: HTMLCanvasElement,
  zone: Zone,
  a: { image: HTMLImageElement; zone: Zone },
  b: { image: HTMLImageElement; zone: Zone },
  grille: { nx: number; ny: number; deplacements: Float32Array },
) {
  const gl = toile.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const vs = compiler(gl, gl.VERTEX_SHADER, SOMMETS);
  const fs = compiler(gl, gl.FRAGMENT_SHADER, FRAGMENTS);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  // les sommets : leur place dans A (la grille), leur place dans B (la grille déplacée)
  const { nx, ny, deplacements } = grille;
  const posA = new Float32Array(nx * ny * 2);
  const posB = new Float32Array(nx * ny * 2);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = (j * nx + i) * 2;
      const x = zone.x + (zone.l * i) / (nx - 1);
      const y = zone.y + (zone.h * j) / (ny - 1);
      posA[k] = x;
      posA[k + 1] = y;
      posB[k] = x + deplacements[k];
      posB[k + 1] = y + deplacements[k + 1];
    }
  }
  const indices = new Uint16Array((nx - 1) * (ny - 1) * 6);
  let n = 0;
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const p = j * nx + i;
      indices.set([p, p + 1, p + nx, p + 1, p + nx + 1, p + nx], n);
      n += 6;
    }
  }
  const attribut = (nom: string, donnees: Float32Array) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, donnees, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, nom);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  };
  attribut("aA", posA);
  attribut("aB", posB);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.activeTexture(gl.TEXTURE0);
  const echA = texture(gl, a.image);
  gl.activeTexture(gl.TEXTURE1);
  const echB = texture(gl, b.image);
  gl.uniform1i(gl.getUniformLocation(prog, "tA"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "tB"), 1);
  gl.uniform2f(gl.getUniformLocation(prog, "uEchA"), echA[0], echA[1]);
  gl.uniform2f(gl.getUniformLocation(prog, "uEchB"), echB[0], echB[1]);
  const z = (nom: string, q: Zone) => gl.uniform4f(gl.getUniformLocation(prog, nom), q.x, q.y, q.l, q.h);
  z("uZone", zone);
  z("uZoneA", a.zone);
  z("uZoneB", b.zone);
  const uG = gl.getUniformLocation(prog, "uG");
  const uW = gl.getUniformLocation(prog, "uW");
  gl.disable(gl.BLEND);

  return {
    /** La finesse du tampon : pixels de toile par pixel de zone. À régler sur la taille à l'écran. */
    finesse(f: number) {
      const l = Math.max(1, Math.round(zone.l * f));
      const h = Math.max(1, Math.round(zone.h * f));
      if (toile.width !== l || toile.height !== h) {
        toile.width = l;
        toile.height = h;
      }
      gl.viewport(0, 0, l, h);
    },
    /** `g` : où en sont les sommets (0 : dans A, 1 : dans B) ; `w` : où en est le passage d'une image à l'autre. */
    dessiner(g: number, w: number) {
      gl.uniform1f(uG, g);
      gl.uniform1f(uW, w);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    },
  };
}

/** Les déplacements de la grille, lus dans leur fichier (Int16, en 1/16 de pixel). */
export async function lireDeplacements(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} : ${r.status}`);
  const brut = new Int16Array(await r.arrayBuffer());
  const out = new Float32Array(brut.length);
  for (let i = 0; i < brut.length; i++) out[i] = brut[i] / 16;
  return out;
}
