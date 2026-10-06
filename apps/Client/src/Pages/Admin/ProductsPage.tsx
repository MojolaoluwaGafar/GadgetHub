import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Filter, ImageOff, Plus, Search, Trash2 } from "lucide-react";
import type { Category, ProductSummary } from "../../types";
import { CATEGORIES, CATEGORY_LABELS } from "../../types";
import { adminService, type StockFilter } from "../../API/services/adminService";
import { useApiQuery } from "../../Hooks/Api/useApiQuery";
import { useDebounced } from "../../Hooks/useDebounced";
import { ErrorState, Pagination, Skeleton } from "../../Components";
import ProductFormModal from "../../Components/Admin/ProductFormModal";
import { ConfirmDialog } from "../../Components/Modal";
import { AdminHeading } from "../../Layout/AdminLayout";
import { apiErrorMessage } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import { naira } from "../../utils/format";

const PAGE_SIZE = 20;

// The design's Products page. /admin/products/new and
// /admin/products/:id/edit open the Add/Edit Product modal over the list.
export default function ProductsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const query = useDebounced(q);
  const category = params.get("category") ?? "";
  const stock = (params.get("stock") ?? "") as StockFilter;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [deleting, setDeleting] = useState<ProductSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const formOpen = pathname.endsWith("/new") || Boolean(id);

  // The top bar's search sends ?q= here.
  useEffect(() => setQ(urlQ), [urlQ]);

  const { data, loading, error, refetch } = useApiQuery(
    () => adminService.products({ q: query, category: category as Category | "", stock, page, limit: PAGE_SIZE }),
    [query, category, stock, page],
    "We couldn't load products.",
  );

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const closeForm = () => navigate({ pathname: "/admin/products", search: params.toString() });

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminService.deleteProduct(deleting.id);
      showToast(`${deleting.name} deleted`);
      setDeleting(null);
      refetch();
    } catch (err) {
      showToast(apiErrorMessage(err, "The product wasn't deleted."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminHeading
        title="Products"
        text="Manage your product inventory."
        action={
          <button
            type="button"
            onClick={() => navigate({ pathname: "/admin/products/new", search: params.toString() })}
            className="flex h-12 w-[171px] items-center justify-center gap-2 rounded-md bg-brand text-white hover:border hover:border-brand hover:bg-white hover:text-brand"
          >
            <Plus className="h-5 w-5" /> Add Product
          </button>
        }
      />

      <div className="mt-3 flex flex-col justify-between gap-5 rounded-md border border-[#e7e4e4] p-5 md:flex-row">
        <div className="relative h-11 md:w-2/3">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (page > 1) set("page", "");
            }}
            placeholder="Search product name..."
            aria-label="Search products"
            className="h-11 w-full rounded-md border border-[#d4d1d1] pl-10 pr-3 focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
            <select value={category} onChange={(e) => set("category", e.target.value)} aria-label="Category" className="h-11 w-[219px] rounded-md border border-line pl-8 text-left">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <select value={stock} onChange={(e) => set("stock", e.target.value)} aria-label="Stock" className="h-11 rounded-md border border-line px-3">
            <option value="">Any stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-[#e7e4e4]">
        <h2 className="px-5 pt-2 text-xl font-semibold text-[#1d1c1c]">Products</h2>
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <div className="mt-4 overflow-x-auto border-t border-[#e7e4e4] bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#fff9f9] text-left text-[#7a7a7a]">
                <tr>
                  <th className="px-5 py-4 font-medium">Product Image</th>
                  <th className="px-5 py-4 font-medium">Product Name</th>
                  <th className="px-5 py-4 font-medium">Categories</th>
                  <th className="px-5 py-4 font-medium">Price</th>
                  <th className="px-5 py-4 font-medium">Stock Status</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-t border-[#e7e4e4]">
                      <td colSpan={6} className="px-5 py-4">
                        <Skeleton className="h-[50px]" />
                      </td>
                    </tr>
                  ))
                ) : data?.items.length ? (
                  data.items.map((product) => (
                    <tr key={product.id} className="border-t border-[#e7e4e4]">
                      <td className="px-5 py-4">
                        <span className="flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-md bg-gray-100 text-subtle">
                          {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <ImageOff className="h-5 w-5" />}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[15px]">
                        {product.name}
                        <span className="block text-xs text-muted">
                          {product.brand} · {product.stock} in stock{product.onSale ? " · On sale" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[15px] text-[#605f5f]">{CATEGORY_LABELS[product.category]}</td>
                      <td className="px-5 py-4 text-[15px]">{naira(product.price)}</td>
                      <td className="px-5 py-4">
                        {product.stock > 0 ? (
                          <span className="inline-flex h-8 items-center justify-center rounded-full bg-[#dcfce7] px-3 text-sm text-[#059d28]">{product.stock <= 5 ? "Low Stock" : "In Stock"}</span>
                        ) : (
                          <span className="inline-flex h-8 items-center justify-center rounded-full bg-[#ffeded] px-3 text-sm text-[#e60e0e]">Out of Stock</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-4">
                          <button type="button" onClick={() => navigate({ pathname: `/admin/products/${product.id}/edit`, search: params.toString() })} className="text-[#302e2e] hover:underline">
                            Edit
                          </button>
                          <button type="button" onClick={() => setDeleting(product)} className="text-[#e60e0e] hover:underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-4 text-gray-500">
                      {query || category || stock ? "No products match." : "No products found. Click Add Product to add your first one."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-6">
        <Pagination page={page} total={data?.total ?? 0} limit={PAGE_SIZE} onChange={(p) => set("page", p > 1 ? String(p) : "")} />
      </div>

      {formOpen && <ProductFormModal key={id ?? "new"} productId={id ?? null} onClose={closeForm} onSaved={refetch} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        icon={<Trash2 />}
        title="Delete Product"
        text={`Are you sure you want to delete "${deleting?.name}"?`}
        confirmLabel="Delete Product"
      />
    </div>
  );
}
