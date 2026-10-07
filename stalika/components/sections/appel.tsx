import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Decor } from "@/components/ui/decor";
import { lienWhatsApp } from "@/lib/site";

export function Appel() {
  return (
    <Section
      fond="background"
      className="relative isolate overflow-hidden"
      rythme="large"
      largeur="prose"
      src="components/sections/appel.tsx"
      eyebrow="On en parle ?"
      titre="Dix questions, cinq minutes, et je vous réponds avec une première idée"
    >
      {/* Le matin : la même falaise, deux heures après le lever du soleil. */}
      <Decor image="/decors/matin.webp" voile="bg-linear-to-b from-background/80 via-background/60 to-background/85" className="-z-10" />
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
