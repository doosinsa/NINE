import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "nine_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SCRYPT_KEY_LENGTH = 32;

type SessionPayload = {
  sub: "nine";
  iat: number;
  exp: number;
};

type PasswordHashConfig = {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
};

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseScryptHash(hash: string): PasswordHashConfig | null {
  const parts = hash.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = base64UrlDecode(parts[4]);
  const key = base64UrlDecode(parts[5]);

  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return null;
  if (n <= 1 || r <= 0 || p <= 0 || salt.length < 16 || key.length < 16) return null;

  return { n, r, p, salt, key };
}

export function verifyPassword(password: string, passwordHash = process.env.NINE_PASSWORD_HASH) {
  if (!passwordHash) {
    throw new Error("NINE_PASSWORD_HASH is not configured.");
  }

  const config = parseScryptHash(passwordHash);
  if (!config) {
    throw new Error("NINE_PASSWORD_HASH must use scrypt:N:r:p:salt:key format.");
  }

  const derivedKey = scryptSync(password, config.salt, config.key.length, {
    N: config.n,
    r: config.r,
    p: config.p,
    maxmem: 64 * 1024 * 1024,
  });

  return safeEqual(derivedKey, config.key);
}

export function createPasswordHash(password: string) {
  const n = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: n,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  });

  return `scrypt:${n}:${r}:${p}:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

export function createSessionCookie(secret = process.env.NINE_SESSION_SECRET) {
  if (!secret) {
    throw new Error("NINE_SESSION_SECRET is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: "nine",
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);

  return {
    name: SESSION_COOKIE_NAME,
    value: `${encodedPayload}.${signature}`,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function verifySessionCookie(cookieValue: string | undefined, secret = process.env.NINE_SESSION_SECRET) {
  if (!cookieValue || !secret) return false;

  const [encodedPayload, signature, extra] = cookieValue.split(".");
  if (!encodedPayload || !signature || extra) return false;

  const expectedSignature = sign(encodedPayload, secret);
  if (!safeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    return payload.sub === "nine" && Number.isInteger(payload.exp) && payload.exp > now;
  } catch {
    return false;
  }
}

export async function isAuthenticatedRequest() {
  const cookieStore = await cookies();
  return verifySessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };
