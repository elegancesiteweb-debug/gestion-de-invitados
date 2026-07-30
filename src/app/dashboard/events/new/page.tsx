import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { createEvent } from "@/lib/actions/events";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const canCopyTemplate = hasFeature(session.user.accountType, "reusable_templates");
  const existingEvents = canCopyTemplate
    ? await prisma.event.findMany({
        where: { organizerId: session.user.id },
        orderBy: { eventDate: "desc" },
        select: { id: true, title: true },
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        ← Volver
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">Nuevo evento</h1>

      <form
        action={createEvent}
        className="mt-6 space-y-4 rounded-2xl border border-gold/20 bg-white/60 p-6 shadow-lg backdrop-blur-xl"
      >
        {canCopyTemplate && existingEvents.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Empezar a partir de (opcional)
            </label>
            <select
              name="copyFromEventId"
              defaultValue=""
              className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
            >
              <option value="">Empezar en blanco</option>
              {existingEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              Copia el mensaje de invitación, el checklist y las categorías de presupuesto de ese
              evento.
            </p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Título</label>
          <input
            name="title"
            required
            placeholder="Boda de Ana y Luis"
            className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha y hora</label>
          <input
            type="datetime-local"
            name="eventDate"
            required
            className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Lugar</label>
          <input
            name="location"
            placeholder="Salón Los Jardines"
            className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Notas para invitados (opcional)
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Código de vestimenta, estacionamiento, etc."
            className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          Crear evento
        </button>
      </form>
    </div>
  );
}
