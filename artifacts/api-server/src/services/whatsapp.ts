import { logger } from "../lib/logger";

const API_KEY = process.env.AFRICASTALKING_API_KEY ?? "";
const USERNAME = process.env.AFRICASTALKING_USERNAME ?? "sandbox";
const DEV_MODE = !API_KEY;

interface BookingConfirmation {
  phone: string;
  guestName: string;
  venueName: string;
  dealTitle: string;
  bookingReference: string;
  covers: number;
  totalPaid: number;
  validFrom: Date;
}

interface DealAlert {
  phone: string;
  guestName: string;
  venueName: string;
  dealTitle: string;
  discountPercent: number;
  dealPrice: number;
  slotsLeft: number;
  dealId: number;
}

async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (DEV_MODE) {
    logger.info({ phone, message }, "WhatsApp message (DEV MODE — not sent)");
    return;
  }

  try {
    const res = await fetch("https://api.africastalking.com/version1/messaging/whatsapp", {
      method: "POST",
      headers: {
        apiKey: API_KEY,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: USERNAME,
        to: phone,
        message,
      }),
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, "WhatsApp send failed");
    }
  } catch (err) {
    logger.error({ err }, "WhatsApp send error");
  }
}

export async function sendBookingConfirmation(data: BookingConfirmation): Promise<void> {
  const time = data.validFrom.toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const message = [
    `✅ *Booking Confirmed — Soko Moto*`,
    ``,
    `Hi ${data.guestName}!`,
    ``,
    `📍 *${data.venueName}*`,
    `🍽️ ${data.dealTitle}`,
    `👥 ${data.covers} cover${data.covers > 1 ? "s" : ""}`,
    `💰 KES ${data.totalPaid.toLocaleString()} paid`,
    `📅 ${time}`,
    ``,
    `*Ref:* \`${data.bookingReference}\``,
    ``,
    `Show this message at the venue. Enjoy! 🎉`,
  ].join("\n");

  await sendWhatsApp(data.phone, message);
}

export async function sendDealAlert(data: DealAlert): Promise<void> {
  const message = [
    `🔥 *Flash Deal Alert — Soko Moto*`,
    ``,
    `Hi ${data.guestName}!`,
    ``,
    `📍 *${data.venueName}*`,
    `💥 *${data.dealTitle}*`,
    `🏷️ ${data.discountPercent}% OFF — KES ${data.dealPrice.toLocaleString()}`,
    `⏰ Only ${data.slotsLeft} slot${data.slotsLeft !== 1 ? "s" : ""} left!`,
    ``,
    `Book now before it sells out:`,
    `👉 ${process.env.REPLIT_DEV_DOMAIN ?? "https://sokomoto.co.ke"}/deals/${data.dealId}`,
  ].join("\n");

  await sendWhatsApp(data.phone, message);
}
