import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   La montre de la section 04 (J, 2026-10-18 : « une très belle montre, qui au
   défilement tourne et montre tout le processus de création »). Dessinée en
   code, d'après une montre habillée que J a envoyée en référence (on en garde
   l'allure, jamais le nom ni le logo) : boîtier en or jaune très fin, lunette
   large et polie, cadran champagne brossé soleil, douze bâtons appliqués,
   deux aiguilles bâtons noires, petite couronne cannelée, cornes courtes,
   bracelet alligator noir surpiqué. Deux ajouts fidèles à l'horlogerie, pour
   le déroulé : la couronne fait poussoir (un chronographe monopoussoir, comme
   en font les montres habillées) et un petit compteur de 72 heures prend la
   place de la petite seconde, au-dessus de 6 h. Au dos, un fond saphir : on y
   voit le mouvement (platine perlée, ponts à côtes de Genève, rotor en or,
   balancier et spiral, rubis), et la gravure « le code est à vous ».

   Le composant ne fait que dessiner : la section (`scene-livre.tsx`) anime ses
   pièces par leurs repères `data-montre-…`. Taille : `--montre-l` (largeur de
   la tête), toutes les mesures en suivent (app/globals.css, « La montre »).
   Couleurs : l'or vient du doré du thème ; le cuir et l'acier du mouvement sont
   des matières, réglées au même endroit. Décorative : `aria-hidden`.
--------------------------------------------------------------------------- */

const C = 220; // le centre de la tête, dans le repère des dessins (440 de côté)
const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => n.toFixed(2);

/* Le mouvement, au dos : une roue dentée, ses bras et son rubis. */
function roue(cx: number, cy: number, r: number, dents: number) {
  let d = "";
  for (let i = 0; i < dents; i++) {
    const A = (k: number) => ((i + k) / dents) * 2 * Math.PI;
    const p = (rr: number, a: number) => `${f(rr * Math.cos(a))} ${f(rr * Math.sin(a))}`;
    d += `${i ? "L" : "M"}${p(r, A(0))} L${p(r + 2.4, A(0.3))} L${p(r + 2.4, A(0.55))} L${p(r, A(0.85))} `;
  }
  return { cx, cy, r, d: `${d}Z` };
}
const ROUES = [roue(152, 224, 26, 56), roue(82, 204, 17, 36), roue(128, 184, 12, 26), roue(52, 232, 10, 22)];
const SPIRAL = (() => {
  let s = "M0 0";
  for (let t = 0; t < 16 * Math.PI; t += 0.08) {
    const r = 2.2 + t * 0.54;
    s += ` L${f(r * Math.cos(t))} ${f(r * Math.sin(t))}`;
  }
  return s;
})();
const RUBIS = [
  [188, 192],
  [82, 204],
  [128, 184],
  [246, 162],
  [34, 186],
  [110, 226],
] as const;

/* Le compteur des 72 heures : un tour complet, une graduation toutes les deux heures, les douze heures plus longues. */
const GRADUATIONS = Array.from({ length: 36 }, (_, k) => {
  const a = rad((k / 36) * 360);
  const long = k % 6 === 0;
  return { x1: 30 * Math.sin(a), y1: -30 * Math.cos(a), x2: (long ? 24 : 27) * Math.sin(a), y2: -(long ? 24 : 27) * Math.cos(a), long };
});

