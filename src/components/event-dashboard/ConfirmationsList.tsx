"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Companion, Guest } from "@prisma/client";
import { StatusBadge } from "@/components/StatusBadge";
import { deleteGuest } from "@/lib/actions/guests";
import { formatInAppTimezone } from "@/lib/dates";

type GuestWithCompanions = Guest & { companions: Companion[] };

const TAG_LABEL_KEYS: Record<string, string> = {
  vip: "tagVip",
  withKids: "tagWithKids",
  family: "tagFamily",
  friends: "tagFriends",
  work: "tagWork",
};

export function ConfirmationsList({
  eventId,
  responded,
}: {
  eventId: string;
  responded: GuestWithCompanions[];
}) {
  const t = useTranslations("confirmations");
  const tGuests = useTranslations("guests");
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  function tagLabel(tag: string) {
    const key = TAG_LABEL_KEYS[tag];
    return key ? tGuests(key) : tag;
  }

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const guest of responded) {
      for (const tag of guest.tags) set.add(tag);
    }
    return [...set].sort((a, b) => tagLabel(a).localeCompare(tagLabel(b)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responded]);

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return responded.filter((guest) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responded, query, activeTags]);

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
            <span className="text-xs text-ink-muted">{tGuests("filterByTag")}:</span>
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
                {tGuests("clearFilter")}
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("noSearchResults")}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((guest) => (
            <div key={guest.id} className="rounded-lg border border-gold/20 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {guest.name}
                    {guest.tags.length > 0 && (
                      <span className="ml-1 inline-flex flex-wrap gap-1">
                        {guest.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-dark"
                          >
                            {tagLabel(tag)}
                          </span>
                        ))}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {guest.status === "CONFIRMED"
                      ? t("attending", { count: 1 + (guest.companionsConfirmed ?? 0) })
                      : t("notAttending")}
                    {guest.respondedAt &&
                      ` · ${formatInAppTimezone(guest.respondedAt, {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={guest.status} />
                  <form action={deleteGuest.bind(null, eventId, guest.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      {t("delete")}
                    </button>
                  </form>
                </div>
              </div>
              {guest.messageFromGuest && (
                <p className="mt-2 border-l-2 border-gold/30 pl-3 text-sm italic text-ink-muted">
                  {guest.messageFromGuest}
                </p>
              )}
              {guest.dietaryNotes && (
                <p className="mt-2 text-xs text-ink-muted">
                  <span className="font-medium">{t("dietaryNotes")}:</span> {guest.dietaryNotes}
                </p>
              )}
              {guest.companions.length > 0 && (
                <ul className="mt-2 text-xs text-ink-muted">
                  {guest.companions.map((companion) => (
                    <li key={companion.id}>
                      {companion.attending ? "✓" : "✗"} {companion.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
