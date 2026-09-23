"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export function WhatsAppSendButton({
  phone,
  initialMessage,
  label,
}: {
  phone: string;
  initialMessage: string;
  label?: string;
}) {
  const t = useTranslations("shared");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  function handleOpen() {
    setMessage(initialMessage);
    setOpen(true);
  }

  function handleSend() {
    window.open(buildWhatsAppLink(phone, message), "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="text-sm text-success hover:underline"
      >
        {label ?? "WhatsApp"}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-lg bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-3 font-medium">{t("whatsappMessageTitle")}</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  type="button"
                  className="rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
                >
                  {t("close")}
                </button>
                <button
                  onClick={handleSend}
                  type="button"
                  className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
                >
                  {t("sendWhatsapp")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
