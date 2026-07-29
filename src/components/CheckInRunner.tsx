"use client";

import { useEffect, useState } from "react";
import { checkInGuest } from "@/lib/actions/checkin";

type Result =
  | { kind: "loading" }
  | { kind: "ok"; passes: number; arrivedAtLabel: string }
  | { kind: "already"; arrivedAtLabel: string }
  | { kind: "not_found" }
  | { kind: "error" };

export function CheckInRunner({
  checkinToken,
  guestName,
  tableName,
}: {
  checkinToken: string;
  guestName: string;
  tableName: string | null;
}) {
  const [result, setResult] = useState<Result>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    checkInGuest(checkinToken)
      .then((res) => {
        if (cancelled) return;
        if (res.status === "ok") {
          setResult({ kind: "ok", passes: res.passes, arrivedAtLabel: res.arrivedAtLabel });
        } else if (res.status === "already") {
          setResult({ kind: "already", arrivedAtLabel: res.arrivedAtLabel });
        } else {
          setResult({ kind: "not_found" });
        }
      })
      .catch(() => {
        if (!cancelled) setResult({ kind: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [checkinToken]);

  return (
    <div className="mt-4">
      <p className="font-serif text-xl font-medium text-ink">{guestName}</p>
      {tableName && <p className="text-sm text-ink-muted">{tableName}</p>}

      <div className="mt-5">
        {result.kind === "loading" && (
          <p className="text-sm text-ink-muted">Registrando llegada...</p>
        )}

        {result.kind === "ok" && (
          <div className="rounded-xl bg-success-bg p-5">
            <div className="mb-1 text-4xl">✓</div>
            <p className="text-base font-medium text-success">Acceso registrado</p>
            <p className="mt-1 text-sm text-success">
              Entrada a las {result.arrivedAtLabel} · {result.passes} pase
              {result.passes !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {result.kind === "already" && (
          <div className="rounded-xl bg-warning-bg p-5">
            <div className="mb-1 text-4xl">⚠</div>
            <p className="text-base font-medium text-warning">Ya registrado</p>
            <p className="mt-1 text-sm text-warning">
              Ingreso previo a las {result.arrivedAtLabel}
            </p>
          </div>
        )}

        {result.kind === "not_found" && (
          <div className="rounded-xl bg-danger-bg p-5">
            <p className="text-base font-medium text-danger">Código no encontrado</p>
          </div>
        )}

        {result.kind === "error" && (
          <div className="rounded-xl bg-danger-bg p-5">
            <p className="text-base font-medium text-danger">Error al registrar</p>
            <p className="mt-1 text-sm text-danger">Verifica tu conexión e intenta de nuevo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
