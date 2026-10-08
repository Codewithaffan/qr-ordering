import { createHandler } from "@/middleware/routeHandler";
import { clearAuthCookie } from "@/lib/auth";

export const POST = createHandler(async () => {
  await clearAuthCookie();
  return { loggedOut: true };
});