function Defs() {
  return (
    <defs>
      <linearGradient id="mt-corne" x1="0" x2="1">
        <stop offset="0" stopColor="var(--or-4)" />
        <stop offset=".22" stopColor="var(--or-2)" />
        <stop offset=".55" stopColor="var(--or-1)" />
        <stop offset=".8" stopColor="var(--or-3)" />
        <stop offset="1" stopColor="var(--or-5)" />
      </linearGradient>
      <linearGradient id="mt-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--or-1)" />
        <stop offset=".45" stopColor="var(--or-3)" />
        <stop offset="1" stopColor="var(--or-5)" />
      </linearGradient>
      <pattern id="mt-cannelure" width="2.6" height="40" patternUnits="userSpaceOnUse">
        <rect width="1.2" height="40" fill="var(--or-5)" opacity=".65" />
      </pattern>
      <linearGradient id="mt-baton" x1="0" x2="1">
        <stop offset="0" stopColor="var(--or-5)" />
        <stop offset=".3" stopColor="var(--montre-cuivre)" />
        <stop offset=".5" stopColor="var(--or-1)" />
        <stop offset=".7" stopColor="var(--montre-cuivre)" />
        <stop offset="1" stopColor="var(--or-5)" />
      </linearGradient>
      <linearGradient id="mt-allume" x1="0" x2="1">
        <stop offset="0" stopColor="var(--or-3)" />
        <stop offset=".5" stopColor="var(--color-lin)" />
        <stop offset="1" stopColor="var(--or-3)" />
      </linearGradient>
      <linearGradient id="mt-aiguille" x1="0" x2="1">
        <stop offset="0" stopColor="var(--montre-encre)" />
        <stop offset=".5" stopColor="var(--montre-encre-reflet)" />
        <stop offset="1" stopColor="var(--montre-encre)" />
      </linearGradient>
      <radialGradient id="mt-vis" cx=".38" cy=".32">
        <stop offset="0" stopColor="var(--or-1)" />
        <stop offset=".65" stopColor="var(--or-3)" />
        <stop offset="1" stopColor="var(--or-5)" />
      </radialGradient>
      <filter id="mt-lueur" x="-200%" y="-30%" width="500%" height="160%">
        <feGaussianBlur stdDeviation="2.2" result="flou" />
        <feMerge>
          <feMergeNode in="flou" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="mt-ombre" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="1.6" dy="2.4" stdDeviation="1.1" floodColor="var(--montre-ombre)" floodOpacity=".55" />
      </filter>
      {/* l'alligator : des écailles rectangulaires, plus grandes au milieu, plus petites vers les bords */}
      <radialGradient id="mt-ecaille" cx=".5" cy=".28" r=".85">
        <stop offset="0" stopColor="var(--montre-cuir-3)" />
        <stop offset=".6" stopColor="var(--montre-cuir-2)" />
        <stop offset="1" stopColor="var(--montre-cuir-1)" />
      </radialGradient>
      <pattern id="mt-ecailles" width="228" height="62" patternUnits="userSpaceOnUse">
        <rect width="228" height="62" fill="var(--montre-cuir-0)" />
        <g fill="url(#mt-ecaille)">
          {[1, 16.5, 32, 47.5].map((y) => (
            <g key={y}>
              <rect x="1.5" y={y} width="13" height="14" rx="4" />
              <rect x="213.5" y={y} width="13" height="14" rx="4" />
            </g>
          ))}
          {[1, 21.5, 42].map((y) => (
            <g key={y}>
              <rect x="16" y={y} width="20" height="19" rx="5" />
              <rect x="192" y={y} width="20" height="19" rx="5" />
            </g>
          ))}
          {[1, 31.5].map((y) => (
            <g key={y}>
              <rect x="37.5" y={y} width="28" height="29" rx="7" />
              <rect x="67" y={y} width="46" height="29" rx="8" />
              <rect x="115" y={y} width="46" height="29" rx="8" />
              <rect x="162.5" y={y} width="28" height="29" rx="7" />
            </g>
          ))}
        </g>
      </pattern>
      <linearGradient id="mt-galbe" x1="0" x2="1">
        <stop offset="0" stopColor="var(--montre-cuir-0)" stopOpacity=".8" />
        <stop offset=".1" stopColor="var(--montre-cuir-0)" stopOpacity=".15" />
        <stop offset=".45" stopColor="var(--color-lin)" stopOpacity=".06" />
        <stop offset=".9" stopColor="var(--montre-cuir-0)" stopOpacity=".15" />
        <stop offset="1" stopColor="var(--montre-cuir-0)" stopOpacity=".8" />
      </linearGradient>
      {/* le mouvement */}
      <radialGradient id="mt-perle">
        <stop offset="0" stopColor="var(--montre-acier-1)" />
        <stop offset=".45" stopColor="var(--montre-acier-3)" />
        <stop offset=".8" stopColor="var(--montre-acier-2)" />
        <stop offset="1" stopColor="var(--montre-acier-4)" />
      </radialGradient>
      <pattern id="mt-perlage" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--montre-acier-3)" />
        <circle cx="4" cy="4" r="4.8" fill="url(#mt-perle)" opacity=".9" />
      </pattern>
      <pattern id="mt-cotes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
        <rect width="10" height="10" fill="var(--montre-acier-3)" />
        <rect width="5" height="10" fill="var(--montre-acier-2)" />
        <rect x="4.5" width="1.1" height="10" fill="var(--montre-acier-1)" opacity=".9" />
      </pattern>
      <pattern id="mt-cotes-or" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
        <rect width="10" height="10" fill="var(--or-4)" />
        <rect width="5" height="10" fill="var(--or-2)" />
        <rect x="4.5" width="1.1" height="10" fill="var(--or-1)" />
      </pattern>
      <radialGradient id="mt-rubis" cx=".35" cy=".32">
        <stop offset="0" stopColor="var(--montre-rubis-1)" />
        <stop offset=".55" stopColor="var(--montre-rubis-2)" />
        <stop offset="1" stopColor="var(--montre-rubis-3)" />
      </radialGradient>
      <filter id="mt-ombre-pont" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="var(--montre-cuir-0)" floodOpacity=".7" />
      </filter>
      <g id="mt-cornes">
        <path d="M80 64 L 80 18 Q 80 12, 86 12 L 100 12 Q 106 12, 106 18 L 106 40 Z" fill="url(#mt-corne)" />
        <path d="M360 64 L 360 18 Q 360 12, 354 12 L 340 12 Q 334 12, 334 18 L 334 40 Z" fill="url(#mt-corne)" />
        <path d="M80 376 L 80 422 Q 80 428, 86 428 L 100 428 Q 106 428, 106 422 L 106 400 Z" fill="url(#mt-corne)" />
        <path d="M360 376 L 360 422 Q 360 428, 354 428 L 340 428 Q 334 428, 334 422 L 334 400 Z" fill="url(#mt-corne)" />
        <g stroke="var(--or-1)" strokeWidth="1.4">
          <line x1="89" y1="44" x2="89" y2="15" opacity=".8" />
          <line x1="351" y1="44" x2="351" y2="15" opacity=".45" />
          <line x1="89" y1="396" x2="89" y2="425" opacity=".5" />
          <line x1="351" y1="396" x2="351" y2="425" opacity=".3" />
        </g>
      </g>
    </defs>
  );
}

