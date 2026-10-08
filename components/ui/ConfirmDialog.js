"use client";
import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({
  open, title = "Are you sure?", message, confirmLabel = "Confirm", danger = false, loading = false, onConfirm, onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
