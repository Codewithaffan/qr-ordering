import { createHandler, readJson } from "@/middleware/routeHandler";
import { createCategory, listCategories } from "@/services/categoryService";
import { created } from "@/utils/apiResponse";

export const GET = createHandler(({ admin }) => listCategories(admin.restaurantId), { auth: true });

export const POST = createHandler(
  async ({ request, admin }) => created(await createCategory(admin.restaurantId, await readJson(request))),
  { auth: true }
);
