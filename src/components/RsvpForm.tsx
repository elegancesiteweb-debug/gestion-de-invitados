"use client";

import { useActionState, useState } from "react";
import { submitRsvp } from "@/lib/actions/rsvp";

type RsvpState = { error?: string; ok?: boolean } | null;

export function RsvpForm({
  token,
  maxCompanions,
  currentStatus,
  currentCompanions,
  currentMessage,
  currentDietaryNotes,
}: {
  token: string;
  maxCompanions: number;
  currentStatus: string;
  currentCompanions: number | null;
  currentMessage: string | null;
  currentDietaryNotes: string | null;
}) {
  const [status, setStatus] = useState(
    currentStatus === "DECLINED" ? "DECLINED" : "CONFIRMED"
  );
  const [state, formAction, pending] = useActionState<RsvpState, FormData>(
    async (_prev, formData) => submitRsvp(token, formData),
    null
  );

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <label
          className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition ${
            status === "CONFIRMED"
              ? "border-success/40 bg-success-bg text-success"
              : "border-gold/20 bg-white/60 text-ink-muted"
          }`}
        >
          <input
            type="radio"
            name="status"
            value="CONFIRMED"
            checked={status === "CONFIRMED"}
            onChange={() => setStatus("CONFIRMED")}
            className="sr-only"
          />
          Asistiré
        </label>
        <label
          className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition ${
            status === "DECLINED"
              ? "border-danger/40 bg-danger-bg text-danger"
              : "border-gold/20 bg-white/60 text-ink-muted"
          }`}
        >
          <input
            type="radio"
            name="status"
            value="DECLINED"
            checked={status === "DECLINED"}
            onChange={() => setStatus("DECLINED")}
            className="sr-only"
          />
          No podré asistir
        </label>
      </div>

      {status === "CONFIRMED" && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Acompañantes (máx. {maxCompanions})
          </label>
          <input
            type="number"
            name="companionsConfirmed"
            min={0}
            max={maxCompanions}
            defaultValue={currentCompanions ?? 0}
            disabled={maxCompanions === 0}
            className="w-24 rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:opacity-50"
          />
        </div>
      )}

      {status === "CONFIRMED" && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Restricciones alimentarias (opcional)
          </label>
          <input
            type="text"
            name="dietaryNotes"
            defaultValue={currentDietaryNotes ?? ""}
            placeholder="Ej. Vegetariano, alergia a maní"
            className="w-full rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          Mensaje (opcional)
        </label>
        <textarea
          name="messageFromGuest"
          defaultValue={currentMessage ?? ""}
          rows={2}
          className="w-full rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-success">¡Gracias! Tu respuesta fue registrada.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-gold/30 transition hover:shadow-lg hover:shadow-gold/40 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Confirmar"}
      </button>
    </form>
  );
}
