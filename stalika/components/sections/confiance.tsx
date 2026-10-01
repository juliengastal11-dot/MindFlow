import { Section } from "@/components/ui/section";
import { Defilant } from "@/components/ui/defilant";

/* Le Defilant ne fond pas les bords : le masque est posé ici. */
const FONDU =
  "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]";

function Element({ nom, sous }: { nom: React.ReactNode; sous: string }) {
  return (
    <span className="flex items-baseline gap-3 whitespace-nowrap">
      {nom}
      <span className="text-sm text-muted-foreground">{sous}</span>
    </span>
  );
}

const NOM = "font-display text-2xl md:text-3xl";

export function Confiance() {
  return (
    <Section fond="muted" rythme="serre" largeur="pleine" src="components/sections/confiance.tsx">
      <p className="eyebrow mb-8 text-center text-muted-foreground">Ils m&apos;ont fait confiance</p>
      <Defilant className={FONDU}>
        {/* [[À CONFIRMER PAR L'UTILISATEUR : adresse du site de la pizzeria]] */}
        <Element nom={<span className={NOM}>La Pizzeria des Allées</span>} sous="Béziers" />
        <span aria-hidden="true" className="text-muted-foreground">·</span>
        <Element
          nom={
            <a href="https://vtbon.fr" target="_blank" rel="noopener" className={`lien-fleche cursor-pointer ${NOM}`}>
              VTBON
            </a>
          }
          sous="l'application des chauffeurs VTC"
        />
        <span aria-hidden="true" className="text-muted-foreground">·</span>
        <Element
          nom={
            <a href="https://popec-run.vercel.app" target="_blank" rel="noopener" className={`lien-fleche cursor-pointer ${NOM}`}>
              Popec
            </a>
          }
          sous="coach sportif"
        />
        <span aria-hidden="true" className="text-muted-foreground">·</span>
      </Defilant>
    </Section>
  );
}
