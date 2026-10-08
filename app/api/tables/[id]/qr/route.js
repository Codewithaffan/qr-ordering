import { createHandler } from "@/middleware/routeHandler";
import { getTableQrPng } from "@/services/tableService";

// GET /api/tables/:id/qr            -> PNG (for <img src>)
// GET /api/tables/:id/qr?download=1 -> PNG as a file download
export const GET = createHandler(
  async ({ request, admin, params }) => {
    const search = new URL(request.url).searchParams;
    const width = parseInt(search.get("size"), 10) || 640;
    const { png, tableNumber } = await getTableQrPng(admin.restaurantId, params.id, { width });

    const headers = { "Content-Type": "image/png", "Cache-Control": "private, max-age=60" };
    if (search.get("download")) {
      headers["Content-Disposition"] = `attachment; filename="table-${tableNumber}-qr.png"`;
    }
    return new Response(png, { status: 200, headers });
  },
  { auth: true }
);
