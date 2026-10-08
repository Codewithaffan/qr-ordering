import { createHandler } from "@/middleware/routeHandler";
import { getRestaurant } from "@/services/restaurantService";

export const GET = createHandler(
  async ({ admin }) => ({ admin, restaurant: await getRestaurant(admin.restaurantId) }),
  { auth: true }
);
