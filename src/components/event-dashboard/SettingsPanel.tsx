import type { Event } from "@prisma/client";
import { updateEventSettings, toggleGeneralRsvp } from "@/lib/actions/events";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { TemplateEditor } from "@/components/event-dashboard/TemplateEditor";
import { GeneralPassesInput } from "@/components/event-dashboard/GeneralPassesInput";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { EmbedCodeButton } from "@/components/EmbedCodeButton";

export function SettingsPanel({ event, baseUrl }: { event: Event; baseUrl: string }) {
  const generalUrl = event.publicRsvpToken ? `${baseUrl}/g/${event.publicRsvpToken}` : null;

  return (
    <div className="space-y-6 py-6">
      <form
        action={updateEventSettings.bind(null, event.id)}
        className="space-y-4 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
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

        <GeneralPassesInput initialValue={event.generalMaxCompanions} />

        <div className="border-t border-gold/15 pt-4">
          <h3 className="font-serif text-base font-medium text-ink">Recordatorios automáticos</h3>
          <p className="text-xs text-ink-muted">
            Envía un recordatorio por email a quienes aún no respondieron. Déjalo vacío para
            desactivarlo.
          </p>
          <label className="mt-2 flex items-center gap-2 text-sm">
            Recordar a los
            <input
              type="number"
              name="reminderDaysAfter"
              min={1}
              defaultValue={event.reminderDaysAfter ?? ""}
              className="w-16 rounded-lg border border-gold/25 bg-white/70 px-2 py-1 text-sm"
            />
            día(s) de enviada la invitación
          </label>
        </div>

        <div className="border-t border-gold/15 pt-4">
          <h3 className="font-serif text-base font-medium text-ink">Página del evento</h3>
          <p className="text-xs text-ink-muted">
            Se muestran en la página pública del evento (código de vestimenta, link al mapa).
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Código de vestimenta</label>
              <input
                name="dressCode"
                defaultValue={event.dressCode ?? ""}
                placeholder="Ej. Formal"
                className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium">Link del mapa (opcional)</label>
              <input
                name="mapUrl"
                type="url"
                defaultValue={event.mapUrl ?? ""}
                placeholder="https://maps.google.com/..."
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          Guardar
        </button>
      </form>

      <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">Página pública del evento</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Página informativa para compartir ampliamente (fecha, ubicación, código de vestimenta).
        </p>
        <div className="mt-3 flex items-center gap-4">
          <CopyLinkButton url={`${baseUrl}/e/${event.slug}`} />
        </div>
      </div>

      <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
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