function Bracelet({ cote }: { cote: "haut" | "bas" }) {
  return (
    <div className={cn("montre-bracelet", cote)}>
      <svg viewBox="0 0 228 290" preserveAspectRatio="none">
        <rect width="228" height="290" fill="url(#mt-ecailles)" />
        <rect width="228" height="290" fill="url(#mt-galbe)" />
        <line x1="6.5" y1="0" x2="6.5" y2="290" stroke="var(--montre-cuir-4)" strokeWidth="1.4" strokeDasharray="6 4" />
        <line x1="221.5" y1="0" x2="221.5" y2="290" stroke="var(--montre-cuir-4)" strokeWidth="1.4" strokeDasharray="6 4" />
      </svg>
    </div>
  );
}

/** Une aiguille et son ombre, qui tournent ensemble autour du centre ; l'ombre reste décalée vers le bas à droite. */
function Aiguille({ nom, d, fill, angle }: { nom: string; d: string; fill: string; angle: number }) {
  return (
    <>
      <g data-montre-ombre={nom} transform={`translate(1.4 2.2) rotate(${angle} ${C} ${C})`} opacity=".28">
        <path d={d} fill="var(--montre-ombre)" />
      </g>
      <g data-montre-aiguille={nom} transform={`rotate(${angle} ${C} ${C})`}>
        <path d={d} fill={fill} />
      </g>
    </>
  );
}

