import { ok } from "@/lib/server/api";
import { getCandidates } from "@/lib/server/mock-data";
import { fetchCandidatesFromSupabase } from "@/lib/server/supabase";
import type { CandidatesResponse } from "@/types/contracts";

export async function GET() {
  const candidates = (await fetchCandidatesFromSupabase()) ?? getCandidates();
  const response: CandidatesResponse = {
    generatedAt: new Date().toISOString(),
    nextRefreshAt: "2026-05-10T12:00:00.000Z",
    total: candidates.length,
    candidates,
  };

  return ok(response);
}
