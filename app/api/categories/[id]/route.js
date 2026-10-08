import { createHandler, readJson } from "@/middleware/routeHandler";
import { deleteCategory, updateCategory } from "@/services/categoryService";

export const PATCH = createHandler(
  async ({ request, admin, params }) => updateCategory(admin.restaurantId, params.id, await readJson(request)),
  { auth: true }
);
export const PUT = PATCH;

export const DELETE = createHandler(({ admin, params }) => deleteCategory(admin.restaurantId, params.id), { auth: true });
