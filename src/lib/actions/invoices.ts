"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import type { PaymentProvider } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGateway, resolvePaymentCredential } from "@/lib/payments";

const PROVIDERS: PaymentProvider[] = ["STRIPE", "MERCADOPAGO", "CLIP"];

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

async function requireLeadOwnedByOrganizer(leadId: string, organizerId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizerId } });
  if (!lead) {
    throw new Error("Lead no encontrado");
  }
  return lead;
}

export async function createInvoice(leadId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  const description = (formData.get("description") as string | null)?.trim();
  if (!description) {
    throw new Error("La descripción es requerida");
  }
  const amount = parseFloat((formData.get("amount") as string | null) ?? "");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Monto inválido");
  }
  const currency = (formData.get("currency") as string | null)?.trim().toLowerCase() || "mxn";
  const provider = formData.get("provider") as PaymentProvider | null;
  if (!provider || !PROVIDERS.includes(provider)) {
    throw new Error("Pasarela inválida");
  }

  await prisma.invoice.create({
    data: { leadId, description, amount, currency, provider, token: nanoid(16) },
  });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function deleteInvoice(leadId: string, invoiceId: string) {
  const organizerId = await requireOrganizerId();
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  await prisma.invoice.deleteMany({ where: { id: invoiceId, leadId } });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function createCheckoutSession(token: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { token },
    include: { lead: { include: { organizer: true } } },
  });
  if (!invoice) {
    throw new Error("Factura no encontrada");
  }
  if (invoice.status === "paid") {
    redirect(`/pay/${token}/success`);
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const gateway = getGateway(invoice.provider);
  const apiKey = resolvePaymentCredential(invoice.lead.organizer, invoice.provider);

  const result = await gateway.createCheckout({
    amount: invoice.amount,
    currency: invoice.currency,
    description: invoice.description,
    invoiceToken: invoice.token,
    successUrl: `${baseUrl}/pay/${token}/success`,
    cancelUrl: `${baseUrl}/pay/${token}`,
    apiKey,
  });

  await prisma.invoice.update({
    where: { token },
    data: { providerSessionId: result.providerSessionId },
  });

  redirect(result.redirectUrl);
}
