import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Best-effort: un fallo al registrar la bitácora nunca debe tumbar la acción principal.
// `actorNameOverride` es para contextos públicos sin sesión (ej. un pago o firma hechos
// por el cliente), donde no hay un `session.user` de quien tomar el nombre.
export async function logActivity(eventId: string, action: string, actorNameOverride?: string) {
  try {
    let actorName = actorNameOverride;
    if (!actorName) {
      const session = await auth();
      actorName = session?.user?.teamMemberName || session?.user?.name || "Alguien";
    }
    await prisma.activityLogEntry.create({ data: { eventId, actorName, action } });
  } catch {
    // ignorar errores de bitácora
  }
}
