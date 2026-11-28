// SSLCommerz (v4) helpers: create a payment session and validate a finished payment.
export const sslEnabled = () => Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);
export const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const depositBdt = () => {
  const n = Number(process.env.BOOKING_DEPOSIT_BDT || 100);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 100;
};
const host = () => (process.env.SSLCOMMERZ_IS_LIVE === 'true' ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com');

export async function createSession(i: { tranId: string; amountBdt: number; name: string; phone: string; token: string }): Promise<string> {
  const base = appUrl();
  const body = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID || '',
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    total_amount: String(i.amountBdt),
    currency: 'BDT',
    tran_id: i.tranId,
    success_url: `${base}/api/payments/sslcommerz/success`,
    fail_url: `${base}/api/payments/sslcommerz/fail`,
    cancel_url: `${base}/api/payments/sslcommerz/cancel`,
    ipn_url: `${base}/api/payments/sslcommerz/ipn`,
    shipping_method: 'NO',
    product_name: `Table booking ${i.token}`,
    product_category: 'Restaurant',
    product_profile: 'general',
    cus_name: i.name,
    cus_email: 'customer@brewbook.local',
    cus_add1: 'Dhaka',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: i.phone,
    value_a: i.token,
  });
  const res = await fetch(`${host()}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
  if (data.status !== 'SUCCESS' || !data.GatewayPageURL) throw new Error(data.failedreason || 'Could not start the payment session');
  return data.GatewayPageURL;
}

export type Validation = { status?: string; tran_id?: string; amount?: string; currency_type?: string; [k: string]: unknown };

export async function validatePayment(valId: string): Promise<Validation> {
  const qs = new URLSearchParams({
    val_id: valId,
    store_id: process.env.SSLCOMMERZ_STORE_ID || '',
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    v: '1',
    format: 'json',
  });
  const res = await fetch(`${host()}/validator/api/validationserverAPI.php?${qs}`, { signal: AbortSignal.timeout(15000) });
  return (await res.json()) as Validation;
}
