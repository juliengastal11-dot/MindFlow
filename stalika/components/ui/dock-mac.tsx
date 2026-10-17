import { CalendarDays, FolderOpen, MessageCircle, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Un Dock à la façon d'un Mac, au bas du bureau dessiné sur l'écran de
   l'ordinateur de la plongée (`EcranMac`) : c'est de l'icône de la
   conversation que la fenêtre de discussion sort, avec l'effet Génie
   (`lib/genie.ts`, piloté par `Plongee`).

   Idées : le Dock de Watermelon (barre arrondie, tuiles, point sous l'appli
   ouverte, rebond à ressort) et le « Floating Dock » d'Aceternity (21st), redits
   avec un verre clair et les couleurs du site. Aucune icône
   d'Apple : des tuiles inventées (logo, notes, conversation, agenda, projets).

   Mesuré pour l'écran virtuel du Mac (environ 1 300 px de large) : des tuiles
   de 64 px, comme un vrai Dock, pour qu'il se lise encore quand l'écran ne
   fait que 200 px dans la scène. 84 px de haut en tout. Sans flou d'arrière-plan :
   derrière lui, il n'y a que le fond d'écran, et le flou coûte cher dans une
   transformation en perspective.

   Décoratif : la page le fait rebondir au défilement ; il n'est ni cliquable
   ni lu par les lecteurs d'écran (la fenêtre, elle, l'est).
--------------------------------------------------------------------------- */

const tuile =
  "grid size-16 place-items-center rounded-[28%] ring-1 ring-foreground/10 shadow-[0_3px_8px_color-mix(in_oklab,var(--color-foreground)_22%,transparent),inset_0_1px_0_color-mix(in_oklab,var(--color-lin)_40%,transparent)]";

export function DockMac({ className }: { className?: string }) {
  return (
    <div
      data-dock=""
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex items-end gap-3 rounded-[1.6rem] p-2.5",
        // un verre clair et translucide sur le fond d'écran sombre, sans flou
        "bg-lin/20 bg-linear-to-b from-lin/[0.12] via-transparent to-transparent ring-1 ring-lin/25 shadow-[0_14px_34px_-12px_color-mix(in_oklab,var(--color-foreground)_70%,transparent),inset_0_1px_0_color-mix(in_oklab,var(--color-lin)_45%,transparent)]",
        className,
      )}
    >
      <span className={cn(tuile, "bg-linear-to-b from-card to-background font-display text-3xl font-semibold text-accent")}>S</span>
      <span className={cn(tuile, "bg-linear-to-b from-accent to-encre text-lin")}>
        <NotebookPen className="size-8" strokeWidth={2} />
      </span>
      {/* La conversation : la fenêtre sort d'ici. Le point dit qu'elle est ouverte. */}
      <span data-dock-conversation="" className="relative flex flex-col items-center">
        <span className={cn(tuile, "bg-linear-to-b from-succes/70 to-succes text-on-succes")}>
          <MessageCircle className="size-9" strokeWidth={2} />
        </span>
        <span data-dock-point="" className="absolute -bottom-2 size-1.5 rounded-full bg-lin/85 opacity-0" />
      </span>
      <span className={cn(tuile, "bg-lin text-destructive")}>
        <CalendarDays className="size-8" strokeWidth={2} />
      </span>
      <span className={cn(tuile, "bg-linear-to-b from-muted-foreground to-card text-accent")}>
        <FolderOpen className="size-8" strokeWidth={2} />
      </span>
    </div>
  );
}
