import { CalendarDays, FolderOpen, MessageCircle, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Un Dock à la façon d'un Mac, au bas de l'écran de l'ordinateur, à la fin
   de la plongée : c'est de l'icône de la conversation que la fenêtre de
   discussion sort, avec l'effet Génie (`lib/genie.ts`, piloté par `Plongee`).

   Idées : le Dock de Watermelon (barre arrondie, tuiles, point sous l'appli
   ouverte, rebond à ressort) et le « Floating Dock » d'Aceternity (21st), redits
   avec le verre sombre de l'île du menu et les couleurs du site. Aucune icône
   d'Apple : des tuiles inventées (logo, notes, conversation, agenda, projets).

   Décoratif : la page le fait monter et rebondir au défilement ; il n'est ni
   cliquable ni lu par les lecteurs d'écran (la fenêtre, elle, l'est).
--------------------------------------------------------------------------- */

const tuile =
  "grid size-11 place-items-center rounded-[28%] ring-1 ring-foreground/10 shadow-[0_2px_6px_color-mix(in_oklab,var(--color-background)_80%,transparent),inset_0_1px_0_color-mix(in_oklab,var(--color-lin)_30%,transparent)] md:size-12";

export function DockMac({ className }: { className?: string }) {
  return (
    <div
      data-dock=""
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex items-end gap-2.5 rounded-[1.6rem] px-2.5 py-2 md:gap-3",
        // le verre de l'île du menu
        "bg-background/80 bg-linear-to-b from-foreground/[0.08] via-transparent to-transparent ring-1 ring-foreground/15 shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--color-background)_90%,transparent),inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_18%,transparent)] supports-[backdrop-filter]:bg-background/60 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150",
        className,
      )}
    >
      <span className={cn(tuile, "bg-linear-to-b from-card to-background font-display text-xl font-semibold text-accent")}>S</span>
      <span className={cn(tuile, "bg-linear-to-b from-accent to-encre text-lin")}>
        <NotebookPen className="size-5" strokeWidth={2} />
      </span>
      {/* La conversation : la fenêtre sort d'ici. Le point dit qu'elle est ouverte. */}
      <span data-dock-conversation="" className="relative flex flex-col items-center">
        <span className={cn(tuile, "bg-linear-to-b from-succes/70 to-succes text-on-succes")}>
          <MessageCircle className="size-6" strokeWidth={2} />
        </span>
        <span data-dock-point="" className="absolute -bottom-1.5 size-1 rounded-full bg-foreground/70 opacity-0" />
      </span>
      <span className={cn(tuile, "bg-lin text-destructive")}>
        <CalendarDays className="size-5" strokeWidth={2} />
      </span>
      <span className={cn(tuile, "bg-linear-to-b from-muted-foreground to-card text-accent")}>
        <FolderOpen className="size-5" strokeWidth={2} />
      </span>
    </div>
  );
}
