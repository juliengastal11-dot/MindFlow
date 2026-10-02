import { ClipboardCheck, NotebookPen, ReceiptText, type LucideIcon } from "lucide-react";
import { PRODUITS } from "@/lib/demos";
import type { AnimationDemo } from "./moteur";
import { CarnetPreview } from "./carnet-preview";
import { RelancePreview } from "./relance-preview";
import { ControlePreview } from "./controle-preview";
import { animerCarnet } from "./carnet-animation";
import { animerRelance } from "./relance-animation";
import { animerControle } from "./controle-animation";

/* ---------------------------------------------------------------------------
   Les démos du carrousel de la section 02, dans l'ordre : pour chacune, ses
   textes (`lib/demos.ts`), sa couleur, son icône, son film et son interface.
   L'écran du téléphone (`SaaSPreviewCard`) et la légende du carrousel lisent
   les mêmes données.
--------------------------------------------------------------------------- */

export type Demo = {
  id: string;
  nom: string;
  pourQui: string;
  description: string;
  fonctions: readonly string[];
  statut: string;
  resume: string;
  heure: string;
  /** La couleur du logiciel, en général `var(--produit-…)`. */
  accent: string;
  icone: LucideIcon;
  animation: AnimationDemo;
  lien?: { href: string; libelle: string };
  Apercu: React.ComponentType;
};

export const DEMOS: readonly Demo[] = [
  {
    id: "carnet",
    ...PRODUITS.carnet,
    accent: "var(--produit-carnet)",
    icone: NotebookPen,
    animation: animerCarnet,
    Apercu: CarnetPreview,
  },
  {
    id: "relance",
    ...PRODUITS.relance,
    accent: "var(--produit-relance)",
    icone: ReceiptText,
    animation: animerRelance,
    Apercu: RelancePreview,
  },
  {
    id: "controle",
    ...PRODUITS.controle,
    accent: "var(--produit-controle)",
    icone: ClipboardCheck,
    animation: animerControle,
    Apercu: ControlePreview,
  },
];
