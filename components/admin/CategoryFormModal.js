"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Checkbox, Input, Textarea } from "@/components/ui/Input";
import { api } from "@/lib/apiClient";

const empty = { name: "", description: "", sortOrder: "", isActive: true };

// Mounted only while open, so every open starts with fresh state.
export default function CategoryFormModal(props) {
  return props.open ? <CategoryForm {...props} /> : null;
}

function CategoryForm({ open, category, onClose, onSaved }) {
  const [form, setForm] = useState(
    category
      ? { name: category.name, description: category.description || "", sortOrder: String(category.sortOrder ?? ""), isActive: category.isActive }
      : empty
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const editing = Boolean(category);


  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { name: form.name, description: form.description, isActive: form.isActive };
      if (form.sortOrder !== "") body.sortOrder = Number(form.sortOrder);
      if (editing) await api.patch(`/api/categories/${category._id}`, body);
      else await api.post("/api/categories", body);
      onSaved(editing ? "Category updated" : "Category created");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit category" : "New category"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="category-form" loading={saving}>{editing ? "Save changes" : "Create category"}</Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-4">
        <Input label="Name" name="name" required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Starters" />
        <Textarea label="Description" name="description" maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Sort order" name="sortOrder" type="number" min="0" hint="Lower numbers appear first. Leave empty to add at the end." value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
        <Checkbox label="Visible to customers" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}
