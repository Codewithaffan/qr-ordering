"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Loading from "@/components/ui/Loading";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import useFetch from "@/hooks/useFetch";
import { api } from "@/lib/apiClient";

export default function TablesManager() {
  const toast = useToast();
  const { data: tables, loading, error, reload } = useFetch("/api/tables");

  const [addOpen, setAddOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [qrTable, setQrTable] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function addTable(e) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    try {
      const body = number === "" ? {} : { tableNumber: Number(number) };
      const created = await api.post("/api/tables", body);
      toast.success(`Table ${created.tableNumber} created`);
      setAddOpen(false);
      setNumber("");
      reload({ silent: true });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(table) {
    try {
      await api.patch(`/api/tables/${table._id}`, { isActive: !table.isActive });
      reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function removeTable() {
    setDeleting(true);
    try {
      await api.del(`/api/tables/${toDelete._id}`);
      toast.success(`Table ${toDelete.tableNumber} deleted`);
      setToDelete(null);
      reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => reload()} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tables</h1>
          <p className="text-sm text-muted">Each table has its own QR code that opens your menu.</p>
        </div>
        <Button onClick={() => { setAddError(""); setAddOpen(true); }}>Add table</Button>
      </div>

      {tables.length === 0 ? (
        <Card>
          <EmptyState icon="⬚" title="No tables created" description="Add your first table to generate its QR code." action={<Button onClick={() => setAddOpen(true)}>Add table</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <Card key={t._id} className={t.isActive ? "" : "opacity-70"}>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink">Table {t.tableNumber}</h2>
                  <p className="text-xs text-muted">{t.qrCode}</p>
                </div>
                <Badge tone={t.isActive ? "green" : "gray"}>{t.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setQrTable(t)}>View QR</Button>
                <a
                  href={`/api/tables/${t._id}/qr?download=1&size=1000`}
                  download
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:bg-cream"
                >
                  Download QR
                </a>
              </div>
              <div className="mt-3 flex items-center gap-1 border-t border-line pt-3">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(t)}>{t.isActive ? "Deactivate" : "Activate"}</Button>
                <Button size="sm" variant="dangerSoft" onClick={() => setToDelete(t)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add table"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" form="table-form" loading={adding}>Create table</Button>
          </>
        }
      >
        <form id="table-form" onSubmit={addTable} className="space-y-3">
          <Input label="Table number" type="number" min="1" value={number} onChange={(e) => setNumber(e.target.value)} hint="Leave empty to use the next available number." />
          {addError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</p>}
        </form>
      </Modal>

      <Modal
        open={Boolean(qrTable)}
        onClose={() => setQrTable(null)}
        title={qrTable ? `Table ${qrTable.tableNumber} QR code` : ""}
        size="sm"
        footer={
          qrTable && (
            <>
              <Button variant="secondary" onClick={() => copyLink(qrTable.qrUrl)}>Copy link</Button>
              <a
                href={`/api/tables/${qrTable._id}/qr?download=1&size=1000`}
                download
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Download PNG
              </a>
            </>
          )
        }
      >
        {qrTable && (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/tables/${qrTable._id}/qr?size=480`} alt={`QR code for table ${qrTable.tableNumber}`} className="h-64 w-64 rounded-lg border border-line" />
            <a href={qrTable.qrUrl} target="_blank" rel="noreferrer" className="break-all text-center text-xs text-primary-dark underline">{qrTable.qrUrl}</a>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        loading={deleting}
        title={`Delete table ${toDelete?.tableNumber}?`}
        message="Its QR code will stop working. Past orders from this table are kept."
        confirmLabel="Delete table"
        onCancel={() => setToDelete(null)}
        onConfirm={removeTable}
      />
    </div>
  );
}
