import type { AccountType } from "@prisma/client";
import { hasFeature, type FeatureKey } from "@/lib/features";

const TABS = [
  { key: "invitados", label: "Invitados" },
  { key: "confirmaciones", label: "Confirmaciones" },
  { key: "mesas", label: "Mesas" },
  { key: "plano", label: "Plano del salón" },
  { key: "tareas", label: "Tareas", feature: "checklist" as FeatureKey },
  { key: "presupuesto", label: "Presupuesto", feature: "budget_basic" as FeatureKey },
  { key: "timeline", label: "Agenda", feature: "day_timeline" as FeatureKey },
  { key: "proveedores", label: "Proveedores", feature: "vendor_directory" as FeatureKey },
  { key: "estilo", label: "Estilo", feature: "style_guide" as FeatureKey },
  { key: "mensajes", label: "Mensajes", feature: "client_portal" as FeatureKey },
  { key: "actividad", label: "Actividad" },
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
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
