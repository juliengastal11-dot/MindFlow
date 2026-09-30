import type { Metadata } from "next";
import { Averia_Serif_Libre, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { DefilementFluide } from "@/components/ui/defilement-fluide";
import { BuildYourSiteOverlay } from "@/components/buildyoursite/overlay";

/* La police est servie par le site, via next/font : aucune requête vers un
   CDN de polices, donc aucune adresse IP de visiteur transmise à un tiers, et
   la page de confidentialité reste vraie. Plus Jakarta Sans est une police
   variable : toutes les graisses arrivent dans un seul fichier, et les titres
   ne font que monter en graisse. */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--police-sans",
});

/* Averia Serif Libre pour les titres : un serif au trait légèrement
   irrégulier, comme tracé à la main, qui répond à l'illustration peinte de
   l'ouverture. Trois graisses fixes, pas de variable disponible. */
const serif = Averia_Serif_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
  variable: "--police-serif",
});

/* Les métadonnées de base, héritées par toutes les pages. Chaque page pose
   les siennes, `title`, `description` et `alternates.canonical`, et le gabarit
   « %s · Nom du site » fait le reste. Le point médian plutôt qu'un tiret long :
   le tiret long est la signature du texte écrit par une machine, et il n'a pas
   sa place jusque dans l'onglet du navigateur. L'image de partage vient de
   app/opengraph-image.tsx, l'icône de app/icon.svg. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.nom, template: `%s · ${SITE.nom}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.nom,
    title: SITE.nom,
    description: SITE.description,
    locale: SITE.locale,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

/* Pose `html.js` avant le premier rendu. La feuille de style s'en sert pour
   masquer ce que le mouvement va dévoiler (`html.js [data-mouvement]`) : sans
   JavaScript, rien n'est masqué et tout est visible. `suppressHydrationWarning`
   parce que le serveur, lui, n'a pas cette classe. C'est voulu. */
const SCRIPT_JS = "document.documentElement.classList.add('js')";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* HTML injecté : la constante SCRIPT_JS ci-dessus, écrite ici, sans aucune entrée extérieure. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_JS }} />
      </head>
      <body>
        {/* Vitrine : le défilement fluide reste. Il se retire tout seul en mouvement réduit. */}
        <DefilementFluide />
        {children}
        {process.env.NODE_ENV === "development" && <BuildYourSiteOverlay />}
      </body>
    </html>
  );
}
