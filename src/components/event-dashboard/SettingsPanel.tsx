import type { AccountType, Event } from "@prisma/client";
import {
  updateEventSettings,
  toggleGeneralRsvp,
  toggleClientPortal,
  uploadEventLogo,
  removeEventLogo,
} from "@/lib/actions/events";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { TemplateEditor } from "@/components/event-dashboard/TemplateEditor";
import { GeneralPassesInput } from "@/components/event-dashboard/GeneralPassesInput";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { EmbedCodeButton } from "@/components/EmbedCodeButton";
import { hasFeature } from "@/lib/features";

export function SettingsPanel({
  event,
  baseUrl,
  accountType,
}: {
  event: Event;
  baseUrl: string;
  accountType: AccountType;
}) {
  const generalUrl = event.publicRsvpToken ? `${baseUrl}/g/${event.publicRsvpToken}` : null;
  const portalUrl = event.clientPortalToken ? `${baseUrl}/portal/${event.clientPortalToken}` : null;

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

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="showTableOnRsvp" defaultChecked={event.showTableOnRsvp} />
            Mostrar la mesa asignada en la página de confirmación del invitado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="askDietaryOnRsvp" defaultChecked={event.askDietaryOnRsvp} />
            Pedir restricciones alimentarias en el formulario de confirmación
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="askMessageOnRsvp" defaultChecked={event.askMessageOnRsvp} />
            Permitir que el invitado deje un mensaje
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="askCompanionNamesOnRsvp"
              defaultChecked={event.askCompanionNamesOnRsvp}
            />
            Pedir el nombre de cada acompañante y que confirmen quién asiste
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showQrOnConfirmation"
              defaultChecked={event.showQrOnConfirmation}
            />
            Mostrar el QR de acceso al confirmar asistencia (para que el invitado lo guarde)
          </label>
        </div>

        <GeneralPassesInput initialValue={event.generalMaxCompanions} />

        <div className="border-t border-gold/15 pt-4">
          <h3 className="font-serif text-base font-medium text-ink">Link de invitación</h3>
          <p className="text-xs text-ink-muted">
            Link a la invitación diseñada aparte (Canva, PDF, imagen). Se usa en el mensaje con la
            variable {"{invitacion}"} y se muestra como botón en la página de confirmación. Cada
            invitado puede tener su propio link (al agregarlo); si no, se usa este general.
          </p>
          <input
            name="invitationLinkUrl"
            type="url"
            defaultValue={event.invitationLinkUrl ?? ""}
            placeholder="https://www.canva.com/design/..."
            className="mt-2 w-full rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t border-gold/15 pt-4">
          <h3 className="font-serif text-base font-medium text-ink">Recordatorios</h3>
          <p className="text-xs text-ink-muted">
            Define a partir de cuántos días sin responder un invitado queda listo para
            recordatorio. El envío se dispara manualmente con el botón en la pestaña Envíos.
            Déjalo vacío para desactivarlo.
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

        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          Guardar
        </button>
      </form>

      <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">Foto / logo del evento</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Foto de los novios o logo de la boda / wedding planner. Se muestra en las páginas de
          confirmación de los invitados. Máximo 2MB.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {event.logoImageType && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/events/${event.id}/logo`}
                alt="Foto/logo del evento"
                className="h-20 w-20 rounded-lg object-cover"
              />
              <form action={removeEventLogo.bind(null, event.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-sm text-danger hover:bg-danger-bg/80"
                >
                  Quitar
                </button>
              </form>
            </>
          )}
          <form action={uploadEventLogo.bind(null, event.id)} className="flex items-center gap-2">
            <input type="file" name="logo" accept="image/*" required className="text-sm" />
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Subir
            </button>
          </form>
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

      {hasFeature(accountType, "client_portal") && (
        <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
          <h2 className="font-serif text-lg font-medium text-ink">Portal de cliente</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Link de solo lectura para compartir con la pareja/cliente: ve estadísticas de
            confirmaciones, la lista de invitados, tareas y la agenda del día, sin poder editar
            nada.
          </p>

          <div className="mt-3 flex items-center gap-3">
            {event.clientPortalToken ? (
              <form action={toggleClientPortal.bind(null, event.id)}>
                <input type="hidden" name="enable" value="false" />
                <button
                  type="submit"
                  className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-sm text-danger hover:bg-danger-bg/80"
                >
                  Desactivar portal de cliente
                </button>
              </form>
            ) : (
              <form action={toggleClientPortal.bind(null, event.id)}>
                <input type="hidden" name="enable" value="true" />
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
                >
                  Activar portal de cliente
                </button>
              </form>
            )}
          </div>

          {portalUrl && (
            <div className="mt-4 flex items-center gap-4 border-t border-gold/15 pt-4">
              <CopyLinkButton url={portalUrl} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
