import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import type { NotificationProvider } from "@/lib/server/providers/types";

type SolapiMessageType = "SMS" | "LMS";

type SolapiSendResponse = {
  groupInfo?: {
    groupId?: string;
    status?: string;
    count?: {
      registeredFailed?: number;
      registeredSuccess?: number;
    };
  };
  messageList?: Array<{
    messageId?: string;
    statusCode?: string;
    statusMessage?: string;
  }>;
  failedMessageList?: Array<{
    messageId?: string;
    statusCode?: string;
    statusMessage?: string;
  }>;
};

export function createSolapiNotificationProvider(): NotificationProvider {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SOLAPI_SENDER;

  if (!apiKey || !apiSecret || !sender) {
    throw new Error("SOLAPI_API_KEY, SOLAPI_API_SECRET, and SOLAPI_SENDER are required for Solapi notifications.");
  }

  const baseUrl = process.env.SOLAPI_BASE_URL ?? "https://api.solapi.com";
  const messageType = toMessageType(process.env.SOLAPI_MESSAGE_TYPE);
  const country = process.env.SOLAPI_COUNTRY ?? "82";

  return {
    async send(message) {
      const response = await fetch(new URL("/messages/v4/send-many/detail", baseUrl), {
        method: "POST",
        headers: {
          Authorization: createAuthorizationHeader({ apiKey, apiSecret }),
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          messages: [
            {
              to: normalizePhoneNumber(message.to),
              from: normalizePhoneNumber(sender),
              text: message.body,
              type: messageType,
              country,
              autoTypeDetect: false,
              customFields: {
                nineTier: message.tier,
              },
            },
          ],
          strict: false,
          allowDuplicates: false,
          showMessageList: true,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Solapi notification request failed with HTTP ${response.status}.`);
      }

      const body = (await response.json()) as SolapiSendResponse;
      const failedCount = body.groupInfo?.count?.registeredFailed ?? body.failedMessageList?.length ?? 0;
      if (failedCount > 0) {
        const failure = body.failedMessageList?.[0];
        throw new Error(
          `Solapi notification registration failed: ${failure?.statusCode ?? "UNKNOWN"} ${
            failure?.statusMessage ?? "Unknown provider error"
          }`,
        );
      }

      return {
        sent: true,
        providerMessageId: body.messageList?.[0]?.messageId ?? body.groupInfo?.groupId ?? null,
      };
    },
  };
}

function createAuthorizationHeader({ apiKey, apiSecret }: { apiKey: string; apiSecret: string }) {
  const date = new Date().toISOString();
  const salt = randomUUID();
  const signature = createHmac("sha256", apiSecret).update(date + salt).digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

function toMessageType(value: string | undefined): SolapiMessageType {
  return value?.toUpperCase() === "SMS" ? "SMS" : "LMS";
}
