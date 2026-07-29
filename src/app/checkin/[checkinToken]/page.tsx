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
      <div className="rounded-2xl border border-gold/20 bg-white/70 p-7 text-center shadow-lg backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Control de acceso</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-ink">{guest.event.title}</h1>

        <CheckInRunner
          checkinToken={checkinToken}
          guestName={guest.name}
          tableName={guest.tableName}
        />
      </div>
    </div>
  );
}
