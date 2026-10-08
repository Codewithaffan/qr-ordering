import { createHandler, readJson } from "@/middleware/routeHandler";
import { getRestaurant, updateRestaurant } from "@/services/restaurantService";
import { assertObjectId } from "@/utils/validators";
import { ForbiddenError } from "@/utils/errors";

function assertOwnRestaurant(admin, id) {
  assertObjectId(id, "restaurantId");
  if (id !== admin.restaurantId) throw new ForbiddenError();
}

export const GET = createHandler(
  async ({ admin, params }) => {
    assertOwnRestaurant(admin, params.id);
    return getRestaurant(params.id);
  },
  { auth: true }
);

export const PATCH = createHandler(
  async ({ request, admin, params }) => {
    assertOwnRestaurant(admin, params.id);
    return updateRestaurant(params.id, await readJson(request));
  },
  { auth: true }
);
export const PUT = PATCH;
