"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.teamRole === "COLLABORATOR") {
    throw new Error("Tu cuenta es de solo lectura. Pide a un administrador que haga este cambio.");
  }
}
