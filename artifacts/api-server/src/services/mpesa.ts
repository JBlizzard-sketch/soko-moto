import { logger } from "../lib/logger";

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY ?? "";
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET ?? "";
const SHORTCODE = process.env.MPESA_SHORTCODE ?? "174379"; // Safaricom sandbox default
const PASSKEY = process.env.MPESA_PASSKEY ?? "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL ?? `${process.env.REPLIT_DEV_DOMAIN ?? "https://example.com"}/api/payments/mpesa/callback`;
const BASE_URL = process.env.MPESA_ENV === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

const DEV_MODE = !CONSUMER_KEY || !CONSUMER_SECRET;

interface StkPushResult {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  error?: string;
  devMode?: boolean;
}

interface CallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

async function getOAuthToken(): Promise<string> {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error(`M-Pesa OAuth failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
}

function getPassword(timestamp: string): string {
  return Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString("base64");
}

export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}): Promise<StkPushResult> {
  if (DEV_MODE) {
    logger.info({ params }, "M-Pesa STK Push (DEV MODE — no real charge)");
    return {
      success: true,
      checkoutRequestId: `DEV-${Date.now()}`,
      merchantRequestId: `DEV-MR-${Date.now()}`,
      devMode: true,
    };
  }

  try {
    const token = await getOAuthToken();
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);

    const phone = params.phone.replace(/^0/, "254").replace(/^\+/, "");

    const body = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(params.amount),
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    };

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResponseCode?: string;
      ResponseDescription?: string;
      errorMessage?: string;
    };

    if (!res.ok || data.ResponseCode !== "0") {
      logger.error({ data }, "M-Pesa STK Push failed");
      return { success: false, error: data.errorMessage ?? data.ResponseDescription ?? "STK Push failed" };
    }

    return {
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      responseCode: data.ResponseCode,
      responseDescription: data.ResponseDescription,
    };
  } catch (err) {
    logger.error({ err }, "M-Pesa STK Push error");
    return { success: false, error: String(err) };
  }
}

export function parseCallback(payload: CallbackPayload) {
  const cb = payload.Body.stkCallback;
  const meta = cb.CallbackMetadata?.Item ?? [];
  const get = (name: string) => meta.find((i) => i.Name === name)?.Value;

  return {
    checkoutRequestId: cb.CheckoutRequestID,
    merchantRequestId: cb.MerchantRequestID,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc,
    success: cb.ResultCode === 0,
    mpesaReceiptNumber: String(get("MpesaReceiptNumber") ?? ""),
    amount: Number(get("Amount") ?? 0),
    phone: String(get("PhoneNumber") ?? ""),
  };
}
