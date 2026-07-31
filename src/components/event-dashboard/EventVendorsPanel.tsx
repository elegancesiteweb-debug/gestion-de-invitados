import Link from "next/link";
import type { EventVendor, Vendor } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  assignVendorToEvent,
  unassignVendorFromEvent,
  createVendorForEvent,
} from "@/lib/actions/vendors";

type EventVendorWithVendor = EventVendor & { vendor: Vendor };

export async function EventVendorsPanel({
  eventId,
  eventVendors,
  availableVendors,
}: {
  eventId: string;
  eventVendors: EventVendorWithVendor[];
  availableVendors: Vendor[];
}) {
  const t = await getTranslations("eventVendors");
  const assignedIds = new Set(eventVendors.map((ev) => ev.vendorId));
  const unassigned = availableVendors.filter((v) => !assignedIds.has(v.id));

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("assignedTitle")}</h2>
        {eventVendors.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noneAssigned")}</p>
        ) : (
          <div className="space-y-2">
            {eventVendors.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="font-medium text-ink">
                    {ev.vendor.name}
                    {ev.vendor.category && (
                      <span className="ml-2 rounded-full bg-warm px-2 py-0.5 text-xs text-ink-muted">
                        {ev.vendor.category}
                      </span>
                    )}
                    {ev.clientApproved === true && (
                      <span className="ml-2 rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                        {t("approvedByClient")}
                      </span>
                    )}
                    {ev.clientApproved === false && (
                      <span className="ml-2 rounded-full bg-danger-bg px-2 py-0.5 text-xs text-danger">
                        {t("rejectedByClient")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {ev.vendor.phone || ""} {ev.vendor.email ? `· ${ev.vendor.email}` : ""}
                  </p>
                </div>
                <form action={unassignVendorFromEvent.bind(null, eventId, ev.vendorId)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    {t("remove")}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {unassigned.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("addFromDirectory")}</h2>
          <form
            action={assignVendorToEvent.bind(null, eventId)}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">{t("vendor")}</label>
              <select
                name="vendorId"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              >
                {unassigned.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.category ? ` (${v.category})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              {t("add")}
            </button>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("newVendor")}</h2>
        <form
          action={createVendorForEvent.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("name")}</label>
            <input name="name" required className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("category")}</label>
            <input
              name="category"
              placeholder={t("categoryPlaceholder")}
              className="w-36 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("phone")}</label>
            <input name="phone" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("email")}</label>
            <input name="email" type="email" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{t("notes")}</label>
            <input name="notes" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("createAndAdd")}
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-muted">
          {t("alsoSavedPrefix")}{" "}
          <Link href="/dashboard/vendors" className="text-gold-dark hover:underline">
            {t("generalDirectory")}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
