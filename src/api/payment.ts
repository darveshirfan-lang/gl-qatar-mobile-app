/**
 * Card payment hand-off.
 *
 * The app places the Magento order, then opens the payment gateway's hosted
 * page in a WebView and watches for the success or failure return URL.
 * Card details are entered on the gateway's page and never touch the app.
 *
 * To go live, wire getPaymentUrl() to the gateway module installed on
 * Magento (QPay, CyberSource, Checkout.com, ...) and list its method codes
 * in CARD_METHOD_CODES.
 */
import { config } from '../config';

export interface PaymentSession {
  /** Hosted payment page to open, or inline HTML for the demo gateway. */
  source: { uri: string } | { html: string };
  /** URL prefix the gateway redirects to after a successful payment. */
  successUrl: string;
  /** URL prefix the gateway redirects to after a failed or cancelled payment. */
  failureUrl: string;
}

/** Magento payment method codes paid through the gateway page. */
const CARD_METHOD_CODES: string[] = config.USE_MOCK ? ['demo_card'] : [];

/** Paid on delivery, no gateway needed. */
const OFFLINE_METHOD_CODES = ['cashondelivery'];

export function isCardMethod(code: string): boolean {
  return CARD_METHOD_CODES.includes(code);
}

/** Methods the app can complete: offline ones natively, card ones via the gateway. */
export function isSupportedMethod(code: string): boolean {
  return OFFLINE_METHOD_CODES.includes(code) || isCardMethod(code);
}

export async function getPaymentUrl(orderNumber: string, methodCode: string): Promise<PaymentSession> {
  if (config.USE_MOCK && methodCode === 'demo_card') return demoGateway(orderNumber);

  // TODO: ask Magento's gateway module for the hosted payment page of this order, e.g.
  //   const res = await fetch(`${config.MAGENTO_URL}/rest/V1/<gateway>/start/${orderNumber}`);
  //   return { source: { uri: url }, successUrl: '.../checkout/onepage/success', failureUrl: '.../checkout/cart' };
  throw new Error(`Card payment (${methodCode}) is not set up yet. Please choose Cash on Delivery.`);
}

const DEMO_SUCCESS = 'https://demo-gateway.local/success';
const DEMO_FAILURE = 'https://demo-gateway.local/failure';

function demoGateway(orderNumber: string): PaymentSession {
  const html = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,Roboto,sans-serif;margin:0;padding:24px;color:#111}
  h1{font-size:20px;margin:0 0 4px} p{color:#666;margin:0 0 24px}
  label{display:block;font-size:13px;margin:12px 0 4px}
  input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccc;border-radius:6px;font-size:16px}
  .row{display:flex;gap:12px} .row>div{flex:1}
  button{width:100%;padding:16px;margin-top:24px;border:0;border-radius:6px;font-size:16px;font-weight:600}
  .pay{background:#111;color:#fff} .cancel{background:#eee;color:#111;margin-top:12px}
  .note{font-size:12px;color:#999;text-align:center;margin-top:16px}
</style></head><body>
<h1>Demo payment gateway</h1>
<p>Order #${orderNumber}</p>
<label>Card number</label><input value="4111 1111 1111 1111" inputmode="numeric">
<div class="row"><div><label>Expiry</label><input value="12/29"></div>
<div><label>CVV</label><input value="123" inputmode="numeric"></div></div>
<button class="pay" onclick="location.href='${DEMO_SUCCESS}?order=${orderNumber}'">Pay now</button>
<button class="cancel" onclick="location.href='${DEMO_FAILURE}?order=${orderNumber}'">Cancel</button>
<div class="note">Demo mode: no real payment is taken.</div>
</body></html>`;
  return { source: { html }, successUrl: DEMO_SUCCESS, failureUrl: DEMO_FAILURE };
}
