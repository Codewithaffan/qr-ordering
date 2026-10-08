import { createHandler } from "@/middleware/routeHandler";
import { getPublicOrder } from "@/services/orderService";

// PUBLIC: order tracking page. Returns a customer-safe view (no phone number).
export const GET = createHandler(({ params }) => getPublicOrder(params.id), {
  rateLimit: { name: "get-order", limit: 120, windowMs: 60 * 1000 },
});
