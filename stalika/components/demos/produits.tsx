import { ClipboardCheck, NotebookPen, ReceiptText } from "lucide-react";
import { PRODUITS } from "@/lib/demos";
import type { SaaSPreviewCardProps } from "./saas-preview-card";
import { CarnetPreview } from "./carnet-preview";
import { RelancePreview } from "./relance-preview";
import { ControlePreview } from "./controle-preview";
import { animerCarnet } from "./carnet-animation";
import { animerRelance } from "./relance-animation";
import { animerControle } from "./controle-animation";

/* ---------------------------------------------------------------------------
   Les démos du carrousel de la section 02, dans l'ordre : pour chacune, la
   carte (textes de `lib/demos.ts`, couleur, icône, film) et son interface.
--------------------------------------------------------------------------- */

export type Demo = {
  id: string;
  carte: Omit<SaaSPreviewCardProps, "children" | "className">;
  Apercu: React.ComponentType;
};

export const DEMOS: readonly Demo[] = [
  {
    id: "carnet",
    carte: { ...PRODUITS.carnet, accent: "var(--produit-carnet)", icone: NotebookPen, animation: animerCarnet },
    Apercu: CarnetPreview,
  },
  {
    id: "relance",
    carte: { ...PRODUITS.relance, accent: "var(--produit-relance)", icone: ReceiptText, animation: animerRelance },
    Apercu: RelancePreview,
  },
  {
    id: "controle",
    carte: { ...PRODUITS.controle, accent: "var(--produit-controle)", icone: ClipboardCheck, animation: animerControle },
    Apercu: ControlePreview,
  },
];
