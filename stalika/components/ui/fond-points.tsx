/* ---------------------------------------------------------------------------
   FondPoints : un fond en points, dont le motif s'efface vers les bords
   (masque elliptique). Extrait collé par J le 2026-10-07 pour la section 04.

   La copie exacte est dans l'historique git (« copie exacte de son extrait »).
   Ici, le blanc pur et le gris de l'extrait sont passés aux jetons du thème,
   que le garde-fou exige : le fond est `background`, les points `border`. Le
   motif suit donc la palette du site, et le jour où elle change, il la suit.
--------------------------------------------------------------------------- */

export function FondPoints() {
  return (
    <div className="relative h-full w-full bg-background">
      <div className="absolute h-full w-full bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
    </div>
  );
}
