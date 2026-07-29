"use client";

import { useState } from "react";

export function GeneralPassesInput({ initialValue }: { initialValue: number | null }) {
  const [unlimited, setUnlimited] = useState(initialValue === null);

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
        Acompañantes máximos en el formulario general
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
          Sin límite
        </label>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        Pon 0 para que el formulario general no permita acompañantes (solo el titular).
      </p>
    </div>
  );
}
