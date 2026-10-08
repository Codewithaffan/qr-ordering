import { cookies } from "next/headers";
import { AUTH_COOKIE, SESSION_SECONDS } from "./token.js";

function cookieOptions() {
  const secure = (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https://");
  return { httpOnly: true, sameSite: "lax", secure, path: "/" };
}

export async function setAuthCookie(token) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_SECONDS });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.set(AUTH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function getAuthToken() {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value || null;
}
