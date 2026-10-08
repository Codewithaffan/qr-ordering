import mongoose from "mongoose";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import { ACTIVE_STATUSES, REVENUE_STATUSES } from "@/utils/constants";
import { fromMinor, toMinor } from "@/utils/money";
import { APP_TIMEZONE, startOfMonth, startOfToday } from "@/utils/time";

/**
 * Business rules (also documented in README):
 *  - Revenue      = sum(totalAmount) of orders with status COMPLETED, bucketed by completedAt.
 *                   CANCELLED (and any order still in progress) never counts.
 *  - Today/Month  = calendar day / month in APP_TIMEZONE (default Asia/Kolkata).
 *  - Today's orders = orders created today that were not cancelled.
 *  - Pending orders = orders still being worked on: NEW, ACCEPTED, PREPARING, READY (any date).
 */
export async function getDashboardStats(restaurantId) {
  const rid = new mongoose.Types.ObjectId(restaurantId); // aggregate() does not auto-cast ids
  const todayStart = startOfToday();
  const monthStart = startOfMonth();

  const revenuePipeline = (from) => [
    { $match: { restaurantId: rid, status: { $in: REVENUE_STATUSES }, completedAt: { $gte: from } } },
    { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
  ];

  const [todayAgg, monthAgg, todayOrders, pendingOrders, restaurant] = await Promise.all([
    Order.aggregate(revenuePipeline(todayStart)),
    Order.aggregate(revenuePipeline(monthStart)),
    Order.countDocuments({ restaurantId: rid, createdAt: { $gte: todayStart }, status: { $ne: "CANCELLED" } }),
    Order.countDocuments({ restaurantId: rid, status: { $in: ACTIVE_STATUSES } }),
    Restaurant.findById(rid).select("settings").lean(),
  ]);

  const round = (v) => fromMinor(toMinor(v || 0));

  return {
    todayRevenue: round(todayAgg[0]?.revenue),
    monthRevenue: round(monthAgg[0]?.revenue),
    todayOrders,
    pendingOrders,
    currency: restaurant?.settings?.currency || "INR",
    timezone: APP_TIMEZONE(),
    generatedAt: new Date().toISOString(),
  };
}
