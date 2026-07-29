const TABS = [
  { key: "invitados", label: "Invitados" },
  { key: "confirmaciones", label: "Confirmaciones" },
  { key: "mesas", label: "Mesas" },
  { key: "accesos", label: "Accesos" },
  { key: "envios", label: "Envíos" },
  { key: "configuracion", label: "Configuración" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function EventTabsNav({ activeTab }: { activeTab: string }) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gold/20 bg-white/50 px-2 shadow-sm backdrop-blur-xl">
      {TABS.map((tab) => (
        <a
          key={tab.key}
          href={`?tab=${tab.key}`}
          className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
            activeTab === tab.key
              ? "border-gold text-gold-dark"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
