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
import { TimelinePanel } from "@/components/event-dashboard/TimelinePanel";
import { StyleGuidePanel } from "@/components/event-dashboard/StyleGuidePanel";
import { EventVendorsPanel } from "@/components/event-dashboard/EventVendorsPanel";
import { ClientMessagesPanel } from "@/components/event-dashboard/ClientMessagesPanel";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { formatDateTime } from "@/lib/dates";

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
      guests: { orderBy: { createdAt: "asc" }, include: { companions: true } },
      tasks: { orderBy: { createdAt: "asc" } },
      budgetItems: { orderBy: { createdAt: "asc" } },
      tables: { orderBy: { createdAt: "asc" } },
      timelineItems: { orderBy: { time: "asc" } },
      styleGuideImages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, imageType: true, uploadedBy: true },
      },
      eventVendors: { orderBy: { createdAt: "asc" }, include: { vendor: true } },
      clientComments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!event) {
    notFound();
  }

  const availableVendors =
    activeTab === "proveedores"
      ? await prisma.vendor.findMany({
          where: { organizerId: session.user.id },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const confirmed = event.guests.filter((g) => g.status === "CONFIRMED");
  const declined = event.guests.filter((g) => g.status === "DECLINED");
  const pending = event.guests.filter((g) => g.status === "PENDING");
  const totalAttendees = confirmed.reduce(
    (sum, g) => sum + 1 + (g.companionsConfirmed ?? 0),
    0
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row">
      <aside className="w-full md:w-48 md:flex-none">
        <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
          ← Tus eventos
        </Link>
        <div className="mt-4 md:sticky md:top-6">
          <EventTabsNav activeTab={activeTab} accountType={session.user.accountType} />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {event.logoImageType && (
          <div className="relative mb-4 h-36 w-full overflow-hidden rounded-2xl shadow-md sm:h-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/events/${event.id}/logo`}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-medium text-white drop-shadow-sm">
                  {event.title}
                </h1>
                <EventStatusBadge status={event.status} />
              </div>
              <p className="text-sm text-white/90 drop-shadow-sm">
                {formatDateTime(event.eventDate)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
          </div>
        )}

        <div
          className={`flex flex-wrap items-start gap-3 ${event.logoImageType ? "justify-end" : "justify-between"}`}
        >
          {!event.logoImageType && (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-medium text-ink">{event.title}</h1>
                <EventStatusBadge status={event.status} />
              </div>
              <p className="text-sm text-ink-muted">
                {formatDateTime(event.eventDate)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
          )}
          {session.user.teamRole !== "COLLABORATOR" && (
            <form action={deleteEvent.bind(null, event.id)}>
              <button type="submit" className="text-sm text-danger hover:underline">
                Eliminar evento
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Confirmados" value={confirmed.length} />
          <StatCard label="No asisten" value={declined.length} />
          <StatCard label="Pendientes" value={pending.length} />
          <StatCard label="Total asistentes" value={totalAttendees} />
        </div>

        {activeTab === "confirmaciones" ? (
          <ConfirmationsPanel eventId={event.id} guests={event.guests} />
        ) : activeTab === "mesas" ? (
          <TablesPanel eventId={event.id} tables={event.tables} guests={event.guests} />
        ) : activeTab === "tareas" ? (
          <TasksPanel eventId={event.id} tasks={event.tasks} />
        ) : activeTab === "presupuesto" ? (
          <BudgetPanel eventId={event.id} items={event.budgetItems} />
        ) : activeTab === "timeline" ? (
          <TimelinePanel eventId={event.id} items={event.timelineItems} />
        ) : activeTab === "proveedores" ? (
          <EventVendorsPanel
            eventId={event.id}
            eventVendors={event.eventVendors}
            availableVendors={availableVendors}
          />
        ) : activeTab === "estilo" ? (
          <StyleGuidePanel event={event} images={event.styleGuideImages} />
        ) : activeTab === "mensajes" ? (
          <ClientMessagesPanel comments={event.clientComments} />
        ) : activeTab === "accesos" ? (
          <AccessPanel guests={event.guests} />
        ) : activeTab === "envios" ? (
          <SendsPanel event={event} guests={event.guests} baseUrl={baseUrl} />
        ) : activeTab === "configuracion" ? (
          <SettingsPanel event={event} baseUrl={baseUrl} accountType={session.user.accountType} />
        ) : (
          <GuestsPanel event={event} guests={event.guests} tables={event.tables} baseUrl={baseUrl} />
        )}
      </main>
    </div>
  );
}
