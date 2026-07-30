export interface CheckoutParams {
  amount: number;
  currency: string;
  description: string;
  invoiceToken: string;
  successUrl: string;
  cancelUrl: string;
  apiKey: string;
}

export interface CheckoutResult {
  redirectUrl: string;
  providerSessionId: string;
}

export interface VerifyParams {
  providerSessionId: string | null;
  searchParams: Record<string, string>;
  apiKey: string;
}

export interface VerifyResult {
  paid: boolean;
  invoiceToken: string | null;
}

export interface PaymentGateway {
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyPayment(params: VerifyParams): Promise<VerifyResult>;
}
