"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Guest } from "@prisma/client";
import { deleteGuest, sendGuestEmail, updateGuest } from "@/lib/actions/guests";
import { PRESET_GUEST_TAGS } from "@/lib/guestTags";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { GuestQrButton } from "@/components/GuestQrButton";
import { EmbedCodeButton } from "@/components/EmbedCodeButton";

type GuestView = { guest: Guest; confirmUrl: string; whatsappLink: string | null };

function useTagLabels() {
  const t = useTranslations("guests");
  const labels: Record<string, string> = {
    vip: t("tagVip"),
    withKids: t("tagWithKids"),
    family: t("tagFamily"),
    friends: t("tagFriends"),
    work: t("tagWork"),
  };
  return (tag: string) => labels[tag] ?? tag;
}

function TagBadges({ tags }: { tags: string[] }) {
  const tagLabel = useTagLabels();
  if (tags.length === 0) return null;
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-dark"
        >
          {tagLabel(tag)}
        </span>
      ))}
    </span>
  );
}

function GuestEditForm({ eventId, guest }: { eventId: string; guest: Guest }) {
  const t = useTranslations("guests");
  const tagLabel = useTagLabels();
  const customTags = guest.tags.filter((tag) => !PRESET_GUEST_TAGS.includes(tag as never));

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
        <div className="w-full">
          <label className="block text-xs font-medium mb-1">{t("tags")}</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_GUEST_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-1 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  name="presetTags"
                  value={tag}
                  defaultChecked={guest.tags.includes(tag)}
                />
                {tagLabel(tag)}
              </label>
            ))}
          </div>
          <input
            name="customTags"
            defaultValue={customTags.join(", ")}
            placeholder={t("customTagsPlaceholder")}
            className="mt-1 w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
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

export function GuestsList({
  eventId,
  baseUrl,
  guestViews,
}: {
  eventId: string;
  baseUrl: string;
  guestViews: GuestView[];
}) {
  const t = useTranslations("guests");
  const tagLabel = useTagLabels();
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const { guest } of guestViews) {
      for (const tag of guest.tags) set.add(tag);
    }
    return [...set].sort((a, b) => tagLabel(a).localeCompare(tagLabel(b)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestViews]);

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guestViews.filter(({ guest }) => {
      if (activeTags.length > 0 && !activeTags.some((tag) => guest.tags.includes(tag))) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        guest.name,
        guest.email ?? "",
        guest.tableName ?? "",
        ...guest.tags.map((tag) => tagLabel(tag)),
        ...guest.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [guestViews, query, activeTags, tagLabel]);

  return (
    <div>
      <div className="mb-3 space-y-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full max-w-sm rounded-lg border border-gold/25 px-3 py-1.5 text-sm"
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-ink-muted">{t("filterByTag")}:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  activeTags.includes(tag)
                    ? "bg-gold-dark text-white"
                    : "bg-gold/10 text-gold-dark hover:bg-gold/20"
                }`}
              >
                {tagLabel(tag)}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTags([])}
                className="text-xs text-ink-muted hover:underline"
              >
                {t("clearFilter")}
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("noSearchResults")}</p>
      ) : (
        <>
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
                {filtered.map(({ guest, confirmUrl, whatsappLink }) => (
                  <tr key={guest.id} className="border-t border-gold/15 align-top">
                    <td className="px-4 py-2">
                      <p className="font-medium">
                        {guest.name}
                        <TagBadges tags={guest.tags} />
                      </p>
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
                        <form action={sendGuestEmail.bind(null, eventId, guest.id)} className="inline">
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
                      <form action={deleteGuest.bind(null, eventId, guest.id)}>
                        <button type="submit" className="text-sm text-danger hover:underline">
                          {t("delete")}
                        </button>
                      </form>
                      <GuestEditForm eventId={eventId} guest={guest} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map(({ guest, confirmUrl, whatsappLink }) => (
              <div
                key={guest.id}
                className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {guest.name}
                      <TagBadges tags={guest.tags} />
                    </p>
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
                    <form action={sendGuestEmail.bind(null, eventId, guest.id)}>
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
                  <form action={deleteGuest.bind(null, eventId, guest.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      {t("delete")}
                    </button>
                  </form>
                </div>

                <GuestEditForm eventId={eventId} guest={guest} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
