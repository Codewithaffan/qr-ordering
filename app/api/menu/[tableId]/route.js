import { createHandler } from "@/middleware/routeHandler";
import { getMenuForTable } from "@/services/menuService";

// PUBLIC: customers scanning a QR code. Returns only customer-safe menu data.
export const GET = createHandler(({ params }) => getMenuForTable(params.tableId), {
  rateLimit: { name: "menu", limit: 120, windowMs: 60 * 1000 },
});