function Face() {
  return (
    <div className="montre-face">
      <Bracelet cote="haut" />
      <Bracelet cote="bas" />
      <div className="montre-tete">
        <svg className="montre-dessin" viewBox="-60 -60 560 560">
          <use href="#mt-cornes" />
          {/* la couronne, qui fait aussi poussoir */}
          <g data-montre-couronne="">
            <rect x="436" y="211" width="10" height="18" fill="var(--or-4)" />
            <rect x="444" y="203" width="16" height="34" rx="5" fill="url(#mt-metal)" />
            <rect x="446" y="205" width="12" height="30" rx="3" fill="url(#mt-cannelure)" />
          </g>
        </svg>
        <div className="montre-lunette" />
        <div className="montre-cadran">
          <div className="montre-compteur" />
        </div>
        <svg className="montre-dessin" viewBox="-60 -60 560 560">
          {/* l'arc qui suit l'aiguille du chronographe, au bord du cadran : le chemin parcouru */}
          <circle
            data-montre-arc=""
            cx={C}
            cy={C}
            r="191"
            fill="none"
            stroke="var(--or-4)"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength="360"
            strokeDasharray="360"
            strokeDashoffset="360"
            transform={`rotate(-90 ${C} ${C})`}
          />
          <g filter="url(#mt-ombre)">
            {Array.from({ length: 12 }, (_, h) => (
              <rect key={h} x={C - 2.3} y={C - 182} width="4.6" height="50" rx=".8" fill="url(#mt-baton)" transform={`rotate(${h * 30} ${C} ${C})`} />
            ))}
          </g>
          {/* les index qui s'allument quand l'aiguille du chrono les passe */}
          <g filter="url(#mt-lueur)">
            {Array.from({ length: 12 }, (_, h) => (
              <rect
                key={h}
                data-montre-index={h}
                x={C - 2.3}
                y={C - 182}
                width="4.6"
                height="50"
                rx=".8"
                fill="url(#mt-allume)"
                opacity="0"
                transform={`rotate(${h * 30} ${C} ${C})`}
              />
            ))}
          </g>
          <text x={C} y="166" textAnchor="middle" fontWeight="500" fontSize="12.5" letterSpacing="3.2" fill="var(--montre-encre)">
            STALIKA
          </text>
          <text x={C} y="179" textAnchor="middle" fontWeight="500" fontSize="7.2" letterSpacing="2.4" fill="var(--montre-encre)" fillOpacity=".85">
            SUR MESURE
          </text>
          <text x={C} y="411" textAnchor="middle" fontWeight="500" fontSize="5.2" letterSpacing="2" fill="var(--montre-encre)" fillOpacity=".7">
            FAIT MAIN
          </text>
          {/* le compteur des 72 heures */}
          <g transform={`translate(${C} 312)`}>
            {GRADUATIONS.map((g, k) => (
              <line
                key={k}
                x1={f(g.x1)}
                y1={f(g.y1)}
                x2={f(g.x2)}
                y2={f(g.y2)}
                stroke="var(--montre-encre)"
                strokeWidth={g.long ? 0.9 : 0.45}
                strokeOpacity={g.long ? 0.85 : 0.55}
              />
            ))}
            {(
              [
                ["72", 0],
                ["24", 120],
                ["48", 240],
              ] as const
            ).map(([t, a]) => (
              <text key={t} x={f(17 * Math.sin(rad(a)))} y={f(-17 * Math.cos(rad(a)) + 2.3)} textAnchor="middle" fontSize="6" fontWeight="500" fill="var(--montre-encre)">
                {t}
              </text>
            ))}
            <g data-montre-compteur="">
              <path d="M-.8 4 L -.4 -28 L .4 -28 L .8 4 Z" fill="var(--or-4)" />
            </g>
            <circle r="2.2" fill="url(#mt-vis)" />
          </g>
          {/* les aiguilles : heures, minutes, et l'aiguille fine du chronographe */}
          <Aiguille nom="heures" d="M218.6 226 L 219.2 104 L 220.8 104 L 221.4 226 Z" fill="url(#mt-aiguille)" angle={-62} />
          <Aiguille nom="minutes" d="M218.9 228 L 219.5 50 L 220.5 50 L 221.1 228 Z" fill="url(#mt-aiguille)" angle={62} />
          <g data-montre-aiguille="chrono">
            <path d="M219.55 252 L 219.85 36 L 220.15 36 L 220.45 252 Z" fill="var(--montre-encre)" />
            <circle cx={C} cy="247" r="3" fill="none" stroke="var(--montre-encre)" strokeWidth="1.1" />
          </g>
          <circle cx={C} cy={C} r="6" fill="url(#mt-vis)" />
          <circle cx={C} cy={C} r="1.8" fill="var(--montre-encre)" />
        </svg>
        <div className="montre-verre" data-montre-reflet="" />
      </div>
    </div>
  );
}

