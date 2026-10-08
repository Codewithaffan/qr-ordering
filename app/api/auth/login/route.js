import { createHandler, readJson } from "@/middleware/routeHandler";
import { login } from "@/services/authService";
import { setAuthCookie } from "@/lib/auth";

// Brute-force protection: 10 attempts / 15 min per IP
export const POST = createHandler(
  async ({ request }) => {
    const { token, admin } = await login(await readJson(request));
    await setAuthCookie(token); // HTTP-only cookie, token is never sent to JS
    return { admin };
  },
  { rateLimit: { name: "login", limit: 10, windowMs: 15 * 60 * 1000 } }
);
