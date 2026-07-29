import type { Event } from "@prisma/client";
import { updateEventSettings, toggleGeneralRsvp } from "@/lib/actions/events";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { TemplateEditor } from "@/components/event-dashboard/TemplateEditor";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { EmbedCodeButton } from "@/components/EmbedCodeButton";

export function SettingsPanel({ event, baseUrl }: { event: Event; baseUrl: string }) {
  const generalUrl = event.publicRsvpToken ? `${baseUrl}/g/${event.publicRsvpToken}` : null;

  return (
    <div className="space-y-6 py-6">
      <form
        action={updateEventSettings.bind(null, event.id)}
        className="space-y-4 rounded-lg border border-gold/20 bg-white p-4"
      >
        <div>
          <h2 className="font-serif text-lg font-medium text-ink">Mensaje de invitación</h2>
          <p className="text-xs text-ink-muted">
            Se usa al enviar por email y WhatsApp. Haz clic en una variable para insertarla en el
            cursor.
          </p>
        </div>

        <TemplateEditor initialTemplate={event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="showTableOnRsvp" defaultChecked={event.showTableOnRsvp} />
          Mostrar la mesa asignada en la página de confirmación del invitado
        </label>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Acompañantes máximos en el formulario general
          </label>
          <input
            type="number"
            name="generalMaxCompanions"
            min={0}
            defaultValue={event.generalMaxCompanions}
            className="w-24 rounded-lg border border-gold/25 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          Guardar
        </button>
      </form>

      <div className="rounded-lg border border-gold/20 bg-white p-4">
        <h2 className="font-serif text-lg font-medium text-ink">Formulario general</h2>
        <p className="mt-1 text-xs text-ink-muted">
          A diferencia del formulario por invitado, este no está ligado a nadie en particular:
          útil para invitaciones que no se personalizan por familia. Cada respuesta crea un
          invitado nuevo en tu lista, dentro del tope de acompañantes configurado arriba.
        </p>

        <div className="mt-3 flex items-center gap-3">
          {event.publicRsvpToken ? (
            <form action={toggleGeneralRsvp.bind(null, event.id)}>
              <input type="hidden" name="enable" value="false" />
              <button
                type="submit"
                className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-sm text-danger hover:bg-danger-bg/80"
              >
                Desactivar formulario general
              </button>
            </form>
          ) : (
            <form action={toggleGeneralRsvp.bind(null, event.id)}>
              <input type="hidden" name="enable" value="true" />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
              >
                Activar formulario general
              </button>
            </form>
          )}
        </div>

        {generalUrl && (
          <div className="mt-4 flex items-center gap-4 border-t border-gold/15 pt-4">
            <CopyLinkButton url={generalUrl} />
            <EmbedCodeButton url={generalUrl} title={`Confirmar asistencia - ${event.title}`} />
          </div>
        )}
      </div>
    </div>
  );
}
