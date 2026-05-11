import { fail, ok } from "@/lib/server/api";
import { createSessionCookie, verifyPassword } from "@/lib/server/auth";
import type { LoginRequest, LoginResponse } from "@/types/contracts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginRequest | null;

  if (!body?.password) {
    return fail("BAD_REQUEST", "Password is required.");
  }

  try {
    if (!verifyPassword(body.password)) {
      return fail("UNAUTHORIZED", "Password is invalid.", 401);
    }

    const sessionCookie = createSessionCookie();
    const response = ok<LoginResponse>({ authenticated: true });
    response.cookies.set(sessionCookie.name, sessionCookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionCookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error(error);
    return fail("SERVER_ERROR", "Authentication is not configured.", 500);
  }
}
