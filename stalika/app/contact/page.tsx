import type { Metadata } from "next";
import { Nav } from "@/components/sections/nav";
import { PiedDePage } from "@/components/sections/pied-de-page";
import { Conversation } from "@/components/conversation/conversation";

export const metadata: Metadata = {
  title: "Parlons de votre site",
  description: "Dix questions, cinq minutes. Je reviens vers vous sous 72 heures avec une première idée de site.",
  alternates: { canonical: "/contact" },
};

export default function PageContact() {
  return (
    <>
      <Nav />
      <main id="contenu" data-src="app/contact/page.tsx" className="pt-24 md:pt-28 min-h-svh">
        <Conversation />
      </main>
      <PiedDePage />
    </>
  );
}
