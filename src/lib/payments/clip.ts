import type { PaymentGateway, CheckoutParams, CheckoutResult, VerifyParams, VerifyResult } from "@/lib/payments/types";

// Integración best-effort con la API pública de Checkout de Clip (payclip.com).
// Sin una cuenta real para probar contra su sandbox, los nombres de campo pueden
// necesitar ajustes una vez que haya credenciales reales disponibles.

export const clipGateway: PaymentGateway = {
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const response = await fetch("https://api.payclip.com/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100),
        currency: params.currency.toUpperCase(),
        purchase_description: params.description,
        redirection_url: {
          success: params.successUrl,
          error: params.cancelUrl,
        },
        metadata: { invoiceToken: params.invoiceToken },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Clip rechazó la solicitud de cobro: ${body}`);
    }

    const checkout = (await response.json()) as { id: string; payment_request_url: string };
    return { redirectUrl: checkout.payment_request_url, providerSessionId: checkout.id };
  },

  async verifyPayment(params: VerifyParams): Promise<VerifyResult> {
    if (!params.providerSessionId) {
      return { paid: false, invoiceToken: null };
    }

    const response = await fetch(`https://api.payclip.com/checkout/${params.providerSessionId}`, {
      headers: { Authorization: `Bearer ${params.apiKey}` },
    });
    if (!response.ok) {
      return { paid: false, invoiceToken: null };
    }

    const checkout = (await response.json()) as {
      status: string;
      metadata?: { invoiceToken?: string };
    };
    return {
      paid: checkout.status === "paid" || checkout.status === "completed",
      invoiceToken: checkout.metadata?.invoiceToken ?? null,
    };
  },
};
