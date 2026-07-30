import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteEvent } from "@/lib/actions/events";
import { StatCard } from "@/components/event-dashboard/StatCard";
import { EventTabsNav, type TabKey } from "@/components/event-dashboard/EventTabsNav";
import { GuestsPanel } from "@/components/event-dashboard/GuestsPanel";
import { ConfirmationsPanel } from "@/components/event-dashboard/ConfirmationsPanel";
import { TablesPanel } from "@/components/event-dashboard/TablesPanel";
import { AccessPanel } from "@/components/event-dashboard/AccessPanel";
import { SendsPanel } from "@/components/event-dashboard/SendsPanel";
import { SettingsPanel } from "@/components/event-dashboard/SettingsPanel";
import { TasksPanel } from "@/components/event-dashboard/TasksPanel";
import { BudgetPanel } from "@/components/event-dashboard/BudgetPanel";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { eventId } = await params;
  const { tab } = await searchParams;
  const activeTab = (tab ?? "invitados") as TabKey;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: session.user.id },
    include: {
      guests: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: { createdAt: "asc" } },
      budgetItems: { orderBy: { createdAt: "asc" } },
      tables: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!event) {
    notFound();
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const confirmed = event.guests.filter((g) => g.status === "CONFIRMED");
  const declined = event.guests.filter((g) => g.status === "DECLINED");
  const pending = event.guests.filter((g) => g.status === "PENDING");
  const totalAttendees = confirmed.reduce(
    (sum, g) => sum + 1 + (g.companionsConfirmed ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        ← Tus eventos
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-ink">{event.title}</h1>
          <p className="text-sm text-ink-muted">
            {event.eventDate.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
        <form action={deleteEvent.bind(null, event.id)}>
          <button type="submit" className="text-sm text-danger hover:underline">
            Eliminar evento
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Confirmados" value={confirmed.length} />
        <StatCard label="No asisten" value={declined.length} />
        <StatCard label="Pendientes" value={pending.length} />
        <StatCard label="Total asistentes" value={totalAttendees} />
      </div>

      <div className="mt-8">
        <EventTabsNav activeTab={activeTab} accountType={session.user.accountType} />

        {activeTab === "confirmaciones" ? (
          <ConfirmationsPanel eventId={event.id} guests={event.guests} />
        ) : activeTab === "mesas" ? (
          <TablesPanel eventId={event.id} tables={event.tables} guests={event.guests} />
        ) : activeTab === "tareas" ? (
          <TasksPanel eventId={event.id} tasks={event.tasks} />
        ) : activeTab === "presupuesto" ? (
          <BudgetPanel eventId={event.id} items={event.budgetItems} />
        ) : activeTab === "accesos" ? (
          <AccessPanel guests={event.guests} />
        ) : activeTab === "envios" ? (
          <SendsPanel event={event} guests={event.guests} baseUrl={baseUrl} />
        ) : activeTab === "configuracion" ? (
          <SettingsPanel event={event} baseUrl={baseUrl} />
        ) : (
          <GuestsPanel event={event} guests={event.guests} tables={event.tables} baseUrl={baseUrl} />
        )}
      </div>
    </div>
  );
}
