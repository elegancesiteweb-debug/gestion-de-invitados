import type { AccountType } from "@prisma/client";
import { hasFeature, type FeatureKey } from "@/lib/features";

const TABS = [
  { key: "invitados", label: "Invitados" },
  { key: "confirmaciones", label: "Confirmaciones" },
  { key: "mesas", label: "Mesas" },
  { key: "tareas", label: "Tareas", feature: "checklist" as FeatureKey },
  { key: "presupuesto", label: "Presupuesto", feature: "budget_basic" as FeatureKey },
  { key: "accesos", label: "Accesos" },
  { key: "envios", label: "Envíos" },
  { key: "configuracion", label: "Configuración" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function EventTabsNav({
  activeTab,
  accountType,
}: {
  activeTab: string;
  accountType: AccountType;
}) {
  const visibleTabs = TABS.filter((tab) => !("feature" in tab) || hasFeature(accountType, tab.feature));

  return (
    <nav className="flex flex-col gap-1 rounded-xl border border-gold/20 bg-white/50 p-2 shadow-sm backdrop-blur-xl">
      {visibleTabs.map((tab) => (
        <a
          key={tab.key}
          href={`?tab=${tab.key}`}
          className={`whitespace-nowrap rounded-lg border-l-2 px-3 py-2 text-sm font-medium ${
            activeTab === tab.key
              ? "border-gold bg-warm text-gold-dark"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
