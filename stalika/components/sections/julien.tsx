import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

export function Julien() {
  return (
    <Section
      fond="background"
      largeur="prose"
      src="components/sections/julien.tsx"
      eyebrow="Julien"
      titre="Je dessine et je code des sites, des logiciels et des applications pour des gens qui ont autre chose à faire"
    >
      <Reveal>
        <p className="border-l-4 border-accent pl-6 text-lg">
          Aujourd&apos;hui, je conçois des sites, des logiciels et des applications sur mesure pour
          des restaurants, des coachs, des artisans et des commerces, depuis Béziers et pour toute la
          France. Je m&apos;occupe de tout : le dessin, le code, les textes avec vous, la mise en
          ligne, et je reste joignable après. Vous relisez sur la page, vous corrigez, j&apos;applique.
          Un seul interlocuteur, du premier message à la mise en ligne.
        </p>
      </Reveal>
    </Section>
  );
}
