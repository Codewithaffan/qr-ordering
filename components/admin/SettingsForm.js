"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import ErrorState from "@/components/ui/ErrorState";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import useFetch from "@/hooks/useFetch";
import { api } from "@/lib/apiClient";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];

export default function SettingsForm() {
  const { data, loading, error, reload } = useFetch("/api/settings");
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => reload()} />;
  return <SettingsEditor data={data} reload={reload} />;
}

function SettingsEditor({ data, reload }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    logo: data.logo || "",
    currency: data.settings?.currency || "INR",
    taxPercentage: String(data.settings?.taxPercentage ?? 0),
    serviceChargePercentage: String(data.settings?.serviceChargePercentage ?? 0),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await api.patch("/api/settings", {
        ...form,
        taxPercentage: Number(form.taxPercentage),
        serviceChargePercentage: Number(form.serviceChargePercentage),
      });
      toast.success("Settings saved");
      router.refresh(); // refresh restaurant name/currency shown in the admin shell
      reload({ silent: true }); // data prop changes, form keeps what the user just saved
    } catch (err) {
      setFieldErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-muted">Restaurant details and how orders are billed.</p>
      </div>

      <form onSubmit={submit} className="space-y-6" noValidate>
        <Card className="space-y-4">
          <h2 className="font-semibold text-ink">Restaurant</h2>
          <Input label="Restaurant name" required value={form.name} onChange={set("name")} error={fieldErrors.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" required value={form.email} onChange={set("email")} error={fieldErrors.email} />
            <Input label="Phone" type="tel" required value={form.phone} onChange={set("phone")} error={fieldErrors.phone} />
          </div>
          <Textarea label="Address" value={form.address} onChange={set("address")} error={fieldErrors.address} />
          <Input label="Logo URL" type="url" placeholder="https://..." value={form.logo} onChange={set("logo")} error={fieldErrors.logo} />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-ink">Billing</h2>
          <Select label="Currency" value={form.currency} onChange={set("currency")}>
            {(CURRENCIES.includes(form.currency) ? CURRENCIES : [form.currency, ...CURRENCIES]).map((c) => <option key={c}>{c}</option>)}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Tax (%)" type="number" min="0" max="100" step="0.01" value={form.taxPercentage} onChange={set("taxPercentage")} error={fieldErrors.taxPercentage} hint="Applied to the order subtotal." />
            <Input label="Service charge (%)" type="number" min="0" max="100" step="0.01" value={form.serviceChargePercentage} onChange={set("serviceChargePercentage")} error={fieldErrors.serviceChargePercentage} hint="Applied to the order subtotal." />
          </div>
          <p className="text-xs text-muted">Changes apply to new orders only. Existing orders keep the totals they were placed with.</p>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving}>Save settings</Button>
        </div>
      </form>
    </div>
  );
}
