import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/* ---------------------------------------------------------------------------
   Seed : le compte de Julien, et une demande d'exemple hors production.

   Le compte vient de l'environnement (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Sans
   ces variables, un compte de développement est créé, et il est annoncé à la
   remise. En production, l'absence de mot de passe arrête le seed : ce dépôt
   est public, un mot de passe par défaut serait un mot de passe connu de tous.
--------------------------------------------------------------------------- */

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@stalika.local";
  const motDePasse = process.env.ADMIN_PASSWORD || "stalika-dev";

  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD manquant dans .env : pas de compte par défaut en production.");
  }

  const passwordHash = await bcrypt.hash(motDePasse, 10);
  await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "admin" },
    create: { email, name: "Julien", passwordHash, role: "admin" },
  });

  if (process.env.NODE_ENV !== "production" && (await db.demande.count()) === 0) {
    await db.demande.create({
      data: {
        prenom: "Exemple",
        activite: "Restaurant",
        situation: "Aucun site",
        objectifs: "Être trouvé sur Google|Prendre des réservations",
        demandeClients: "Vous êtes ouverts le dimanche ?",
        actifs: "Le logo seulement",
        budget: "Entre 300 et 800 €",
        delai: "Dans le mois",
        contactMode: "whatsapp",
        contactValeur: "06 00 00 00 00",
        consentement: true,
        page: "/contact",
      },
    });
  }

  console.log(`Compte administrateur : ${email}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
