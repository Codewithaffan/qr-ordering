import { createHandler, readJson } from "@/middleware/routeHandler";
import { deleteTable, updateTable } from "@/services/tableService";

export const PATCH = createHandler(
  async ({ request, admin, params }) => updateTable(admin.restaurantId, params.id, await readJson(request)),
  { auth: true }
);
export const PUT = PATCH;

export const DELETE = createHandler(({ admin, params }) => deleteTable(admin.restaurantId, params.id), { auth: true });
