import type { Companion, Guest } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { CheckedInGuestList } from "@/components/event-dashboard/CheckedInGuestList";

export async function AccessPanel({ guests }: { guests: (Guest & { companions: Companion[] })[] }) {
  const t = await getTranslations("access");
  const arrived = guests
    .filter((g) => g.checkedInAt !== null)
    .sort((a, b) => (b.checkedInAt as Date).getTime() - (a.checkedInAt as Date).getTime());
  const notArrived = guests.filter((g) => g.checkedInAt === null);
  const totalPasses = arrived.reduce((sum, g) => sum + (g.checkedInPasses ?? 1), 0);

  return (
    <div className="space-y-6 py-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gold/20 bg-white/60 p-4 text-center shadow-md backdrop-blur-xl">
          <p className="font-serif text-3xl font-medium text-success">{arrived.length}</p>
          <p className="text-xs text-ink-muted">{t("checkedIn")}</p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-white/60 p-4 text-center shadow-md backdrop-blur-xl">
          <p className="font-serif text-3xl font-medium text-gold-dark">{totalPasses}</p>
          <p className="text-xs text-ink-muted">{t("passesUsed")}</p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-white/60 p-4 text-center shadow-md backdrop-blur-xl">
          <p className="font-serif text-3xl font-medium text-warning">{notArrived.length}</p>
          <p className="text-xs text-ink-muted">{t("notCheckedIn")}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("entriesTitle")}</h2>
        {arrived.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noEntries")}</p>
        ) : (
          <CheckedInGuestList guests={arrived} />
        )}
      </div>
    </div>
  );
}
