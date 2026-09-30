import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Nav } from "@/components/sections/nav";
import { PiedDePage } from "@/components/sections/pied-de-page";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function Introuvable() {
  return (
    <>
      <Nav />
      <main id="contenu" className="pt-24">
        <Section largeur="prose" rythme="serre" src="app/not-found.tsx" className="min-h-[60dvh]">
          <p className="eyebrow text-primary">Page introuvable</p>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl">
            Cette page n&apos;existe pas.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Elle a été déplacée, ou n&apos;a jamais existé. Reprenons depuis le début.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="default" shape="pill" size="lg">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
            <Button asChild variant="accent" shape="pill" size="lg">
              <Link href="/contact">Parlons de votre site</Link>
            </Button>
          </div>
        </Section>
      </main>
      <PiedDePage />
    </>
  );
}
