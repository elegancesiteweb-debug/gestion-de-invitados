"use server";

import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/dates";

export async function checkInGuest(checkinToken: string) {
  const guest = await prisma.guest.findUnique({ where: { checkinToken } });
  if (!guest) {
    return { status: "not_found" as const };
  }

  const passes = 1 + (guest.companionsConfirmed ?? 0);
  const now = new Date();

  const result = await prisma.guest.updateMany({
    where: { checkinToken, checkedInAt: null },
    data: { checkedInAt: now, checkedInPasses: passes },
  });

  if (result.count === 0) {
    const existing = await prisma.guest.findUnique({ where: { checkinToken } });
    return {
      status: "already" as const,
      arrivedAtLabel: existing?.checkedInAt ? formatTime(existing.checkedInAt) : "",
    };
  }

  return { status: "ok" as const, passes, arrivedAtLabel: formatTime(now) };
}
