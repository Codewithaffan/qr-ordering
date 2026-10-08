"use client";
import { useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import ErrorState from "@/components/ui/ErrorState";
import useFetch from "@/hooks/useFetch";
import useSocketEvent from "@/hooks/useSocketEvent";
import { getSocket } from "@/lib/socketClient";
import { formatMoney } from "@/utils/format";

const STEPS = [
  { status: "NEW", label: "Order Received" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready" },
  { status: "COMPLETED", label: "Completed" },
];

const MESSAGES = {
  NEW: "Your order has been received.",
  ACCEPTED: "The kitchen has accepted your order.",
  PREPARING: "Your food is being prepared.",
  READY: "Your order is ready!",
  COMPLETED: "Enjoy your meal. Thank you!",
  CANCELLED: "This order was cancelled. Please speak to a member of staff.",
};

export default function OrderTracker({ orderId }) {
  const { data: order, setData, loading, error, reload } = useFetch(`/api/orders/${orderId}`);

  // Join this order's private room; re-join + re-sync whenever the socket (re)connects.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const join = () => {
      socket.emit("join-order", orderId);
      reload({ silent: true });
    };
    socket.on("connect", join);
    if (socket.connected) join();
    return () => socket.off("connect", join);
  }, [orderId, reload]);

  useSocketEvent("order-status-changed", (p) => {
    if (p.orderId !== orderId) return;
    setData((o) => (o ? { ...o, status: p.status, paymentStatus: p.paymentStatus, updatedAt: p.updatedAt } : o));
  });

  useEffect(() => {
    if (order && ["COMPLETED", "CANCELLED"].includes(order.status)) {
      try { localStorage.removeItem(`qr-last-order:${order.tableId}`); } catch { /* ignore */ }
    }
  }, [order]);

  if (loading) return <Loading label="Loading your order..." />;
  if (error) return <div className="mx-auto max-w-md"><ErrorState message={error.message} onRetry={() => reload()} /></div>;

  const currency = order.restaurant?.currency || "INR";
  const cancelled = order.status === "CANCELLED";
  const current = STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <div className="text-center">
        {order.restaurant?.name && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{order.restaurant.name}</p>}
        <h1 className="mt-1 text-2xl font-extrabold text-ink">Order #{order.orderNumber}</h1>
        <p className="text-muted">Table {order.tableNumber}</p>
      </div>

      <Card>
        <p className={`mb-4 text-center font-semibold ${cancelled ? "text-red-700" : "text-ink"}`} aria-live="polite">{MESSAGES[order.status]}</p>
        {!cancelled && (
          <ol className="space-y-3">
            {STEPS.map((step, i) => {
              const done = i <= current;
              return (
                <li key={step.status} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-primary text-white" : "border-2 border-line text-transparent"}`}>
                    {done ? "✓" : "○"}
                  </span>
                  <span className={`${i === current ? "font-bold text-ink" : done ? "text-ink" : "text-muted"}`}>{step.label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-ink">Your items</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={`${i.productId}-${i.name}`} className="flex justify-between gap-3">
              <span className="text-ink">{i.quantity} × {i.name}</span>
              <span className="text-muted">{formatMoney(i.subtotal, currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(order.subtotal, currency)}</dd></div>
          {order.taxAmount > 0 && <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>{formatMoney(order.taxAmount, currency)}</dd></div>}
          {order.serviceCharge > 0 && <div className="flex justify-between"><dt className="text-muted">Service charge</dt><dd>{formatMoney(order.serviceCharge, currency)}</dd></div>}
          <div className="flex justify-between text-base font-bold text-ink"><dt>Total</dt><dd>{formatMoney(order.totalAmount, currency)}</dd></div>
        </dl>
      </Card>

      <Link href={`/table/${order.tableId}`} className="block rounded-xl border border-line bg-white py-3 text-center text-sm font-medium text-ink hover:bg-primary-soft">
        Order something else
      </Link>
    </div>
  );
}
