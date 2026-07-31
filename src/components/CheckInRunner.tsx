"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("checkinPage");
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
          <p className="text-sm text-ink-muted">{t("registeringArrival")}</p>
        )}

        {result.kind === "ok" && (
          <div className="rounded-xl bg-success-bg p-5">
            <div className="mb-1 text-4xl">✓</div>
            <p className="text-base font-medium text-success">{t("accessRegistered")}</p>
            <p className="mt-1 text-sm text-success">
              {t("entryAt", { time: result.arrivedAtLabel })} ·{" "}
              {t("passCount", { count: result.passes })}
            </p>
          </div>
        )}

        {result.kind === "already" && (
          <div className="rounded-xl bg-warning-bg p-5">
            <div className="mb-1 text-4xl">⚠</div>
            <p className="text-base font-medium text-warning">{t("alreadyRegistered")}</p>
            <p className="mt-1 text-sm text-warning">
              {t("previousEntryAt", { time: result.arrivedAtLabel })}
            </p>
          </div>
        )}

        {result.kind === "not_found" && (
          <div className="rounded-xl bg-danger-bg p-5">
            <p className="text-base font-medium text-danger">{t("codeNotFound")}</p>
          </div>
        )}

        {result.kind === "error" && (
          <div className="rounded-xl bg-danger-bg p-5">
            <p className="text-base font-medium text-danger">{t("registrationError")}</p>
            <p className="mt-1 text-sm text-danger">{t("checkConnection")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
