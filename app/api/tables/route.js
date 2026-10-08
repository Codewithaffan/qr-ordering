import { createHandler, readJson } from "@/middleware/routeHandler";
import { createTable, listTables } from "@/services/tableService";
import { created } from "@/utils/apiResponse";

export const GET = createHandler(({ admin }) => listTables(admin.restaurantId), { auth: true });

export const POST = createHandler(
  async ({ request, admin }) => created(await createTable(admin.restaurantId, await readJson(request))),
  { auth: true }
);
