// Server-side emit helpers used by services. The Socket.IO instance is created in
// server.js and stored on globalThis so Next.js route handlers (which are bundled
// separately) can reach the same instance.
import { SOCKET_EVENTS, adminRoom, orderRoom } from "../utils/constants.js";

export function getIO() {
  return globalThis.__socketIO || null;
}

function safeEmit(room, event, payload) {
  const io = getIO();
  if (!io) {
    console.warn(`[socket] io not available, "${event}" not emitted. Start the app with "npm run dev" (server.js).`);
    return false;
  }
  io.to(room).emit(event, payload);
  return true;
}

export function emitNewOrder(restaurantId, order) {
  return safeEmit(adminRoom(restaurantId), SOCKET_EVENTS.NEW_ORDER, order);
}

export function emitOrderUpdated(restaurantId, order) {
  return safeEmit(adminRoom(restaurantId), SOCKET_EVENTS.ORDER_UPDATED, order);
}

/** Notifies admins AND the customer who is watching this specific order. */
export function emitOrderStatusChanged(restaurantId, orderId, payload) {
  const a = safeEmit(adminRoom(restaurantId), SOCKET_EVENTS.ORDER_STATUS_CHANGED, payload);
  const c = safeEmit(orderRoom(orderId), SOCKET_EVENTS.ORDER_STATUS_CHANGED, payload);
  return a && c;
}
