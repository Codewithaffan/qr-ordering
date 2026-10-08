"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { AdminProvider } from "./AdminContext";
import Navbar from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/apiClient";
import { getSocket } from "@/lib/socketClient";
import useSocketEvent from "@/hooks/useSocketEvent";
import { playBeep } from "@/utils/beep";
import { formatMoney } from "@/utils/format";

export default function AdminShell({ admin, restaurant, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [newOrders, setNewOrders] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // One shared socket connection for the whole admin panel (authenticated by the session cookie).
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with the external socket state on mount
    setConnected(socket.connected);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // Global alert for new orders, whichever admin page is open.
  useSocketEvent("new-order", (order) => {
    playBeep();
    toast.show(`Table ${order.tableNumber} · ${formatMoney(order.totalAmount, restaurant.currency)}`, {
      type: "info",
      title: `New order ${order.orderNumber}`,
      duration: 8000,
    });
    if (!pathname.startsWith("/admin/orders")) setNewOrders((n) => n + 1);
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset UI state when the route changes
    if (pathname.startsWith("/admin/orders")) setNewOrders(0);
    setMenuOpen(false);
  }, [pathname]);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await api.post("/api/auth/logout");
      router.replace("/admin/login");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
      setLoggingOut(false);
    }
  }, [router, toast]);

  const ctx = useMemo(() => ({ admin, restaurant, connected }), [admin, restaurant, connected]);

  return (
    <AdminProvider value={ctx}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-line lg:block">
          <Sidebar restaurantName={restaurant.name} newOrders={newOrders} onLogout={logout} loggingOut={loggingOut} />
        </aside>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">
              <Sidebar restaurantName={restaurant.name} newOrders={newOrders} onNavigate={() => setMenuOpen(false)} onLogout={logout} loggingOut={loggingOut} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
          <Navbar
            left={
              <button onClick={() => setMenuOpen(true)} className="-ml-1 rounded-md p-2 text-ink hover:bg-cream lg:hidden" aria-label="Open menu">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 5h14M3 10h14M3 15h14" />
                </svg>
              </button>
            }
            title={restaurant.name}
            right={
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted" title={connected ? "Receiving orders in real time" : "Reconnecting..."}>
                  <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-300"}`} />
                  {connected ? "Live" : "Offline"}
                </span>
                <span className="hidden text-muted sm:inline">{admin.name}</span>
              </div>
            }
          />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AdminProvider>
  );
}
