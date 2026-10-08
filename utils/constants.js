export const ORDER_STATUS = {
  NEW: "NEW",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  READY: "READY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const ORDER_STATUSES = Object.values(ORDER_STATUS);

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];

/** Allowed forward transitions. Anything else is rejected with 409. */
export const STATUS_TRANSITIONS = {
  NEW: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/** Orders still being worked on (counted as "pending" on the dashboard). */
export const ACTIVE_STATUSES = ["NEW", "ACCEPTED", "PREPARING", "READY"];

/** Revenue business rule: only COMPLETED orders count (CANCELLED never does). */
export const REVENUE_STATUSES = ["COMPLETED"];

/** Socket.IO events + room helpers (shared by server.js, services and browser code). */
export const SOCKET_EVENTS = {
  NEW_ORDER: "new-order",
  ORDER_UPDATED: "order-updated",
  ORDER_STATUS_CHANGED: "order-status-changed",
  JOIN_ORDER: "join-order",
};

export const adminRoom = (restaurantId) => `admin:${restaurantId}`;
export const orderRoom = (orderId) => `order:${orderId}`;
