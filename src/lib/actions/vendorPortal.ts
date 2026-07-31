"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";

export async function confirmVendorParticipation(token: string, confirmed: boolean) {
  const eventVendor = await prisma.eventVendor.findUnique({
    where: { confirmationToken: token },
    include: { vendor: true },
  });
  if (!eventVendor) {
    throw new Error("Enlace no válido");
  }

  await prisma.eventVendor.update({
    where: { id: eventVendor.id },
    data: { vendorConfirmed: confirmed, confirmedAt: new Date() },
  });

  await logActivity(
    eventVendor.eventId,
    confirmed
      ? `El proveedor "${eventVendor.vendor.name}" confirmó su participación`
      : `El proveedor "${eventVendor.vendor.name}" no podrá asistir`,
    eventVendor.vendor.name
  );

  revalidatePath(`/vendor/${token}`);
  revalidatePath(`/dashboard/events/${eventVendor.eventId}`);
}
