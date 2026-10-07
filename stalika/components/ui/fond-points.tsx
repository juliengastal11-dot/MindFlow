/* ---------------------------------------------------------------------------
   FondPoints : un fond en points, dont le motif s'efface vers les bords
   (masque elliptique). Extrait collé par J le 2026-10-07 pour la section 04,
   repris tel quel : seul `class` est devenu `className`.
--------------------------------------------------------------------------- */

export function FondPoints() {
  return (
    <div className="relative h-full w-full bg-white">
      <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
    </div>
  );
}
