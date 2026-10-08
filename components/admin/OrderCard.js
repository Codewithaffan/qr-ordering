"use client";
import Card from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/ui/Badge";
import OrderActions from "./OrderActions";
import { formatMoney, formatTime } from "@/utils/format";

/** Rich order card: used for "New orders" on the dashboard. */
export default function OrderCard({ order, currency, busy, onChange }) {
  const isNew = order.status === "NEW";
  return (
    <Card className={isNew ? "border-primary/60 ring-1 ring-primary/30" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {isNew && <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">New order</p>}
          <p className="text-lg font-bold text-ink">Order #{order.orderNumber}</p>
          <p className="text-sm text-muted">
            Table {order.tableNumber} · {formatTime(order.createdAt)}
            {order.customerName ? ` · ${order.customerName}` : ""}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="my-4 space-y-1 text-sm text-ink">
        {order.items.map((item) => (
          <li key={`${item.productId}-${item.name}`} className="flex gap-2">
            <span className="w-8 shrink-0 font-semibold text-primary-dark">{item.quantity} ×</span>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>

      {order.customerNote && (
        <p className="mb-4 rounded-lg bg-cream px-3 py-2 text-sm text-ink">
          <span className="font-semibold">Note:</span> {order.customerNote}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xl font-bold text-ink">{formatMoney(order.totalAmount, currency)}</p>
        <OrderActions order={order} busy={busy} onChange={onChange} size="md" />
      </div>
    </Card>
  );
}
