"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";

const STATUTS_VALIDES = ["a_traiter", "repondu", "archive"];

/** Une server action est une route HTTP publique : le rôle se revérifie à chaque appel. */
async function exigeAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") throw new Error("Non autorisé");
}

function idValide(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 40;
}

export async function changerStatut(id: string, statut: string) {
  await exigeAdmin();
  if (!idValide(id)) throw new Error("Identifiant invalide");
  if (!STATUTS_VALIDES.includes(statut)) throw new Error("Statut invalide");

  await db.demande.update({ where: { id }, data: { statut } });

  revalidatePath("/admin");
  revalidatePath("/admin/demandes/" + id);
  redirect("/admin/demandes/" + id + "?info=statut");
}

export async function supprimerDemande(id: string) {
  await exigeAdmin();
  if (!idValide(id)) throw new Error("Identifiant invalide");

  await db.demande.delete({ where: { id } });

  revalidatePath("/admin");
  redirect("/admin?info=supprimee");
}

export async function deconnexion() {
  await signOut({ redirectTo: "/" });
}
