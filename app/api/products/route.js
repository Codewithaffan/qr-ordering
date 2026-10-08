import { createHandler, readJson } from "@/middleware/routeHandler";
import { createProduct, listProducts } from "@/services/productService";
import { created } from "@/utils/apiResponse";

export const GET = createHandler(
  ({ request, admin }) => {
    const categoryId = new URL(request.url).searchParams.get("categoryId") || undefined;
    return listProducts(admin.restaurantId, { categoryId });
  },
  { auth: true }
);

export const POST = createHandler(
  async ({ request, admin }) => created(await createProduct(admin.restaurantId, await readJson(request))),
  { auth: true }
);
