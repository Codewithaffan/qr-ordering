// Session token helpers. No Next.js imports here so this file can be shared by the
// proxy (edge-safe), API routes and the Socket.IO server in server.js.
import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE = "qr_admin_token";
export const SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short. Set a random value of at least 32 characters in .env.local");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminToken({ adminId, restaurantId, role }) {
  return new SignJWT({ rid: String(restaurantId), role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(adminId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey());
}

/** Returns { adminId, restaurantId, role } or null when the token is missing/invalid/expired. */
export async function verifyAdminToken(token) {
  if (!token) return null;
  const key = secretKey(); // misconfiguration should fail loudly, not look like "logged out"
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (!payload.sub || !payload.rid) return null;
    return { adminId: payload.sub, restaurantId: payload.rid, role: payload.role };
  } catch {
    return null;
  }
}
