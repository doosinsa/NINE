import { fail, ok } from "@/lib/server/api";
import { getStockDetail } from "@/lib/server/mock-data";

export async function GET(_request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const detail = getStockDetail(decodeURIComponent(ticker));

  if (!detail) {
    return fail("NOT_FOUND", "Stock was not found in the NINE universe.", 404);
  }

  return ok(detail);
}
