import type { PaymentGateway, CheckoutParams, CheckoutResult, VerifyParams, VerifyResult } from "@/lib/payments/types";

export const mercadoPagoGateway: PaymentGateway = {
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: params.description,
            quantity: 1,
            unit_price: params.amount,
            currency_id: params.currency.toUpperCase(),
          },
        ],
        external_reference: params.invoiceToken,
        back_urls: {
          success: params.successUrl,
          failure: params.cancelUrl,
          pending: params.successUrl,
        },
        auto_return: "approved",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Mercado Pago rechazó la solicitud de cobro: ${body}`);
    }

    const preference = (await response.json()) as { id: string; init_point: string };
    return { redirectUrl: preference.init_point, providerSessionId: preference.id };
  },

  async verifyPayment(params: VerifyParams): Promise<VerifyResult> {
    const paymentId = params.searchParams.payment_id || params.searchParams.collection_id;
    if (!paymentId) {
      return { paid: false, invoiceToken: null };
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${params.apiKey}` },
    });
    if (!response.ok) {
      return { paid: false, invoiceToken: null };
    }

    const payment = (await response.json()) as { status: string; external_reference: string | null };
    return {
      paid: payment.status === "approved",
      invoiceToken: payment.external_reference ?? null,
    };
  },
};
