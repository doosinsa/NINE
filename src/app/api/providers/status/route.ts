import { ok } from "@/lib/server/api";
import { getProviderMode, getProviderStatuses } from "@/lib/server/providers";
import type { ProviderStatusResponse } from "@/types/contracts";

export async function GET() {
  const response: ProviderStatusResponse = {
    providerMode: getProviderMode(),
    statuses: getProviderStatuses(),
  };

  return ok(response);
}
