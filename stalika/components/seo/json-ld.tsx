import { SITE } from "@/lib/site";

export function JsonLd() {
  const donnees = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.nom,
    description: SITE.description,
    url: SITE.url,
    areaServed: "FR",
    telephone: "+33645748608",
    priceRange: "À partir de 300 €",
    founder: { "@type": "Person", name: SITE.auteur },
    sameAs: [] as string[],
  };

  return (
    // HTML injecté : un JSON construit ici, depuis lib/site.ts, jamais depuis une saisie.
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees).replace(/</g, "\\u003c") }}
    />
  );
}
