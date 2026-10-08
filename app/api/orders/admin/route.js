import { createHandler } from "@/middleware/routeHandler";
import { listAdminOrders } from "@/services/orderService";

// ADMIN: GET /api/orders/admin?status=NEW|ACCEPTED|...|ACTIVE&page=1&limit=50
export const GET = createHandler(
  ({ request, admin }) => {
    const sp = new URL(request.url).searchParams;
    return listAdminOrders(admin.restaurantId, {
      status: sp.get("status") || undefined,
      page: sp.get("page"),
      limit: sp.get("limit"),
    });
  },
  { auth: true }
);
