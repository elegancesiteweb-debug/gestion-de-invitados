import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { formatDate } from "@/lib/dates";

export default async function PrintConfirmationsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const t = await getTranslations("eventPrint");

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: session.user.id },
    include: { guests: { orderBy: { name: "asc" }, include: { companions: true } } },
  });

  if (!event) {
    notFound();
  }

  const confirmed = event.guests.filter((g) => g.status === "CONFIRMED");
  const declined = event.guests.filter((g) => g.status === "DECLINED");
  const pending = event.guests.filter((g) => g.status === "PENDING");
  const totalAttendees = confirmed.reduce(
    (sum, g) => sum + 1 + (g.companionsConfirmed ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-gold-dark hover:underline"
        >
          {t("backToEvent")}
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-gold/20 pb-4 text-center">
        {event.logoImageType && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/events/${event.id}/logo`}
            alt=""
            className="mx-auto mb-2 h-16 w-16 rounded-full object-cover"
          />
        )}
        <h1 className="font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("confirmationsList")} ·{" "}
          {formatDate(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </header>

      <div className="mb-6 grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="font-serif text-2xl font-medium text-success">{confirmed.length}</p>
          <p className="text-xs text-ink-muted">{t("confirmed")}</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-danger">{declined.length}</p>
          <p className="text-xs text-ink-muted">{t("declined")}</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-warning">{pending.length}</p>
          <p className="text-xs text-ink-muted">{t("pending")}</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-ink">{totalAttendees}</p>
          <p className="text-xs text-ink-muted">{t("totalAttendees")}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink/20 text-left text-xs uppercase text-ink-muted">
            <th className="py-2 pr-2">{t("name")}</th>
            <th className="py-2 pr-2">{t("table")}</th>
            <th className="py-2 pr-2">{t("status")}</th>
            <th className="py-2 pr-2">{t("people")}</th>
            <th className="py-2 pr-2">{t("dietaryRestriction")}</th>
            <th className="py-2">{t("message")}</th>
          </tr>
        </thead>
        <tbody>
          {event.guests.map((guest) => (
            <tr key={guest.id} className="border-b border-ink/10">
              <td className="py-2 pr-2">{guest.name}</td>
              <td className="py-2 pr-2">{guest.tableName || "—"}</td>
              <td className="py-2 pr-2">
                {guest.status === "CONFIRMED"
                  ? t("confirmed")
                  : guest.status === "DECLINED"
                    ? t("declined")
                    : t("pending")}
              </td>
              <td className="py-2 pr-2">
                {guest.status === "CONFIRMED" ? 1 + (guest.companionsConfirmed ?? 0) : "—"}
                {guest.companions.length > 0 && (
                  <span className="block text-xs text-ink-muted">
                    {guest.companions
                      .map((c) => `${c.name}${c.attending ? "" : ` ${t("notAttendingSuffix")}`}`)
                      .join(", ")}
                  </span>
                )}
              </td>
              <td className="py-2 pr-2 text-ink-muted">{guest.dietaryNotes || ""}</td>
              <td className="py-2 text-ink-muted">{guest.messageFromGuest || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-center text-xs text-ink-light">
        {t("generatedOn", { date: formatDate(new Date()) })}
      </p>
    </div>
  );
}
