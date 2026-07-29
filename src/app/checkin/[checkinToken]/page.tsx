import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckInRunner } from "@/components/CheckInRunner";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ checkinToken: string }>;
}) {
  const { checkinToken } = await params;

  const guest = await prisma.guest.findUnique({
    where: { checkinToken },
    include: { event: true },
  });

  if (!guest) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-400">Control de acceso</p>
        <h1 className="mt-1 text-xl font-semibold">{guest.event.title}</h1>

        <CheckInRunner
          checkinToken={checkinToken}
          guestName={guest.name}
          tableName={guest.tableName}
        />
      </div>
    </div>
  );
}
