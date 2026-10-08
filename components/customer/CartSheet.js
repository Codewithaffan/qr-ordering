"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import QtyStepper from "./QtyStepper";
import { calculateTotals, toMinor } from "@/utils/money";
import { formatMoney } from "@/utils/format";

export default function CartSheet({ open, onClose, lines, restaurant, onQtyChange, onPlaceOrder, maxQty }) {
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerNote: "" });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const { currency, taxPercentage, serviceChargePercentage } = restaurant.settings;
  // Display only. The server recalculates everything from database prices when the order is placed.
  const totals = calculateTotals(lines.map((l) => toMinor(l.product.price) * l.quantity), taxPercentage, serviceChargePercentage);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      await onPlaceOrder(form);
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your order"
      footer={
        <Button type="submit" form="checkout-form" size="lg" className="w-full" loading={placing} disabled={lines.length === 0}>
          Place order · {formatMoney(totals.totalAmount, currency)}
        </Button>
      }
    >
      {lines.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Your cart is empty.</p>
      ) : (
        <form id="checkout-form" onSubmit={submit} className="space-y-5">
          <ul className="divide-y divide-line">
            {lines.map(({ product, quantity }) => (
              <li key={product._id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{product.name}</p>
                  <p className="text-sm text-muted">{formatMoney(product.price, currency)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <QtyStepper size="sm" quantity={quantity} max={maxQty} onChange={(q) => onQtyChange(product._id, q)} />
                  <span className="w-16 text-right text-sm font-semibold text-ink">{formatMoney(product.price * quantity, currency)}</span>
                </div>
              </li>
            ))}
          </ul>

          <dl className="space-y-1 rounded-lg bg-cream px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(totals.subtotal, currency)}</dd></div>
            {taxPercentage > 0 && <div className="flex justify-between"><dt className="text-muted">Tax ({taxPercentage}%)</dt><dd>{formatMoney(totals.taxAmount, currency)}</dd></div>}
            {serviceChargePercentage > 0 && <div className="flex justify-between"><dt className="text-muted">Service charge ({serviceChargePercentage}%)</dt><dd>{formatMoney(totals.serviceCharge, currency)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink"><dt>Total</dt><dd>{formatMoney(totals.totalAmount, currency)}</dd></div>
          </dl>

          <div className="space-y-3">
            <Input label="Name (optional)" name="customerName" maxLength={60} autoComplete="name" value={form.customerName} onChange={set("customerName")} />
            <Input label="Phone (optional)" name="customerPhone" type="tel" maxLength={20} autoComplete="tel" value={form.customerPhone} onChange={set("customerPhone")} />
            <Textarea label="Note for the kitchen (optional)" name="customerNote" rows={2} maxLength={300} placeholder="Less spicy, no onions..." value={form.customerNote} onChange={set("customerNote")} />
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </form>
      )}
    </Modal>
  );
}
