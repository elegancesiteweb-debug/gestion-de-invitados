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
    include: { guests: { orderBy: { createdAt: "asc" } } },
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
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
        ← Tus eventos
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <p className="text-sm text-gray-500">
            {event.eventDate.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
        <form action={deleteEvent.bind(null, event.id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
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
        <EventTabsNav activeTab={activeTab} />

        {activeTab === "confirmaciones" ? (
          <ConfirmationsPanel guests={event.guests} />
        ) : activeTab === "mesas" ? (
          <TablesPanel guests={event.guests} />
        ) : activeTab === "accesos" ? (
          <AccessPanel guests={event.guests} />
        ) : activeTab === "envios" ? (
          <SendsPanel event={event} guests={event.guests} baseUrl={baseUrl} />
        ) : activeTab === "configuracion" ? (
          <SettingsPanel event={event} />
        ) : (
          <GuestsPanel event={event} guests={event.guests} baseUrl={baseUrl} />
        )}
      </div>
    </div>
  );
}
