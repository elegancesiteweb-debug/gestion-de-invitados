import Stripe from "stripe";
import type { PaymentGateway, CheckoutParams, CheckoutResult, VerifyParams, VerifyResult } from "@/lib/payments/types";

export const stripeGateway: PaymentGateway = {
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const stripe = new Stripe(params.apiKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: { name: params.description },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { invoiceToken: params.invoiceToken },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió una URL de pago");
    }

    return { redirectUrl: session.url, providerSessionId: session.id };
  },

  async verifyPayment(params: VerifyParams): Promise<VerifyResult> {
    if (!params.providerSessionId) {
      return { paid: false, invoiceToken: null };
    }
    const stripe = new Stripe(params.apiKey);
    const session = await stripe.checkout.sessions.retrieve(params.providerSessionId);

    return {
      paid: session.payment_status === "paid",
      invoiceToken: session.metadata?.invoiceToken ?? null,
    };
  },
};
