"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Input";
import { api } from "@/lib/apiClient";

const emptyForm = (categoryId = "") => ({
  name: "", description: "", price: "", image: "", categoryId, isAvailable: true, isFeatured: false,
});

// Mounted only while open, so every open starts with fresh state.
export default function ProductFormModal(props) {
  return props.open ? <ProductForm {...props} /> : null;
}

function ProductForm({ open, product, categories, defaultCategoryId, onClose, onSaved }) {
  const [form, setForm] = useState(
    product
      ? {
          name: product.name, description: product.description || "", price: String(product.price), image: product.image || "",
          categoryId: product.categoryId, isAvailable: product.isAvailable, isFeatured: product.isFeatured,
        }
      : emptyForm(defaultCategoryId || categories[0]?._id || "")
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const editing = Boolean(product);


  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { ...form, price: form.price === "" ? "" : Number(form.price) };
      if (editing) await api.patch(`/api/products/${product._id}`, body);
      else await api.post("/api/products", body);
      onSaved(editing ? "Product updated" : "Product created");
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
      title={editing ? "Edit product" : "New product"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="product-form" loading={saving}>{editing ? "Save changes" : "Create product"}</Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-4">
        <Input label="Name" name="name" required maxLength={100} value={form.name} onChange={set("name")} placeholder="e.g. Chicken Biryani" />
        <Textarea label="Description" name="description" maxLength={500} value={form.description} onChange={set("description")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price" name="price" type="number" min="0" step="0.01" required value={form.price} onChange={set("price")} />
          <Select label="Category" name="categoryId" required value={form.categoryId} onChange={set("categoryId")}>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Input
            label="Image URL" name="image" type="url" placeholder="https://..." value={form.image}
            hint="Paste a link to an image. Uploading to Cloudinary/S3 can be plugged in later (lib/imageStorage.js)."
            onChange={(e) => { setImageBroken(false); set("image")(e); }}
          />
          {form.image && !imageBroken && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image} alt="Preview" className="h-24 w-24 rounded-lg border border-line object-cover" onError={() => setImageBroken(true)} />
          )}
          {imageBroken && <p className="text-xs text-red-600">This image could not be loaded.</p>}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Checkbox label="Available" checked={form.isAvailable} onChange={set("isAvailable")} />
          <Checkbox label="Featured" checked={form.isFeatured} onChange={set("isFeatured")} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}
