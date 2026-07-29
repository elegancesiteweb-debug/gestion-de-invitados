"use client";

import { useState } from "react";
import QRCode from "qrcode";

export function GuestQrButton({ url, guestName }: { url: string; guestName: string }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  async function handleOpen() {
    if (!dataUrl) {
      const generated = await QRCode.toDataURL(url, { width: 320, margin: 1 });
      setDataUrl(generated);
    }
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="text-sm text-indigo-600 hover:underline"
      >
        Ver QR
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-lg bg-white p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 font-medium">{guestName}</p>
            {dataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={`QR de confirmación para ${guestName}`} className="mx-auto" />
            )}
            <p className="mt-3 text-xs text-gray-500">
              Pega este QR en la invitación para que el invitado confirme su asistencia.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {dataUrl && (
                <a
                  href={dataUrl}
                  download={`qr-${guestName.replace(/\s+/g, "-").toLowerCase()}.png`}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                >
                  Descargar
                </a>
              )}
              <button
                onClick={() => setOpen(false)}
                type="button"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
