"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export function EmbedCodeButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);

  const embedUrl = `${url}${url.includes("?") ? "&" : "?"}embed=1`;
  const snippet = `<iframe src="${embedUrl}" style="width:100%;max-width:480px;height:640px;border:none;background:transparent;" title="${title}" allowtransparency="true"></iframe>`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        type="button"
        className="text-sm text-gold-dark hover:underline"
      >
        Código para incrustar
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-gold/20 bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-serif text-lg font-medium text-ink">Código para incrustar</p>
              <p className="mt-1 text-xs text-ink-muted">
                Pega este código dentro del HTML de tu invitación (Canva, tu sitio, etc.) para que
                el formulario de confirmación aparezca directamente ahí.
              </p>
              <textarea
                readOnly
                value={snippet}
                rows={4}
                onFocus={(e) => e.currentTarget.select()}
                className="mt-3 w-full rounded-lg border border-gold/25 bg-warm px-3 py-2 font-mono text-xs text-ink"
              />
              <div className="mt-4 flex justify-end gap-3">
                <CopyLinkButton url={snippet} label="Copiar código" />
                <button
                  onClick={() => setOpen(false)}
                  type="button"
                  className="rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
