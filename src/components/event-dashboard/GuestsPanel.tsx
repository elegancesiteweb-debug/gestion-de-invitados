import type { Event, Guest, Table } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  createGuest,
  updateGuest,
  deleteGuest,
  importGuestsCsv,
  sendAllPendingEmails,
  sendGuestEmail,
} from "@/lib/actions/guests";
import { buildWhatsAppLink, buildRsvpMessage } from "@/lib/whatsapp";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { formatDate } from "@/lib/dates";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { GuestQrButton } from "@/components/GuestQrButton";
import { EmbedCodeButton } from "@/components/EmbedCodeButton";

function GuestEditForm({
  eventId,
  guest,
  t,
}: {
  eventId: string;
  guest: Guest;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm text-gold-dark hover:underline">{t("edit")}</summary>
      <form
        action={updateGuest.bind(null, eventId, guest.id)}
        className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-gold/20 bg-white p-3"
      >
        <div>
          <label className="block text-xs font-medium mb-1">{t("name")}</label>
          <input
            name="name"
            required
            defaultValue={guest.name}
            className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">{t("email")}</label>
          <input
            name="email"
            type="email"
            defaultValue={guest.email ?? ""}
            className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">{t("phone")}</label>
          <input
            name="phone"
            defaultValue={guest.phone ?? ""}
            className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">{t("table")}</label>
          <input
            name="tableName"
            list="table-names"
            defaultValue={guest.tableName ?? ""}
            className="w-28 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">{t("companions")}</label>
          <input
            name="maxCompanions"
            type="number"
            min={0}
            defaultValue={guest.maxCompanions}
            className="w-20 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">{t("invitationLink")}</label>
          <input
            name="invitationLinkUrl"
            type="url"
            defaultValue={guest.invitationLinkUrl ?? ""}
            className="w-48 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm font-medium text-white hover:shadow-lg"
        >
          {t("save")}
        </button>
      </form>
    </details>
  );
}

