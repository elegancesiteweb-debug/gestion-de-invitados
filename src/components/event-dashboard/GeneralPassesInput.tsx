"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function GeneralPassesInput({ initialValue }: { initialValue: number | null }) {
  const [unlimited, setUnlimited] = useState(initialValue === null);
  const t = useTranslations("generalPassesInput");

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
        {t("label")}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          name="generalMaxCompanions"
          min={0}
          defaultValue={initialValue ?? 0}
          disabled={unlimited}
          className="w-24 rounded-lg border border-gold/25 px-3 py-2 text-sm disabled:opacity-50"
        />
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="generalUnlimited"
            checked={unlimited}
            onChange={(e) => setUnlimited(e.target.checked)}
          />
          {t("unlimited")}
        </label>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{t("hint")}</p>
    </div>
  );
}
