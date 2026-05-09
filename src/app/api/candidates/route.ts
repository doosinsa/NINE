import { ok } from "@/lib/server/api";
import { getCandidates } from "@/lib/server/mock-data";
import type { CandidatesResponse } from "@/types/contracts";

export async function GET() {
  const candidates = getCandidates();
  const response: CandidatesResponse = {
    generatedAt: "2026-05-09T12:00:00.000Z",
    nextRefreshAt: "2026-05-10T12:00:00.000Z",
    total: candidates.length,
    candidates,
  };

  return ok(response);
}
