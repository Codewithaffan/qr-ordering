import { createHandler } from "@/middleware/routeHandler";
import { getDashboardStats } from "@/services/dashboardService";

export const GET = createHandler(({ admin }) => getDashboardStats(admin.restaurantId), { auth: true });
