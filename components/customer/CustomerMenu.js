"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loading from "@/components/ui/Loading";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import ProductCard from "./ProductCard";
import CartSheet from "./CartSheet";
import useFetch from "@/hooks/useFetch";
import useCart from "@/hooks/useCart";
import { api } from "@/lib/apiClient";
import { calculateTotals, toMinor } from "@/utils/money";
import { formatMoney } from "@/utils/format";

export default function CustomerMenu({ tableParam }) {
  const router = useRouter();
  const { data, loading, error, reload } = useFetch(`/api/menu/${encodeURIComponent(tableParam)}`);
  const [activeCat, setActiveCat] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const allProducts = useMemo(() => data?.categories.flatMap((c) => c.products) || [], [data]);
  const cart = useCart(`qr-cart:${tableParam}`, allProducts);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`qr-last-order:${tableParam}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage after mount (SSR-safe)
      if (raw) setLastOrder(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [tableParam]);

  if (loading) return <Loading label="Loading menu..." />;
  if (error) return <div className="mx-auto max-w-md"><ErrorState message={error.message} onRetry={error.status === 404 || error.status === 403 ? undefined : () => reload()} /></div>;

  const { restaurant, table, categories } = data;
  const currency = restaurant.settings.currency;
  const visible = activeCat === "all" ? categories : categories.filter((c) => c._id === activeCat);
  const subtotal = calculateTotals(cart.lines.map((l) => toMinor(l.product.price) * l.quantity)).subtotal;

  async function placeOrder(form) {
    try {
      const order = await api.post("/api/orders", {
        tableId: table._id,
        items: cart.lines.map((l) => ({ productId: l.product._id, quantity: l.quantity })),
        ...form,
      });
      try {
        localStorage.setItem(`qr-last-order:${tableParam}`, JSON.stringify({ id: order._id, orderNumber: order.orderNumber }));
      } catch { /* ignore */ }
      cart.clear();
      router.push(`/order/${order._id}`);
    } catch (err) {
      if (err.status === 400 || err.status === 409) reload({ silent: true }); // menu changed: refresh availability
      throw err;
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-cream pb-28">
      <header className="border-b border-line bg-white px-4 pb-3 pt-5">
        <div className="flex items-center gap-3">
          {restaurant.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurant.logo} alt="" className="h-11 w-11 rounded-full border border-line object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold uppercase tracking-wide text-ink">{restaurant.name}</h1>
            {restaurant.address && <p className="truncate text-xs text-muted">{restaurant.address}</p>}
          </div>
          <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">Table {table.tableNumber}</span>
        </div>
      </header>

      {categories.length > 0 && (
        <nav className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-3" aria-label="Menu categories">
          {[{ _id: "all", name: "All" }, ...categories].map((c) => (
            <button
              key={c._id}
              onClick={() => setActiveCat(c._id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCat === c._id ? "bg-primary text-white" : "border border-line bg-white text-ink hover:bg-primary-soft"
              }`}
            >
              {c.name}
            </button>
          ))}
        </nav>
      )}

      {lastOrder && (
        <Link href={`/order/${lastOrder.id}`} className="mx-4 mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm font-medium text-primary-dark">
          <span>Track your order #{lastOrder.orderNumber}</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <main className="space-y-6 px-4 py-4">
        {categories.length === 0 ? (
          <EmptyState title="No products available" description="The menu is being updated. Please check back shortly or ask our staff." />
        ) : (
          visible.map((category) => (
            <section key={category._id}>
              <h2 className="mb-3 text-lg font-bold text-ink">{category.name}</h2>
              <div className="space-y-3">
                {category.products.map((p) => (
                  <ProductCard key={p._id} product={p} currency={currency} quantity={cart.items[p._id] || 0} onChange={cart.setQty} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{cart.count} item{cart.count === 1 ? "" : "s"}</p>
              <p className="text-lg font-bold text-ink">{formatMoney(subtotal, currency)}</p>
            </div>
            <button onClick={() => setCartOpen(true)} className="h-12 rounded-xl bg-primary px-8 font-semibold text-white transition-colors hover:bg-primary-dark">
              View Cart
            </button>
          </div>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cart.lines}
        restaurant={restaurant}
        maxQty={cart.maxQty}
        onQtyChange={cart.setQty}
        onPlaceOrder={placeOrder}
      />
    </div>
  );
}
