import { createHandler, readJson } from "@/middleware/routeHandler";
import { updateOrderStatus } from "@/services/orderService";

export const PATCH = createHandler(
  async ({ request, admin, params }) => updateOrderStatus(admin.restaurantId, params.id, await readJson(request)),
  { auth: true }
);
