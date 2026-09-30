import type { Metadata } from "next";
import { lireReglages } from "@/lib/reglages";
import { Nav } from "@/components/sections/nav";
import { PiedDePage } from "@/components/sections/pied-de-page";
import { Section } from "@/components/ui/section";

/* ---------------------------------------------------------------------------
   Mentions légales, obligatoires pour tout site professionnel.

   Les valeurs inconnues portent un marqueur `[[À CONFIRMER PAR L'UTILISATEUR : … ]]`.
   Ne les remplace JAMAIS par une valeur plausible : un SIRET inventé se publie,
   un trou se voit. `verifier-projet.mjs` les signale tant qu'il en reste.
--------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Les informations légales du site Stalika.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false },
};

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl sm:text-2xl">{titre}</h2>
      <div className="mt-3 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export default async function MentionsLegales() {
  const reglages = await lireReglages();

  return (
    <>
    <Nav />
    <main id="contenu" className="pt-24">
    <Section largeur="prose" rythme="serre" src="app/mentions-legales/page.tsx">
      <p className="eyebrow text-primary">Informations légales</p>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl">Mentions légales</h1>

      <Bloc titre="Éditeur du site">
        <p>[[À CONFIRMER PAR L'UTILISATEUR : raison sociale]]</p>
        <p>[[À CONFIRMER PAR L'UTILISATEUR : forme juridique et capital social]]</p>
        <p>[[À CONFIRMER PAR L'UTILISATEUR : adresse du siège social]]</p>
        <p>[[À CONFIRMER PAR L'UTILISATEUR : numéro SIRET]]</p>
        <p>[[À CONFIRMER PAR L'UTILISATEUR : numéro de TVA intracommunautaire]]</p>
        <p>[[À CONFIRMER PAR L'UTILISATEUR : RCS et ville d&apos;immatriculation]]</p>
        {reglages.email ? (
          <p>
            Contact :{" "}
            <a href={`mailto:${reglages.email}`} className="text-primary underline underline-offset-4 hover:no-underline">
              {reglages.email}
            </a>
          </p>
        ) : (
          <p>[[À CONFIRMER PAR L'UTILISATEUR : adresse e-mail de contact]]</p>
        )}
        {reglages.telephone ? <p>Téléphone : {reglages.telephone}</p> : null}
      </Bloc>

      <Bloc titre="Directeur de la publication">
        <p>[[À CONFIRMER PAR L'UTILISATEUR : nom et qualité du directeur de la publication]]</p>
      </Bloc>

      <Bloc titre="Hébergeur">
        <p>[[À CONFIRMER PAR L'UTILISATEUR : nom de l&apos;hébergeur]]</p>
        <p>[[À CONFIRMER PAR L'UTILISATEUR : adresse de l&apos;hébergeur]]</p>
        <p>[[À CONFIRMER PAR L'UTILISATEUR : téléphone de l&apos;hébergeur]]</p>
      </Bloc>

      <Bloc titre="Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus de ce site (textes, images, logo, structure) est
          protégé par le droit d&apos;auteur. Toute reproduction, même partielle, est
          soumise à l&apos;autorisation préalable de l&apos;éditeur.
        </p>
      </Bloc>

      <Bloc titre="Données personnelles">
        <p>
          Le traitement des données collectées sur ce site est décrit dans notre{" "}
          <a href="/confidentialite" className="text-primary underline underline-offset-4 hover:no-underline">
            politique de confidentialité
          </a>
          .
        </p>
      </Bloc>
    </Section>
    </main>
    <PiedDePage />
    </>
  );
}
