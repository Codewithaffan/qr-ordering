"use client";
import { io } from "socket.io-client";

let socket = null;

/** One shared browser connection. Same-origin by default (server.js hosts both). */
export function getSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
    socket = io(url, { withCredentials: true, transports: ["websocket", "polling"] });
  }
  return socket;
}
