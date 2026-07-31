"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Companion, Guest, Table } from "@prisma/client";
import { SeatingCanvas } from "@/components/event-dashboard/SeatingCanvas";
import { SimpleTableList } from "@/components/event-dashboard/SimpleTableList";

type View = "plan" | "list";

export function TablesViewSwitcher({
  eventId,
  tables,
  guests,
}: {
  eventId: string;
  tables: Table[];
  guests: (Guest & { companions: Companion[] })[];
}) {
  const t = useTranslations("tables");
  const [view, setView] = useState<View>("plan");

  return (
    <div>
      <div className="flex gap-1 rounded-lg border border-gold/20 bg-white/60 p-1 shadow-sm backdrop-blur-xl w-fit">
        <button
          type="button"
          onClick={() => setView("plan")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === "plan" ? "bg-warm text-gold-dark" : "text-ink-muted hover:text-ink"
          }`}
        >
          {t("planView")}
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === "list" ? "bg-warm text-gold-dark" : "text-ink-muted hover:text-ink"
          }`}
        >
          {t("listView")}
        </button>
      </div>

      {view === "plan" ? (
        <SeatingCanvas eventId={eventId} initialTables={tables} initialGuests={guests} />
      ) : (
        <SimpleTableList eventId={eventId} tables={tables} guests={guests} />
      )}
    </div>
  );
}
