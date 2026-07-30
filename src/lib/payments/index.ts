import type { Organizer, PaymentProvider } from "@prisma/client";
import type { PaymentGateway } from "@/lib/payments/types";
import { stripeGateway } from "@/lib/payments/stripe";
import { mercadoPagoGateway } from "@/lib/payments/mercadopago";
import { clipGateway } from "@/lib/payments/clip";
import { decryptSecret } from "@/lib/crypto";

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

const ENV_VAR_BY_PROVIDER: Record<PaymentProvider, string> = {
  STRIPE: "STRIPE_SECRET_KEY",
  MERCADOPAGO: "MERCADOPAGO_ACCESS_TOKEN",
  CLIP: "CLIP_API_KEY",
};

type OrganizerCredentialFields = Pick<
  Organizer,
  "stripeSecretKey" | "mercadoPagoAccessToken" | "clipApiKey"
>;

export function resolvePaymentCredential(
  organizer: OrganizerCredentialFields,
  provider: PaymentProvider
): string {
  const encrypted =
    provider === "STRIPE"
      ? organizer.stripeSecretKey
      : provider === "MERCADOPAGO"
        ? organizer.mercadoPagoAccessToken
        : organizer.clipApiKey;

  if (encrypted) {
    return decryptSecret(encrypted);
  }

  const envVar = ENV_VAR_BY_PROVIDER[provider];
  const fallback = process.env[envVar];
  if (fallback) {
    return fallback;
  }

  throw new Error(
    `No hay credenciales de ${PROVIDER_LABELS[provider]} configuradas. Agrégalas en Integraciones o pide al administrador que configure ${envVar}.`
  );
}