export async function GuestsPanel({
  event,
  guests,
  tables,
  baseUrl,
}: {
  event: Event;
  guests: Guest[];
  tables: Table[];
  baseUrl: string;
}) {
  const t = await getTranslations("guests");
  const tableNames = tables.map((t) => t.name);
  const template = event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE;

  const guestViews = guests.map((guest) => {
    const confirmUrl = `${baseUrl}/c/${guest.token}`;
    const whatsappLink = guest.phone
      ? buildWhatsAppLink(
          guest.phone,
          buildRsvpMessage({
            template,
            guestName: guest.name,
            eventTitle: event.title,
            eventDate: formatDate(event.eventDate),
            location: event.location,
            tableName: guest.tableName,
            maxCompanions: guest.maxCompanions,
            confirmUrl,
            invitationUrl: guest.invitationLinkUrl ?? event.invitationLinkUrl,
          })
        )
      : null;
    return { guest, confirmUrl, whatsappLink };
  });

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <form action={sendAllPendingEmails.bind(null, event.id)}>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("sendToPending")}
          </button>
        </form>
        <details className="rounded-lg border border-gold/20 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-xl">
          <summary className="cursor-pointer text-sm font-medium">{t("importCsv")}</summary>
          <form action={importGuestsCsv.bind(null, event.id)} className="mt-3 space-y-2">
            <p className="text-xs text-ink-muted">{t("csvColumns")}</p>
            <input type="file" name="file" accept=".csv" required className="text-sm" />
            <button
              type="submit"
              className="block rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
            >
              {t("import")}
            </button>
          </form>
        </details>
      </div>

      <datalist id="table-names">
        {tableNames.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("addGuest")}</h2>
        <form
          action={createGuest.bind(null, event.id)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("name")}</label>
            <input name="name" required className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("email")}</label>
            <input name="email" type="email" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("phone")}</label>
            <input
              name="phone"
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              placeholder="+50212345678"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("table")}</label>
            <input
              name="tableName"
              list="table-names"
              placeholder={t("tablePlaceholder")}
              className="w-28 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("companions")}</label>
            <input
              name="maxCompanions"
              type="number"
              min={0}
              defaultValue={0}
              className="w-20 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("invitationLinkOptional")}</label>
            <input
              name="invitationLinkUrl"
              type="url"
              placeholder="https://..."
              className="w-48 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("add")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("guestsTitle", { count: guests.length })}
        </h2>

        <div className="hidden overflow-x-auto rounded-lg border border-gold/20 bg-white/60 shadow-md backdrop-blur-xl md:block">
          <table className="w-full text-sm">
            <thead className="bg-warm text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-2">{t("name")}</th>
                <th className="px-4 py-2">{t("table")}</th>
                <th className="px-4 py-2">{t("status")}</th>
                <th className="px-4 py-2">{t("companions")}</th>
                <th className="px-4 py-2">{t("confirmation")}</th>
                <th className="px-4 py-2">{t("send")}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {guestViews.map(({ guest, confirmUrl, whatsappLink }) => (
                <tr key={guest.id} className="border-t border-gold/15 align-top">
                  <td className="px-4 py-2">
                    <p className="font-medium">{guest.name}</p>
                    <p className="text-xs text-ink-muted">
                      {guest.email || ""} {guest.phone ? `· ${guest.phone}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{guest.tableName || "—"}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={guest.status} />
                  </td>
                  <td className="px-4 py-2">
                    {guest.status === "CONFIRMED"
                      ? `${guest.companionsConfirmed ?? 0}/${guest.maxCompanions}`
                      : t("maxCompanions", { count: guest.maxCompanions })}
                  </td>
                  <td className="px-4 py-2 space-x-3 whitespace-nowrap">
                    <CopyLinkButton url={confirmUrl} />
                    <GuestQrButton
                      guestName={guest.name}
                      rsvpUrl={confirmUrl}
                      checkinUrl={`${baseUrl}/checkin/${guest.checkinToken}`}
                    />
                    <EmbedCodeButton
                      url={confirmUrl}
                      title={`${t("embedTitlePrefix")} - ${guest.name}`}
                    />
                  </td>
                  <td className="px-4 py-2 space-x-3 whitespace-nowrap">
                    {guest.email && (
                      <form action={sendGuestEmail.bind(null, event.id, guest.id)} className="inline">
                        <button type="submit" className="text-sm text-gold-dark hover:underline">
                          Email
                        </button>
                      </form>
                    )}
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-success hover:underline"
                      >
                        WhatsApp
                      </a>
                    )}
                    {guest.invitationSentAt && (
                      <span className="block text-xs text-ink-light">{t("sent")}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <form action={deleteGuest.bind(null, event.id, guest.id)}>
                      <button type="submit" className="text-sm text-danger hover:underline">
                        {t("delete")}
                      </button>
                    </form>
                    <GuestEditForm eventId={event.id} guest={guest} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {guestViews.map(({ guest, confirmUrl, whatsappLink }) => (
            <div
              key={guest.id}
              className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{guest.name}</p>
                  <p className="text-xs text-ink-muted">
                    {guest.email || ""} {guest.phone ? `· ${guest.phone}` : ""}
                  </p>
                </div>
                <StatusBadge status={guest.status} />
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span>
                  {t("table")}: {guest.tableName || "—"}
                </span>
                <span>
                  {guest.status === "CONFIRMED"
                    ? t("companionsOf", { count: guest.companionsConfirmed ?? 0, max: guest.maxCompanions })
                    : t("maxCompanionsLabel", { count: guest.maxCompanions })}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <CopyLinkButton url={confirmUrl} />
                <GuestQrButton
                  guestName={guest.name}
                  rsvpUrl={confirmUrl}
                  checkinUrl={`${baseUrl}/checkin/${guest.checkinToken}`}
                />
                <EmbedCodeButton url={confirmUrl} title={`${t("embedTitlePrefix")} - ${guest.name}`} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {guest.email && (
                  <form action={sendGuestEmail.bind(null, event.id, guest.id)}>
                    <button type="submit" className="text-sm text-gold-dark hover:underline">
                      Email
                    </button>
                  </form>
                )}
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-success hover:underline"
                  >
                    WhatsApp
                  </a>
                )}
                {guest.invitationSentAt && <span className="text-xs text-ink-light">{t("sent")}</span>}
                <form action={deleteGuest.bind(null, event.id, guest.id)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    {t("delete")}
                  </button>
                </form>
              </div>

              <GuestEditForm eventId={event.id} guest={guest} t={t} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
