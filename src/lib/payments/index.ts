import type { PaymentProvider } from "@prisma/client";
import type { PaymentGateway } from "@/lib/payments/types";
import { stripeGateway } from "@/lib/payments/stripe";
import { mercadoPagoGateway } from "@/lib/payments/mercadopago";
import { clipGateway } from "@/lib/payments/clip";

export function getGateway(provider: PaymentProvider): PaymentGateway {
  switch (provider) {
    case "STRIPE":
      return stripeGateway;
    case "MERCADOPAGO":
      return mercadoPagoGateway;
    case "CLIP":
      return clipGateway;
  }
}

export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  STRIPE: "Stripe",
  MERCADOPAGO: "Mercado Pago",
  CLIP: "Clip",
};
