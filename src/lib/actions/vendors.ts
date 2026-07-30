"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess } from "@/lib/actions/authz";
import { logActivity } from "@/lib/activityLog";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

async function requireEventOwnedByOrganizer(eventId: string, organizerId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
  if (!event) {
    throw new Error("Evento no encontrado");
  }
  return event;
}

export async function assignVendorToEvent(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const vendorId = (formData.get("vendorId") as string | null)?.trim();
  if (!vendorId) {
    throw new Error("Selecciona un proveedor");
  }

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, organizerId } });
  if (!vendor) {
    throw new Error("Proveedor no encontrado");
  }

  await prisma.eventVendor.upsert({
    where: { eventId_vendorId: { eventId, vendorId } },
    create: { eventId, vendorId },
    update: {},
  });
  await logActivity(eventId, `Agregó al proveedor "${vendor.name}"`);

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function unassignVendorFromEvent(eventId: string, vendorId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, organizerId } });

  await prisma.eventVendor.deleteMany({ where: { eventId, vendorId } });
  if (vendor) {
    await logActivity(eventId, `Quitó al proveedor "${vendor.name}"`);
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function createVendorForEvent(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  const category = (formData.get("category") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  const vendor = await prisma.vendor.create({
    data: { organizerId, name, category, phone, email, notes },
  });
  await prisma.eventVendor.create({ data: { eventId, vendorId: vendor.id } });

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard/vendors");
}

export async function createVendor(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  const category = (formData.get("category") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  await prisma.vendor.create({
    data: { organizerId, name, category, phone, email, notes },
  });

  revalidatePath("/dashboard/vendors");
}

export async function deleteVendor(vendorId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  await prisma.vendor.deleteMany({
    where: { id: vendorId, organizerId },
  });

  revalidatePath("/dashboard/vendors");
}
