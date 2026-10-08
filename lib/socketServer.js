// Creates the Socket.IO server and attaches it to the HTTP server (called from server.js).
import { Server } from "socket.io";
import { AUTH_COOKIE, verifyAdminToken } from "./token.js";
import { SOCKET_EVENTS, adminRoom, orderRoom } from "../utils/constants.js";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function createSocketServer(httpServer) {
  const origins = [process.env.SOCKET_URL, process.env.NEXT_PUBLIC_APP_URL].filter(Boolean);

  const io = new Server(httpServer, {
    cors: { origin: origins.length ? origins : false, credentials: true },
    // Let Next.js own every other upgrade (e.g. dev HMR) instead of destroying it.
    destroyUpgrade: false,
  });

  io.on("connection", async (socket) => {
    // 1) Admins: authenticated via the same HTTP-only cookie used by the web app.
    try {
      const token = parseCookies(socket.handshake.headers.cookie)[AUTH_COOKIE];
      const session = await verifyAdminToken(token);
      if (session?.restaurantId) {
        socket.join(adminRoom(session.restaurantId));
        socket.data.isAdmin = true;
      }
    } catch (err) {
      console.error("[socket] admin auth failed:", err.message);
    }

    // 2) Customers: may only listen to the single order they are tracking.
    socket.on(SOCKET_EVENTS.JOIN_ORDER, (orderId) => {
      if (typeof orderId === "string" && OBJECT_ID_RE.test(orderId)) {
        socket.join(orderRoom(orderId));
      }
    });
  });

  globalThis.__socketIO = io;
  return io;
}
