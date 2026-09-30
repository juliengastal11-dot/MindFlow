import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { lienWhatsApp } from "@/lib/site";

export function Appel() {
  return (
    <Section
      fond="background"
      className="nuit"
      rythme="large"
      largeur="prose"
      src="components/sections/appel.tsx"
      eyebrow="On en parle ?"
      titre="Dix questions, cinq minutes, et je vous réponds avec une première idée."
    >
      <Reveal className="flex flex-wrap items-center gap-4">
        <Button asChild variant="accent" shape="pill" size="lg">
          <Link href="/contact">Répondre aux questions</Link>
        </Button>
        <Button asChild variant="outline" shape="pill" size="lg">
          <a href={lienWhatsApp()} target="_blank" rel="noopener">
            Ou directement sur WhatsApp
          </a>
        </Button>
      </Reveal>
    </Section>
  );
}
