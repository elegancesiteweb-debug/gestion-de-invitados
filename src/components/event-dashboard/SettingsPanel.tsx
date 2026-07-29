import type { Event } from "@prisma/client";
import { updateEventSettings } from "@/lib/actions/events";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { TemplateEditor } from "@/components/event-dashboard/TemplateEditor";

export function SettingsPanel({ event }: { event: Event }) {
  return (
    <div className="py-6">
      <form
        action={updateEventSettings.bind(null, event.id)}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div>
          <h2 className="text-lg font-medium">Mensaje de invitación</h2>
          <p className="text-xs text-gray-500">
            Se usa al enviar por email y WhatsApp. Haz clic en una variable para insertarla en el
            cursor.
          </p>
        </div>

        <TemplateEditor initialTemplate={event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="showTableOnRsvp" defaultChecked={event.showTableOnRsvp} />
          Mostrar la mesa asignada en la página de confirmación del invitado
        </label>

        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
