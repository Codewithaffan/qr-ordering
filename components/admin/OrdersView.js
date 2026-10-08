"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import OrderActions from "./OrderActions";
import { useAdmin } from "./AdminContext";
import useFetch from "@/hooks/useFetch";
import useSocketEvent from "@/hooks/useSocketEvent";
import useOrderStatus from "@/hooks/useOrderStatus";
import { formatDateTime, formatMoney } from "@/utils/format";

const FILTERS = [
  { key: "", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "NEW", label: "New" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];
const PAGE_SIZE = 20;

export default function OrdersView() {
  const { restaurant } = useAdmin();
  const [filter, setFilter] = useState("ACTIVE");
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
  if (filter) query.set("status", filter);
  const { data, loading, error, reload } = useFetch(`/api/orders/admin?${query}`);

  // Live updates: re-query silently (keeps filters + pagination correct).
  const timer = useRef(null);
  const refresh = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => reload({ silent: true }), 150);
  }, [reload]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useSocketEvent("new-order", refresh);
  useSocketEvent("order-updated", refresh);
  useSocketEvent("connect", refresh);

  const { busyId, changeStatus } = useOrderStatus(refresh);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <p className="text-sm text-muted">Updates live as orders come in.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key ? "bg-primary text-white" : "border border-line bg-white text-ink hover:bg-primary-soft"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card padded={false}>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => reload()} />
        ) : data.orders.length === 0 ? (
          <EmptyState icon="🧾" title="No orders yet" description={filter ? "No orders match this filter." : "Orders will appear here as soon as customers place them."} />
        ) : (
          <Table>
            <THead>
              <tr><TH>Order</TH><TH>Table</TH><TH>Items</TH><TH>Amount</TH><TH>Status</TH><TH>Created</TH><TH>Actions</TH></tr>
            </THead>
            <TBody>
              {data.orders.map((o) => (
                <TR key={o._id}>
                  <TD className="font-semibold">{o.orderNumber}</TD>
                  <TD>Table {o.tableNumber}</TD>
                  <TD>
                    <ul className="space-y-0.5">
                      {o.items.map((i) => (
                        <li key={`${i.productId}-${i.name}`}>{i.quantity} × {i.name}</li>
                      ))}
                    </ul>
                    {o.customerNote && <p className="mt-1 text-xs text-muted">Note: {o.customerNote}</p>}
                  </TD>
                  <TD className="whitespace-nowrap">{formatMoney(o.totalAmount, restaurant.currency)}</TD>
                  <TD><OrderStatusBadge status={o.status} /></TD>
                  <TD className="whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</TD>
                  <TD><OrderActions order={o} busy={busyId === o._id} onChange={changeStatus} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
