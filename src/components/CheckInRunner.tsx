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
      <p className="text-lg font-medium">{guestName}</p>
      {tableName && <p className="text-sm text-gray-500">{tableName}</p>}

      <div className="mt-4">
        {result.kind === "loading" && <p className="text-sm text-gray-500">Registrando llegada...</p>}

        {result.kind === "ok" && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">Acceso registrado</p>
            <p className="mt-1 text-xs text-green-600">
              Entrada a las {result.arrivedAtLabel} · {result.passes} pase{result.passes !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {result.kind === "already" && (
          <div className="rounded-md bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-700">Ya registrado</p>
            <p className="mt-1 text-xs text-amber-600">Ingreso previo a las {result.arrivedAtLabel}</p>
          </div>
        )}

        {result.kind === "not_found" && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">Código no encontrado</p>
          </div>
        )}

        {result.kind === "error" && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">Error al registrar</p>
            <p className="mt-1 text-xs text-red-600">Verifica tu conexión e intenta de nuevo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
