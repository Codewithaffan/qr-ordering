import { createHandler, readJson } from "@/middleware/routeHandler";
import { createOrder } from "@/services/orderService";
import { created } from "@/utils/apiResponse";

// PUBLIC: customers place orders. Prices and totals are always computed server-side.
export const POST = createHandler(async ({ request }) => created(await createOrder(await readJson(request))), {
  rateLimit: { name: "create-order", limit: 15, windowMs: 10 * 60 * 1000 },
});
