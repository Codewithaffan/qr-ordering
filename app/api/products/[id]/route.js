import { createHandler, readJson } from "@/middleware/routeHandler";
import { deleteProduct, getProduct, updateProduct } from "@/services/productService";

export const GET = createHandler(({ admin, params }) => getProduct(admin.restaurantId, params.id), { auth: true });

export const PATCH = createHandler(
  async ({ request, admin, params }) => updateProduct(admin.restaurantId, params.id, await readJson(request)),
  { auth: true }
);
export const PUT = PATCH;

export const DELETE = createHandler(({ admin, params }) => deleteProduct(admin.restaurantId, params.id), { auth: true });
