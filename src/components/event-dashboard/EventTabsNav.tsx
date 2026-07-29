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
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {TABS.map((tab) => (
        <a
          key={tab.key}
          href={`?tab=${tab.key}`}
          className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
            activeTab === tab.key
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
