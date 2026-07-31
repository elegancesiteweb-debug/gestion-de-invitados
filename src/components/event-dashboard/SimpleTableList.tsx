"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Companion, Guest, Table } from "@prisma/client";
import { createTable, assignGuestToTable } from "@/lib/actions/tables";
import { calcGuestOccupancy, calcTableOccupancy } from "@/lib/tables";

type GuestWithCompanions = Guest & { companions: Companion[] };

function guestLabel(guest: Guest): string {
  const extra = calcGuestOccupancy(guest) - 1;
  return extra > 0 ? `${guest.name} (+${extra})` : guest.name;
}

export function SimpleTableList({
  eventId,
  tables,
  guests,
}: {
  eventId: string;
  tables: Table[];
  guests: GuestWithCompanions[];
}) {
  const t = useTranslations("seatingCanvas");
  const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const unassigned = guests.filter((g) => g.tableId == null);

  async function reassign(guestId: string, tableId: string | null) {
    setPendingGuestId(guestId);
    try {
      await assignGuestToTable(guestId, tableId);
    } finally {
      setPendingGuestId(null);
    }
  }

  function toggleExpanded(tableId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  }

  return (
    <div className="space-y-4 py-6">
      <details className="rounded-lg border border-gold/20 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-xl">
        <summary className="cursor-pointer text-sm font-medium">{t("addTable")}</summary>
        <form action={createTable.bind(null, eventId)} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">{t("name")}</label>
            <input name="name" required placeholder={t("namePlaceholder")} className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("shape")}</label>
            <select name="shape" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm">
              <option value="ROUND">{t("round")}</option>
              <option value="RECT">{t("rect")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("seats")}</label>
            <input
              name="seats"
              type="number"
              min={1}
              defaultValue={8}
              className="w-20 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("add")}
          </button>
        </form>
      </details>

      {tables.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("noTables")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tables.map((table) => {
            const occupancy = calcTableOccupancy(table.id, guests);
            const overCapacity = occupancy > table.seats;
            const seated = guests.filter((g) => g.tableId === table.id);
            const expanded = expandedIds.has(table.id);
            return (
              <div
                key={table.id}
                className="rounded-lg border border-gold/20 bg-white/60 shadow-sm backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(table.id)}
                  className="flex w-full items-center justify-between gap-2 p-4 text-left"
                >
                  <span className="flex items-center gap-1.5 font-medium text-ink">
                    <span className={`text-xs transition-transform ${expanded ? "rotate-90" : ""}`}>▸</span>
                    {table.name}
                  </span>
                  <span className={`text-xs ${overCapacity ? "text-danger" : "text-ink-muted"}`}>
                    {occupancy}/{table.seats}
                  </span>
                </button>
                {expanded && (
                  <div className="px-4 pb-4">
                    {seated.length === 0 ? (
                      <p className="text-xs text-ink-muted">{t("noGuestsAtTable")}</p>
                    ) : (
                      <ul className="space-y-1 border-t border-gold/15 pt-2">
                        {seated.map((guest) => (
                          <li key={guest.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-ink">{guestLabel(guest)}</span>
                            <button
                              type="button"
                              disabled={pendingGuestId === guest.id}
                              onClick={() => reassign(guest.id, null)}
                              className="text-xs text-danger hover:underline disabled:opacity-50"
                            >
                              {t("removeFromTableShort")}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl">
        <h3 className="mb-2 font-serif text-base font-medium text-ink">
          {t("unassignedTitle", { count: unassigned.length })}
        </h3>
        {unassigned.length === 0 ? (
          <p className="text-xs text-ink-muted">{t("allAssigned")}</p>
        ) : (
          <ul className="space-y-2">
            {unassigned.map((guest) => (
              <li key={guest.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-ink">{guestLabel(guest)}</span>
                <select
                  disabled={pendingGuestId === guest.id}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) reassign(guest.id, e.target.value);
                    e.target.value = "";
                  }}
                  className="rounded-lg border border-gold/25 px-2 py-1 text-xs disabled:opacity-50"
                >
                  <option value="" disabled>
                    {t("assignToTable")}
                  </option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
