import { fail, ok } from "@/lib/server/api";
import { createExternalProviders, getProviderMode } from "@/lib/server/providers";
import { insertNotificationEventInSupabase } from "@/lib/server/supabase";
import type { AlertTier, NotificationDispatchRequest, NotificationDispatchResponse } from "@/types/contracts";

const alertTiers = new Set<AlertTier>(["tier_1", "tier_2", "tier_3"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<NotificationDispatchRequest> | null;
  const tier = body?.tier;
  const to = body?.to?.trim();
  const messageBody = body?.body?.trim();
  const ticker = body?.ticker?.trim().toUpperCase() || null;

  if (!tier || !alertTiers.has(tier) || !to || !messageBody) {
    return fail("BAD_REQUEST", "tier, to, and body are required. tier must be tier_1, tier_2, or tier_3.");
  }

  try {
    const providers = createExternalProviders();
    const result = await providers.notifications.send({
      tier,
      to,
      body: messageBody,
    });
    const eventId = await insertNotificationEventInSupabase({
      tier,
      ticker,
      message: messageBody,
      sent: result.sent,
    });

    const response: NotificationDispatchResponse = {
      tier,
      ticker,
      sent: result.sent,
      providerMessageId: result.providerMessageId,
      persisted: eventId !== null,
      eventId,
      providerMode: getProviderMode(),
    };

    return ok(response);
  } catch (error) {
    console.error(error);
    return fail("SERVER_ERROR", "Failed to dispatch notification.", 500);
  }
}
