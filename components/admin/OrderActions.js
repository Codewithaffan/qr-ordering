"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { NEXT_STEP, canCancel } from "./orderFlow";

export default function OrderActions({ order, busy, onChange, size = "sm" }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = NEXT_STEP[order.status];

  if (!next && !canCancel(order.status)) return <span className="text-xs text-muted">—</span>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next && (
        <Button size={size} loading={busy} onClick={() => onChange(order, next.status)}>
          {next.label}
        </Button>
      )}
      {canCancel(order.status) && (
        <Button size={size} variant="dangerSoft" disabled={busy} onClick={() => setConfirmCancel(true)}>
          Cancel
        </Button>
      )}
      <ConfirmDialog
        open={confirmCancel}
        danger
        title={`Cancel ${order.orderNumber}?`}
        message="The customer will see that their order was cancelled. This cannot be undone."
        confirmLabel="Cancel order"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          onChange(order, "CANCELLED");
        }}
      />
    </div>
  );
}