function Dos() {
  return (
    <div className="montre-dos">
      <Bracelet cote="haut" />
      <Bracelet cote="bas" />
      <div className="montre-tete">
        <svg className="montre-dessin" viewBox="-60 -60 560 560">
          <use href="#mt-cornes" />
          <g transform="translate(440 0) scale(-1 1)">
            <rect x="436" y="211" width="10" height="18" fill="var(--or-4)" />
            <rect x="444" y="203" width="16" height="34" rx="5" fill="url(#mt-metal)" />
            <rect x="446" y="205" width="12" height="30" rx="3" fill="url(#mt-cannelure)" />
          </g>
        </svg>
        <div className="montre-anneau" />
        <svg className="montre-dessin" viewBox="-60 -60 560 560">
          <path id="mt-arc-fond" d="M220 46 A174 174 0 1 1 219.9 46" fill="none" />
          <text fontSize="9" letterSpacing="4.4" fill="var(--or-5)" fontWeight="500">
            <textPath href="#mt-arc-fond">VOTRE CODE · VOTRE DOMAINE · À VOTRE NOM · STALIKA · SUR MESURE · FAIT MAIN ·</textPath>
          </text>
        </svg>
        <div className="montre-fenetre">
          <svg viewBox="0 0 268 268">
            <rect width="268" height="268" fill="url(#mt-perlage)" />
            {ROUES.map((r, k) => (
              <g key={k} transform={`translate(${r.cx} ${r.cy})`}>
                <g data-montre-roue={k % 2 ? "inverse" : ""}>
                  <path d={r.d} fill="url(#mt-vis)" stroke="var(--or-5)" strokeWidth=".5" />
                  <circle r={r.r * 0.8} fill="var(--montre-cuir-1)" />
                  {Array.from({ length: 5 }, (_, b) => (
                    <path key={b} d={`M-1.6 0 L -.9 ${f(-r.r * 0.82)} L .9 ${f(-r.r * 0.82)} L 1.6 0 Z`} fill="url(#mt-vis)" transform={`rotate(${b * 72})`} />
                  ))}
                  <circle r={r.r * 0.82} fill="none" stroke="url(#mt-vis)" strokeWidth="1.8" />
                  <circle r={r.r * 0.24} fill="url(#mt-vis)" />
                </g>
                <circle r="2.1" fill="url(#mt-rubis)" />
              </g>
            ))}
            <path
              d="M14 168 C 34 144, 62 134, 90 140 L 128 158 C 134 182, 120 210, 96 228 L 52 244 C 30 224, 16 198, 14 168 Z"
              fill="url(#mt-cotes)"
              filter="url(#mt-ombre-pont)"
              stroke="var(--montre-acier-4)"
              strokeWidth=".8"
            />
            <g transform="translate(188 192)">
              <g data-montre-balancier="">
                <circle r="38" fill="none" stroke="url(#mt-vis)" strokeWidth="5" />
                {Array.from({ length: 14 }, (_, k) => (
                  <circle key={k} cx={f(38 * Math.cos(rad(k * (360 / 14))))} cy={f(38 * Math.sin(rad(k * (360 / 14))))} r="1.9" fill="url(#mt-vis)" />
                ))}
                {[0, 120, 240].map((a) => (
                  <rect key={a} x="-1.4" y="-36" width="2.8" height="36" fill="url(#mt-vis)" transform={`rotate(${a})`} />
                ))}
              </g>
              <path d={SPIRAL} fill="none" stroke="var(--montre-acier-1)" strokeWidth=".42" opacity=".75" />
            </g>
            <path
              d="M174 182 C 196 166, 228 152, 258 150 L 264 172 C 240 176, 214 190, 202 206 Z"
              fill="url(#mt-cotes)"
              filter="url(#mt-ombre-pont)"
              stroke="var(--montre-acier-4)"
              strokeWidth=".8"
            />
            <g data-montre-rotor="" filter="url(#mt-ombre-pont)">
              <path d="M134 134 L 8 134 A 126 126 0 0 1 260 134 Z" fill="url(#mt-cotes-or)" stroke="var(--or-5)" strokeWidth="1.3" />
              <path id="mt-arc-rotor" d="M40 127 A 94 94 0 0 1 228 127" fill="none" />
              <text fontSize="8.2" letterSpacing="3" fill="var(--or-5)" fontWeight="600">
                <textPath href="#mt-arc-rotor" startOffset="50%" textAnchor="middle">
                  STALIKA · LE CODE EST À VOUS
                </textPath>
              </text>
              <circle cx="134" cy="134" r="15" fill="url(#mt-vis)" stroke="var(--or-5)" />
              <circle cx="134" cy="134" r="4.8" fill="url(#mt-rubis)" />
            </g>
            {RUBIS.map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y} r="4.2" fill="var(--montre-acier-1)" />
                <circle cx={x} cy={y} r="2.6" fill="url(#mt-rubis)" />
              </g>
            ))}
          </svg>
        </div>
        <div className="montre-verre montre-verre-dos" />
      </div>
    </div>
  );
}

/** La montre : la face et le dos, l'un derrière l'autre, prêts à se retourner (`data-montre-pivot`). */
export function Montre({ className }: { className?: string }) {
  return (
    <div className={cn("montre", className)} aria-hidden="true">
      <svg width="0" height="0" className="absolute">
        <Defs />
      </svg>
      <div className="montre-incline" data-montre-incline="">
        <div className="montre-pivot" data-montre-pivot="">
          <Face />
          <Dos />
        </div>
      </div>
    </div>
  );
}
