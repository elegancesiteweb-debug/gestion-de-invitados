"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Companion, Guest } from "@prisma/client";
import { formatTime } from "@/lib/dates";

type GuestWithCompanions = Guest & { companions: Companion[] };

export function CheckedInGuestList({ guests }: { guests: GuestWithCompanions[] }) {
  const [selected, setSelected] = useState<GuestWithCompanions | null>(null);

  return (
    <>
      <div className="space-y-2">
        {guests.map((guest) => (
          <button
            key={guest.id}
            type="button"
            onClick={() => setSelected(guest)}
            className="flex w-full items-center justify-between rounded-lg border border-gold/20 bg-white p-3 text-left transition hover:border-gold/40 hover:shadow-md"
          >
            <div>
              <p className="font-medium">{guest.name}</p>
              <p className="text-xs text-ink-muted">
                {guest.tableName || "Sin mesa"} · {guest.checkedInPasses ?? 1} pase
                {(guest.checkedInPasses ?? 1) !== 1 ? "s" : ""}
              </p>
            </div>
            <p className="text-sm font-medium text-success">
              {formatTime(guest.checkedInAt as Date)}
            </p>
          </button>
        ))}
      </div>

      {selected &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-gold/20 bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-serif text-xl font-medium text-ink">{selected.name}</p>
              {(selected.email || selected.phone) && (
                <p className="mt-1 text-sm text-ink-muted">
                  {selected.email || ""} {selected.phone ? `· ${selected.phone}` : ""}
                </p>
              )}

              <div className="mt-4 space-y-1 text-sm">
                <p>
                  <span className="font-medium">Mesa:</span> {selected.tableName || "Sin mesa"}
                </p>
                <p>
                  <span className="font-medium">Pases:</span> {selected.checkedInPasses ?? 1}
                </p>
                <p>
                  <span className="font-medium">Hora de entrada:</span>{" "}
                  {formatTime(selected.checkedInAt as Date)}
                </p>
              </div>

              {selected.companions.length > 0 && (
                <div className="mt-3 border-t border-gold/15 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    Acompañantes
                  </p>
                  <ul className="mt-1 text-sm">
                    {selected.companions.map((companion) => (
                      <li key={companion.id}>
                        {companion.attending ? "✓" : "✗"} {companion.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.dietaryNotes && (
                <p className="mt-3 text-sm text-ink-muted">
                  <span className="font-medium">Restricción alimentaria:</span>{" "}
                  {selected.dietaryNotes}
                </p>
              )}

              {selected.messageFromGuest && (
                <p className="mt-3 border-l-2 border-gold/30 pl-3 text-sm italic text-ink-muted">
                  {selected.messageFromGuest}
                </p>
              )}

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-5 w-full rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
              >
                Cerrar
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
