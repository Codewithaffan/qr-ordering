import { createHandler, readJson } from "@/middleware/routeHandler";
import { getRestaurant, updateRestaurant } from "@/services/restaurantService";

export const GET = createHandler(({ admin }) => getRestaurant(admin.restaurantId), { auth: true });

export const PUT = createHandler(
  async ({ request, admin }) => updateRestaurant(admin.restaurantId, await readJson(request)),
  { auth: true }
);
export const PATCH = PUT;
