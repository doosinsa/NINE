import { fail, ok } from "@/lib/server/api";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!body?.password) {
    return fail("BAD_REQUEST", "Password is required.");
  }

  return ok({
    authenticated: true,
    mode: "contract-only",
    note: "Replace this placeholder with env hash verification before deployment.",
  });
}
