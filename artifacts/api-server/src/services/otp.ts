import { db, otpCodesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { logger } from "../lib/logger";

const OTP_EXPIRY_MINUTES = 10;
const DEV_OTP = "123456"; // fixed OTP in dev mode

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSms(phone: string, code: string): Promise<void> {
  if (!process.env.AFRICASTALKING_API_KEY) {
    logger.info({ phone, code }, "OTP (DEV MODE — SMS not sent, check logs)");
    return;
  }

  try {
    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey: process.env.AFRICASTALKING_API_KEY,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: process.env.AFRICASTALKING_USERNAME ?? "sandbox",
        to: phone,
        message: `Your Soko Moto code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share.`,
        from: "SOKOMOTO",
      }),
    });
    if (!res.ok) logger.warn({ status: res.status }, "SMS send failed");
  } catch (err) {
    logger.error({ err }, "SMS send error");
  }
}

export async function requestOtp(phone: string): Promise<{ sent: boolean; devMode: boolean }> {
  const devMode = !process.env.AFRICASTALKING_API_KEY;
  const code = devMode ? DEV_OTP : generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate previous codes for this phone
  await db.update(otpCodesTable)
    .set({ used: 1 })
    .where(eq(otpCodesTable.phone, phone));

  await db.insert(otpCodesTable).values({ phone, code, expiresAt });
  await sendSms(phone, code);

  return { sent: true, devMode };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const now = new Date();
  const [row] = await db.select()
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.phone, phone),
        eq(otpCodesTable.code, code),
        eq(otpCodesTable.used, 0),
        gt(otpCodesTable.expiresAt, now),
      )
    );

  if (!row) return false;

  await db.update(otpCodesTable).set({ used: 1 }).where(eq(otpCodesTable.id, row.id));
  return true;
}
