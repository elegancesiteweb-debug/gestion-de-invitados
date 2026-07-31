"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { submitGeneralRsvp } from "@/lib/actions/rsvp";
import { RsvpQrReveal } from "@/components/RsvpQrReveal";

type RsvpState = { error?: string; ok?: boolean; checkinUrl?: string } | null;

export function GeneralRsvpForm({
  publicRsvpToken,
  maxCompanions,
  askDietary,
  askMessage,
  askCompanionNames,
  showQr,
}: {
  publicRsvpToken: string;
  maxCompanions: number | null;
  askDietary: boolean;
  askMessage: boolean;
  askCompanionNames: boolean;
  showQr: boolean;
}) {
  const t = useTranslations("rsvpForm");
  const [status, setStatus] = useState<"CONFIRMED" | "DECLINED">("CONFIRMED");
  const [companionRowCount, setCompanionRowCount] = useState(0);

  function addCompanionRow() {
    if (maxCompanions !== null && companionRowCount >= maxCompanions) return;
    setCompanionRowCount((prev) => prev + 1);
  }

  function removeCompanionRow() {
    setCompanionRowCount((prev) => Math.max(0, prev - 1));
  }
  const [state, formAction, pending] = useActionState<RsvpState, FormData>(
    async (_prev, formData) => submitGeneralRsvp(publicRsvpToken, formData),
    null
  );

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          {t("fullName")}
        </label>
        <input
          type="text"
          name="name"
          required
          className="w-full rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </div>

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
          {t("willAttend")}
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
          {t("wontAttend")}
        </label>
      </div>

      {status === "CONFIRMED" && maxCompanions !== 0 && !askCompanionNames && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("companions")} {maxCompanions !== null ? t("maxSuffix", { max: maxCompanions }) : ""}
          </label>
          <input
            type="number"
            name="companionsConfirmed"
            min={0}
            max={maxCompanions ?? undefined}
            defaultValue={0}
            className="w-24 rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
          <p className="mt-1 text-xs text-ink-muted">{t("companionsHint")}</p>
        </div>
      )}

      {status === "CONFIRMED" && maxCompanions !== 0 && askCompanionNames && (
        <div>
          <input type="hidden" name="companionCount" value={companionRowCount} />
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("companions")} {maxCompanions !== null ? t("maxSuffix", { max: maxCompanions }) : ""}
          </label>
          <div className="space-y-2">
            {Array.from({ length: companionRowCount }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  name={`companion_${i}_name`}
                  placeholder={t("companionNamePlaceholder", { index: i + 1 })}
                  className="flex-1 rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
                <label className="flex items-center gap-1 text-xs text-ink-muted">
                  <input type="checkbox" name={`companion_${i}_attending`} defaultChecked />
                  {t("attending")}
                </label>
                {i === companionRowCount - 1 && (
                  <button
                    type="button"
                    onClick={removeCompanionRow}
                    className="text-ink-muted hover:text-danger"
                    aria-label={t("removeCompanion")}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {(maxCompanions === null || companionRowCount < maxCompanions) && (
            <button
              type="button"
              onClick={addCompanionRow}
              className="mt-2 text-sm text-gold-dark hover:underline"
            >
              {t("addCompanion")}
            </button>
          )}
        </div>
      )}

      {status === "CONFIRMED" && askDietary && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("dietaryRestrictions")}
          </label>
          <input
            type="text"
            name="dietaryNotes"
            placeholder={t("dietaryPlaceholder")}
            className="w-full rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
      )}

      {askMessage && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("message")}
          </label>
          <textarea
            name="messageFromGuest"
            rows={2}
            className="w-full rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-success">{t("thankYou")}</p>}
      {state?.ok && status === "CONFIRMED" && showQr && state.checkinUrl && (
        <RsvpQrReveal url={state.checkinUrl} fileLabel={publicRsvpToken} />
      )}

      <button
        type="submit"
        disabled={pending || state?.ok}
        className="w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-gold/30 transition hover:shadow-lg hover:shadow-gold/40 disabled:opacity-50"
      >
        {pending ? t("sending") : state?.ok ? t("sent") : t("confirm")}
      </button>
    </form>
  );
}
