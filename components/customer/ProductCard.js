"use client";
import Badge from "@/components/ui/Badge";
import QtyStepper from "./QtyStepper";
import { formatMoney } from "@/utils/format";

export default function ProductCard({ product, quantity, currency, onChange }) {
  const soldOut = !product.isAvailable;
  return (
    <div className={`flex gap-3 rounded-xl border border-line bg-white p-3 shadow-sm ${soldOut ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{product.name}</h3>
          {product.isFeatured && <Badge tone="orange">★ Popular</Badge>}
        </div>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>}
        <p className="mt-2 font-semibold text-ink">{formatMoney(product.price, currency)}</p>
      </div>

      <div className="flex w-28 shrink-0 flex-col items-center gap-2">
        <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg bg-cream text-3xl">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>🍽️</span>
          )}
        </div>
        {soldOut ? (
          <span className="text-xs font-medium text-red-600">Sold out</span>
        ) : quantity > 0 ? (
          <QtyStepper size="sm" quantity={quantity} onChange={(q) => onChange(product._id, q)} />
        ) : (
          <button
            onClick={() => onChange(product._id, 1)}
            className="h-8 w-full rounded-lg border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}
