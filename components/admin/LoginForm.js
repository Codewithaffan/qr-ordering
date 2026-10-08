"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/apiClient";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/login", form);
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl text-white">🍽️</div>
        <h1 className="text-xl font-bold text-ink">Admin login</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage your restaurant</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Email" name="email" type="email" autoComplete="username" required
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password" name="password" type="password" autoComplete="current-password" required
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Sign in</Button>
      </form>
    </Card>
  );
}
