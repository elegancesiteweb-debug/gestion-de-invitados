import Link from "next/link";
import { createEvent } from "@/lib/actions/events";

export default function NewEventPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Nuevo evento</h1>

      <form action={createEvent} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Título</label>
          <input
            name="title"
            required
            placeholder="Boda de Ana y Luis"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha y hora</label>
          <input
            type="datetime-local"
            name="eventDate"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Lugar</label>
          <input
            name="location"
            placeholder="Salón Los Jardines"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Crear evento
        </button>
      </form>
    </div>
  );
}
