"use client";
import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/ui/Loading";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import CategoryFormModal from "./CategoryFormModal";
import ProductFormModal from "./ProductFormModal";
import { useAdmin } from "./AdminContext";
import useFetch from "@/hooks/useFetch";
import { api } from "@/lib/apiClient";
import { formatMoney } from "@/utils/format";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export default function MenuManager() {
  const { restaurant } = useAdmin();
  const toast = useToast();
  const cats = useFetch("/api/categories");
  const prods = useFetch("/api/products");

  const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
  const [productModal, setProductModal] = useState({ open: false, product: null, categoryId: "" });
  const [confirm, setConfirm] = useState(null); // { type: 'category'|'product', item }
  const [deleting, setDeleting] = useState(false);

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const p of prods.data || []) {
      if (!map.has(p.categoryId)) map.set(p.categoryId, []);
      map.get(p.categoryId).push(p);
    }
    return map;
  }, [prods.data]);

  const reloadAll = () => { cats.reload({ silent: true }); prods.reload({ silent: true }); };

  async function patchProduct(product, patch) {
    try {
      await api.patch(`/api/products/${product._id}`, patch);
      reloadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function patchCategory(category, patch) {
    try {
      await api.patch(`/api/categories/${category._id}`, patch);
      reloadAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function doDelete() {
    setDeleting(true);
    try {
      const { type, item } = confirm;
      await api.del(`/api/${type === "category" ? "categories" : "products"}/${item._id}`);
      toast.success(`${type === "category" ? "Category" : "Product"} deleted`);
      setConfirm(null);
      reloadAll();
    } catch (err) {
      toast.error(err.message);
      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  }

  if (cats.loading || prods.loading) return <Loading />;
  if (cats.error || prods.error) {
    return <ErrorState message={(cats.error || prods.error).message} onRetry={() => { cats.reload(); prods.reload(); }} />;
  }

  const categories = cats.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Menu</h1>
          <p className="text-sm text-muted">Categories and dishes your customers see.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCategoryModal({ open: true, category: null })}>Add category</Button>
          <Button disabled={categories.length === 0} onClick={() => setProductModal({ open: true, product: null, categoryId: "" })}>Add product</Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            title="Your menu is empty"
            description="Create a category (like Starters or Drinks) first, then add products to it."
            action={<Button onClick={() => setCategoryModal({ open: true, category: null })}>Create first category</Button>}
          />
        </Card>
      ) : (
        categories.map((category) => {
          const products = byCategory.get(category._id) || [];
          return (
            <Card key={category._id} padded={false}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-ink">{category.name}</h2>
                  <Badge>{products.length}</Badge>
                  {!category.isActive && <Badge tone="amber">Hidden</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setProductModal({ open: true, product: null, categoryId: category._id })}>+ Product</Button>
                  <Button size="sm" variant="ghost" onClick={() => patchCategory(category, { isActive: !category.isActive })}>{category.isActive ? "Hide" : "Show"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCategoryModal({ open: true, category })}>Edit</Button>
                  <Button size="sm" variant="dangerSoft" onClick={() => setConfirm({ type: "category", item: category })}>Delete</Button>
                </div>
              </div>

              {products.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-muted">No products in this category yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {products.map((p) => (
                    <li key={p._id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream text-xl">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        ) : "🍽️"}
                      </div>
                      <div className="min-w-0 flex-1 basis-40">
                        <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                          {p.name}
                          {p.isFeatured && <Badge tone="orange">★ Featured</Badge>}
                          {!p.isAvailable && <Badge tone="red">Unavailable</Badge>}
                        </p>
                        <p className="truncate text-sm text-muted">{p.description || "No description"}</p>
                      </div>
                      <p className="w-20 text-right font-semibold text-ink">{formatMoney(p.price, restaurant.currency)}</p>
                      <div className="flex items-center gap-3">
                        <Toggle checked={p.isAvailable} label={`${p.name} available`} onChange={() => patchProduct(p, { isAvailable: !p.isAvailable })} />
                        <button
                          onClick={() => patchProduct(p, { isFeatured: !p.isFeatured })}
                          className={`text-lg leading-none ${p.isFeatured ? "text-primary" : "text-gray-300 hover:text-primary"}`}
                          aria-label={p.isFeatured ? "Remove from featured" : "Mark as featured"}
                          title={p.isFeatured ? "Featured" : "Mark as featured"}
                        >★</button>
                        <Button size="sm" variant="secondary" onClick={() => setProductModal({ open: true, product: p, categoryId: p.categoryId })}>Edit</Button>
                        <Button size="sm" variant="dangerSoft" onClick={() => setConfirm({ type: "product", item: p })}>Delete</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })
      )}

      <CategoryFormModal
        open={categoryModal.open}
        category={categoryModal.category}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSaved={(msg) => { toast.success(msg); setCategoryModal({ open: false, category: null }); reloadAll(); }}
      />
      <ProductFormModal
        open={productModal.open}
        product={productModal.product}
        defaultCategoryId={productModal.categoryId}
        categories={categories}
        onClose={() => setProductModal({ open: false, product: null, categoryId: "" })}
        onSaved={(msg) => { toast.success(msg); setProductModal({ open: false, product: null, categoryId: "" }); reloadAll(); }}
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        danger
        loading={deleting}
        title={`Delete ${confirm?.type}?`}
        message={
          confirm?.type === "category"
            ? `"${confirm?.item.name}" will be permanently deleted. Categories that still contain products cannot be deleted.`
            : `"${confirm?.item.name}" will be removed from the menu. Past orders keep their original name and price.`
        }
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
