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
   textes (`lib/demos.ts`), son thème, sa couleur, son icône, son film et son
   interface. L'écran du téléphone (`SaaSPreviewCard`) et la légende du
   carrousel lisent les mêmes données.

   Chaque logiciel a son design (demande de J du 2026-10-04) : Carnet gris,
   RelancePro or, Contrôle sombre. Le thème habille l'écran ; la couleur
   (`accent`, et `surAccent` pour l'icône posée dessus) marque le logiciel dans
   la légende, sur le fond sombre de la scène.
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
  /** Le thème de son écran : la classe qui pose ses jetons (app/globals.css). */
  theme: string;
  /** Sa couleur dans la légende, en général `var(--produit-…)`, et celle de l'icône posée dessus. */
  accent: string;
  surAccent: string;
  icone: LucideIcon;
  animation: AnimationDemo;
  lien?: { href: string; libelle: string };
  Apercu: React.ComponentType;
};

export const DEMOS: readonly Demo[] = [
  {
    id: "carnet",
    ...PRODUITS.carnet,
    theme: "appli-grise",
    accent: "var(--produit-carnet)",
    surAccent: "var(--sur-produit-carnet)",
    icone: NotebookPen,
    animation: animerCarnet,
    Apercu: CarnetPreview,
  },
  {
    id: "relance",
    ...PRODUITS.relance,
    theme: "appli-or",
    accent: "var(--produit-relance)",
    surAccent: "var(--sur-produit-relance)",
    icone: ReceiptText,
    animation: animerRelance,
    Apercu: RelancePreview,
  },
  {
    id: "controle",
    ...PRODUITS.controle,
    theme: "appli-sombre",
    accent: "var(--produit-controle)",
    surAccent: "var(--sur-produit-controle)",
    icone: ClipboardCheck,
    animation: animerControle,
    Apercu: ControlePreview,
  },
];
