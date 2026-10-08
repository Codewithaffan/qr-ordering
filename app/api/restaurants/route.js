import { createHandler } from "@/middleware/routeHandler";
import { getRestaurant } from "@/services/restaurantService";

// An admin only ever sees their own restaurant.
// (The original unauthenticated POST was removed: anyone on the internet could create
// restaurants with arbitrary data. Restaurants are created by the seed script for now;
// a super-admin "create restaurant" endpoint can be added when multi-tenant onboarding is built.)
export const GET = createHandler(async ({ admin }) => [await getRestaurant(admin.restaurantId)], { auth: true });
