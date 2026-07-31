import Link from "next/link";
import type { Event, Guest, Table } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  createGuest,
  importGuestsCsv,
  sendAllPendingEmails,
} from "@/lib/actions/guests";
import { buildWhatsAppLink, buildRsvpMessage } from "@/lib/whatsapp";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { formatDate } from "@/lib/dates";
import { PRESET_GUEST_TAGS } from "@/lib/guestTags";
import { GuestsList } from "@/components/event-dashboard/GuestsList";

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

  const TAG_LABELS: Record<string, string> = {
    vip: t("tagVip"),
    withKids: t("tagWithKids"),
    family: t("tagFamily"),
    friends: t("tagFriends"),
    work: t("tagWork"),
  };

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
        <a
          href={`/api/events/${event.id}/export-csv`}
          className="text-sm text-gold-dark hover:underline"
        >
          {t("downloadCsv")}
        </a>
        <Link
          href={`/dashboard/events/${event.id}/print`}
          className="text-sm text-gold-dark hover:underline"
        >
          {t("exportPrint")}
        </Link>
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
          <div className="w-full">
            <label className="block text-xs font-medium mb-1">{t("tags")}</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_GUEST_TAGS.map((tag) => (
                <label key={tag} className="flex items-center gap-1 text-xs text-ink-muted">
                  <input type="checkbox" name="presetTags" value={tag} />
                  {TAG_LABELS[tag]}
                </label>
              ))}
            </div>
            <input
              name="customTags"
              placeholder={t("customTagsPlaceholder")}
              className="mt-1 w-full max-w-sm rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
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
        <GuestsList eventId={event.id} baseUrl={baseUrl} guestViews={guestViews} />
      </section>
    </div>
  );
}
