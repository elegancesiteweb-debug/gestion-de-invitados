import type { AccountType } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { hasFeature, type FeatureKey } from "@/lib/features";

const TAB_KEYS = [
  { key: "invitados", feature: undefined },
  { key: "confirmaciones", feature: undefined },
  { key: "mesas", feature: undefined },
  { key: "plano", feature: undefined },
  { key: "tareas", feature: "checklist" as FeatureKey },
  { key: "presupuesto", feature: "budget_basic" as FeatureKey },
  { key: "timeline", feature: "day_timeline" as FeatureKey },
  { key: "proveedores", feature: "vendor_directory" as FeatureKey },
  { key: "estilo", feature: "style_guide" as FeatureKey },
  { key: "mensajes", feature: "client_portal" as FeatureKey },
  { key: "actividad", feature: undefined },
  { key: "accesos", feature: undefined },
  { key: "envios", feature: undefined },
  { key: "configuracion", feature: undefined },
] as const;

export type TabKey = (typeof TAB_KEYS)[number]["key"];

export async function EventTabsNav({
  activeTab,
  accountType,
}: {
  activeTab: string;
  accountType: AccountType;
}) {
  const t = await getTranslations("eventTabs");
  const visibleTabs = TAB_KEYS.filter((tab) => !tab.feature || hasFeature(accountType, tab.feature));

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gold/20 bg-white/50 p-2 shadow-sm backdrop-blur-xl md:flex-col md:overflow-visible">
      {visibleTabs.map((tab) => (
        <a
          key={tab.key}
          href={`?tab=${tab.key}`}
          className={`whitespace-nowrap rounded-lg border-b-2 px-3 py-2 text-sm font-medium md:border-b-0 md:border-l-2 ${
            activeTab === tab.key
              ? "border-gold bg-warm text-gold-dark"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          {t(tab.key)}
        </a>
      ))}
    </nav>
  );
}
