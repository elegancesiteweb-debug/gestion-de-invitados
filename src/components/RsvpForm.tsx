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
}: {
  token: string;
  maxCompanions: number;
  currentStatus: string;
  currentCompanions: number | null;
  currentMessage: string | null;
}) {
  const [status, setStatus] = useState(
    currentStatus === "DECLINED" ? "DECLINED" : "CONFIRMED"
  );
  const [state, formAction, pending] = useActionState<RsvpState, FormData>(
    async (_prev, formData) => submitRsvp(token, formData),
    null
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="status"
            value="CONFIRMED"
            checked={status === "CONFIRMED"}
            onChange={() => setStatus("CONFIRMED")}
          />
          Asistiré
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="status"
            value="DECLINED"
            checked={status === "DECLINED"}
            onChange={() => setStatus("DECLINED")}
          />
          No podré asistir
        </label>
      </div>

      {status === "CONFIRMED" && maxCompanions > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Acompañantes (máx. {maxCompanions})
          </label>
          <input
            type="number"
            name="companionsConfirmed"
            min={0}
            max={maxCompanions}
            defaultValue={currentCompanions ?? 0}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Mensaje (opcional)</label>
        <textarea
          name="messageFromGuest"
          defaultValue={currentMessage ?? ""}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-green-600">¡Gracias! Tu respuesta fue registrada.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Confirmar"}
      </button>
    </form>
  );
}
