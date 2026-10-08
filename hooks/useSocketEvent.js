"use client";
import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socketClient";

/** Subscribe to a Socket.IO event for the lifetime of the component. */
export default function useSocketEvent(event, handler) {
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const listener = (...args) => saved.current?.(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
}
