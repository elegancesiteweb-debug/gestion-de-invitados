"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";

type QrKind = "rsvp" | "checkin";

export function GuestQrButton({
  guestName,
  rsvpUrl,
  checkinUrl,
}: {
  guestName: string;
  rsvpUrl: string;
  checkinUrl: string;
}) {
  const t = useTranslations("shared");
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<QrKind>("rsvp");
  const [dataUrls, setDataUrls] = useState<Partial<Record<QrKind, string>>>({});

  async function ensureQr(k: QrKind) {
    if (dataUrls[k]) return;
    const url = k === "rsvp" ? rsvpUrl : checkinUrl;
    const generated = await QRCode.toDataURL(url, { width: 320, margin: 1 });
    setDataUrls((prev) => ({ ...prev, [k]: generated }));
  }

  async function handleOpen() {
    await ensureQr("rsvp");
    setKind("rsvp");
    setOpen(true);
  }

  async function switchTo(k: QrKind) {
    await ensureQr(k);
    setKind(k);
  }

  const dataUrl = dataUrls[kind];

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="text-sm text-gold-dark hover:underline"
      >
        {t("viewQr")}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-xs rounded-lg bg-white p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-3 font-medium">{guestName}</p>

              <div className="mb-3 flex justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => switchTo("rsvp")}
                  className={`rounded-full px-3 py-1 ${kind === "rsvp" ? "bg-gradient-to-br from-gold-dark to-gold-deep text-white" : "bg-warm text-ink-muted"}`}
                >
                  {t("rsvpQr")}
                </button>
                <button
                  type="button"
                  onClick={() => switchTo("checkin")}
                  className={`rounded-full px-3 py-1 ${kind === "checkin" ? "bg-gradient-to-br from-gold-dark to-gold-deep text-white" : "bg-warm text-ink-muted"}`}
                >
                  {t("checkinQr")}
                </button>
              </div>

              {dataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dataUrl}
                  alt={`QR ${kind === "rsvp" ? t("rsvpQr") : t("checkinQr")} - ${guestName}`}
                  className="mx-auto"
                />
              )}

              <p className="mt-3 text-xs text-ink-muted">
                {kind === "rsvp" ? t("rsvpQrHint") : t("checkinQrHint")}
              </p>

              <div className="mt-4 flex justify-center gap-3">
                {dataUrl && (
                  <a
                    href={dataUrl}
                    download={`qr-${kind}-${guestName.replace(/\s+/g, "-").toLowerCase()}.png`}
                    className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
                  >
                    {t("download")}
                  </a>
                )}
                <button
                  onClick={() => setOpen(false)}
                  type="button"
                  className="rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
