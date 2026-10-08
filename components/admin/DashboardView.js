"use client";
import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import StatCard from "./StatCard";
import OrderCard from "./OrderCard";
import { useAdmin } from "./AdminContext";
import { upsertOrder } from "./orderFlow";
import useFetch from "@/hooks/useFetch";
import useSocketEvent from "@/hooks/useSocketEvent";
import useOrderStatus from "@/hooks/useOrderStatus";
import { formatMoney, formatTime } from "@/utils/format";

export default function DashboardView() {
  const { restaurant } = useAdmin();
  const stats = useFetch("/api/dashboard/stats");
  const recent = useFetch("/api/orders/admin?limit=10");
  const fresh = useFetch("/api/orders/admin?status=NEW&limit=20");

  const statsReload = stats.reload;
  const recentSet = recent.setData;
  const freshSet = fresh.setData;
  const recentReload = recent.reload;
  const freshReload = fresh.reload;

  // Debounced silent refresh of the aggregated numbers (server-side aggregation is the source of truth).
  const timer = useRef(null);
  const refreshStats = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => statsReload({ silent: true }), 250);
  }, [statsReload]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const applyOrder = useCallback(
    (order, { isNewOrder = false } = {}) => {
      recentSet((d) => (d ? { ...d, orders: upsertOrder(d.orders, order, { insert: isNewOrder, limit: 10 }) } : d));
      freshSet((d) => {
        if (!d) return d;
        const without = d.orders.filter((o) => o._id !== order._id);
        return { ...d, orders: order.status === "NEW" ? upsertOrder(d.orders, order, { insert: true, limit: 20 }) : without };
      });
      refreshStats();
    },
    [recentSet, freshSet, refreshStats]
  );

  // Real time: no page refresh needed.
  useSocketEvent("new-order", (order) => applyOrder(order, { isNewOrder: true }));
  useSocketEvent("order-updated", (order) => applyOrder(order));
  // After a dropped connection, re-sync so nothing is missed.
  useSocketEvent("connect", () => {
    statsReload({ silent: true });
    recentReload({ silent: true });
    freshReload({ silent: true });
  });

  const { busyId, changeStatus } = useOrderStatus(applyOrder);

  if (stats.loading || recent.loading || fresh.loading) return <Loading />;
  const failure = stats.error || recent.error || fresh.error;
  if (failure) {
    return (
      <ErrorState
        message={failure.message}
        onRetry={() => { stats.reload(); recent.reload(); fresh.reload(); }}
      />
    );
  }

  const s = stats.data;
  const currency = s.currency || restaurant.currency;
  const newOrders = fresh.data.orders;
  const recentOrders = recent.data.orders;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-muted">Revenue counts completed orders only.</p>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={formatMoney(s.todayRevenue, currency)} tone="highlight" />
        <StatCard label="This Month" value={formatMoney(s.monthRevenue, currency)} />
        <StatCard label="Today's Orders" value={s.todayOrders} hint="Excludes cancelled" />
        <StatCard label="Pending Orders" value={s.pendingOrders} hint="New, accepted, preparing, ready" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            New orders {newOrders.length > 0 && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{newOrders.length}</span>}
          </h2>
        </div>
        {newOrders.length === 0 ? (
          <Card><EmptyState icon="🔔" title="No new orders" description="New orders appear here the moment a customer places them." /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {newOrders.map((order) => (
              <OrderCard key={order._id} order={order} currency={currency} busy={busyId === order._id} onChange={changeStatus} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:text-primary-dark">View all →</Link>
        </div>
        <Card padded={false}>
          {recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders will show up here as soon as customers start ordering." />
          ) : (
            <Table>
              <THead>
                <tr><TH>Order</TH><TH>Table</TH><TH>Amount</TH><TH>Status</TH><TH>Time</TH></tr>
              </THead>
              <TBody>
                {recentOrders.map((o) => (
                  <TR key={o._id}>
                    <TD className="font-semibold">{o.orderNumber}</TD>
                    <TD>Table {o.tableNumber}</TD>
                    <TD>{formatMoney(o.totalAmount, currency)}</TD>
                    <TD><OrderStatusBadge status={o.status} /></TD>
                    <TD className="text-muted">{formatTime(o.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </section>
    </div>
  );
}
