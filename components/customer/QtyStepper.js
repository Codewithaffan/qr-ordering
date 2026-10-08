"use client";

export default function QtyStepper({ quantity, onChange, max = 20, size = "md" }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const btn = `${dim} flex items-center justify-center rounded-full border border-primary text-primary text-lg leading-none transition-colors hover:bg-primary-soft disabled:opacity-40`;
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={btn} aria-label="Decrease quantity" onClick={() => onChange(quantity - 1)}>−</button>
      <span className="w-5 text-center text-sm font-semibold text-ink" aria-live="polite">{quantity}</span>
      <button type="button" className={btn} aria-label="Increase quantity" disabled={quantity >= max} onClick={() => onChange(quantity + 1)}>+</button>
    </div>
  );
}
