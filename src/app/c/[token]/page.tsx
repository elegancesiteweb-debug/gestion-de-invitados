import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RsvpForm } from "@/components/RsvpForm";

export default async function ConfirmAttendancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { event: true },
  });

  if (!guest) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-400">Confirmación de asistencia</p>
        <h1 className="mt-1 text-xl font-semibold">{guest.event.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {guest.event.eventDate.toLocaleString("es-ES", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        {guest.event.location && (
          <p className="text-sm text-gray-500">{guest.event.location}</p>
        )}
        {guest.event.notes && (
          <p className="mt-2 text-sm text-gray-600">{guest.event.notes}</p>
        )}

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">
            Hola <span className="font-medium">{guest.name}</span>, por favor confirma tu asistencia.
          </p>
        </div>

        <RsvpForm
          token={token}
          maxCompanions={guest.maxCompanions}
          currentStatus={guest.status}
          currentCompanions={guest.companionsConfirmed}
          currentMessage={guest.messageFromGuest}
        />
      </div>
    </div>
  );
}
