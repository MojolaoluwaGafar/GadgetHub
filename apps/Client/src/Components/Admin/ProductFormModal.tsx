import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, CircleCheck, X } from "lucide-react";
import type { Category, ColorOption, ProductDetail, ProductImage, Spec } from "../../types";
import { CATEGORIES, CATEGORY_LABELS } from "../../types";
import { adminService } from "../../API/services/adminService";
import { Notice, PageLoader, Toggle } from "../index";
import ImageManager from "./ImageManager";
import Modal from "../Modal";
import Button from "../Button";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import { cx, naira, percentOff } from "../../utils/format";

// The form as typed: numbers stay strings until saved.
interface FormValues {
  name: string;
  brand: string;
  category: Category | "";
  subtitle: string;
  description: string;
  price: string;
  compareAtPrice: string;
  saleEndsAt: string;
  stock: string;
  trending: boolean;
  images: ProductImage[];
  colors: ColorOption[];
  storageOptions: string[];
  specs: Spec[];
}

const EMPTY: FormValues = {
  name: "",
  brand: "",
  category: "",
  subtitle: "",
  description: "",
  price: "",
  compareAtPrice: "",
  saleEndsAt: "",
  stock: "",
  trending: false,
  images: [],
  colors: [],
  storageOptions: [],
  specs: [{ label: "", value: "" }],
};

// <input type="datetime-local"> wants local time without seconds.
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const fromProduct = (p: ProductDetail): FormValues => ({
  name: p.name,
  brand: p.brand,
  category: p.category,
  subtitle: p.subtitle,
  description: p.description,
  price: String(p.price),
  compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
  saleEndsAt: toLocalInput(p.saleEndsAt),
  stock: String(p.stock),
  trending: p.trending,
  images: p.images,
  colors: p.colors,
  storageOptions: p.storageOptions,
  specs: p.specs.length ? p.specs : [{ label: "", value: "" }],
});

// Digits only, so "1,200,000" or "₦1200000" both work.
const toNumber = (value: string) => Number(value.replace(/[^\d.]/g, ""));

// The design's inputs.
const input = (hasError?: boolean) =>
  cx("my-2 h-11 w-full rounded-md border px-3 text-ink focus:border-brand focus:outline-none", hasError ? "border-danger" : "border-[#d4d1d1]");

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="-mt-1 mb-2 text-xs font-medium text-danger">{message}</p> : null;
}

export default function ProductFormModal({ productId, onClose, onSaved }: { productId: string | null; onClose: () => void; onSaved: () => void }) {
  const editing = Boolean(productId);
  const [form, setForm] = useState<FormValues>(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [more, setMore] = useState(false);
  const [saved, setSaved] = useState<ProductDetail | null>(null);
  const [storageDraft, setStorageDraft] = useState("");

  useEffect(() => {
    if (!productId) return;
    adminService
      .product(productId)
      .then((product) => {
        setForm(fromProduct(product));
        // Open "More options" when the product already uses them.
        setMore(Boolean(product.subtitle || product.compareAtPrice || product.trending || product.colors.length || product.storageOptions.length));
      })
      .catch((err) => setFormError(apiErrorMessage(err, "We couldn't load this product.")))
      .finally(() => setLoading(false));
  }, [productId]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  };
  const updateSpec = (index: number, change: Partial<Spec>) => set("specs", form.specs.map((s, i) => (i === index ? { ...s, ...change } : s)));
  const updateColor = (index: number, change: Partial<ColorOption>) => set("colors", form.colors.map((c, i) => (i === index ? { ...c, ...change } : c)));
  const addStorage = () => {
    const value = storageDraft.trim();
    if (value && !form.storageOptions.includes(value)) set("storageOptions", [...form.storageOptions, value]);
    setStorageDraft("");
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    setFormError("");
    const missing: Record<string, string> = {};
    if (!form.category) missing.category = "Pick a category.";
    // An empty box would save as 0, which means sold out.
    if (!form.stock.trim()) missing.stock = "Enter how many are in stock.";
    if (Object.keys(missing).length) return setErrors(missing);

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        brand: form.brand,
        category: form.category as Category,
        subtitle: form.subtitle,
        description: form.description,
        price: toNumber(form.price),
        compareAtPrice: form.compareAtPrice.trim() ? toNumber(form.compareAtPrice) : null,
        saleEndsAt: form.compareAtPrice.trim() && form.saleEndsAt ? new Date(form.saleEndsAt).toISOString() : null,
        stock: toNumber(form.stock),
        trending: form.trending,
        images: form.images,
        // Half-filled rows are left out rather than rejected.
        colors: form.colors.filter((c) => c.name.trim()),
        storageOptions: form.storageOptions,
        specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
      };
      const product = editing ? await adminService.updateProduct(productId!, payload) : await adminService.createProduct(payload);
      onSaved();
      if (editing) {
        showToast("Product updated successfully");
        onClose();
      } else {
        setSaved(product);
      }
    } catch (err) {
      const fields = apiFieldErrors(err);
      // "images.0.url" -> "images", so the error shows under the photos.
      const byField = Object.fromEntries(Object.entries(fields).map(([key, message]) => [key.split(".")[0], message]));
      setErrors(byField);
      if (byField.compareAtPrice || byField.saleEndsAt || byField.colors || byField.storageOptions || byField.subtitle) setMore(true);
      setFormError(apiErrorMessage(err, "The product wasn't saved."));
    } finally {
      setSaving(false);
    }
  };

  // "Product Added Successfully!"
  if (saved) {
    return (
      <Modal open onClose={onClose} size="sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-[99px] w-[99px] items-center justify-center rounded-full bg-[#f1ffec] text-success">
            <CircleCheck className="h-12 w-12" />
          </span>
          <p className="text-[28px] font-semibold">Product Added Successfully!</p>
          <p className="text-xl text-[#686565]">The product "{saved.name}" has been added.</p>
          <Button onClick={onClose} className="h-10 w-[84px]">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  const price = toNumber(form.price);
  const off = form.compareAtPrice.trim() ? percentOff(price, toNumber(form.compareAtPrice)) : 0;

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Product" : "Add New Product"}>
      {loading ? (
        <PageLoader />
      ) : (
        <form onSubmit={submit} noValidate>
          {formError && <Notice tone="danger" className="mb-3">{formError}</Notice>}

          <Label htmlFor="name">Product Name *</Label>
          <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={input(Boolean(errors.name))} placeholder="Enter product name" maxLength={100} />
          <FieldError message={errors.name} />

          <Label htmlFor="description">Product Description *</Label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={cx(input(Boolean(errors.description)), "h-auto py-2.5")}
            rows={3}
            placeholder="Enter product description"
            maxLength={2000}
          />
          <FieldError message={errors.description} />

          <div className="flex w-full justify-between gap-5">
            <div className="w-1/2">
              <Label htmlFor="category">Category *</Label>
              <select id="category" value={form.category} onChange={(e) => set("category", e.target.value as Category)} className={input(Boolean(errors.category))}>
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <FieldError message={errors.category} />
            </div>
            <div className="w-1/2">
              <Label htmlFor="brand">Brand Name *</Label>
              <input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} className={input(Boolean(errors.brand))} placeholder="Enter brand" maxLength={40} />
              <FieldError message={errors.brand} />
            </div>
          </div>

          <div className="flex w-full justify-between gap-5">
            <div className="w-1/2">
              <Label htmlFor="price">Price *</Label>
              <input id="price" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} className={input(Boolean(errors.price))} placeholder="Enter product price" />
              <FieldError message={errors.price} />
            </div>
            <div className="w-1/2">
              <Label htmlFor="stock">Units in Stock *</Label>
              <input id="stock" inputMode="numeric" value={form.stock} onChange={(e) => set("stock", e.target.value)} className={input(Boolean(errors.stock))} placeholder="e.g. 20" />
              <FieldError message={errors.stock} />
            </div>
          </div>

          <p className="mb-2 mt-4 text-sm font-semibold">Product Specification</p>
          <div className="flex flex-col gap-3">
            {form.specs.map((spec, index) => (
              <div key={index} className="flex items-center gap-3">
                <input value={spec.label} onChange={(e) => updateSpec(index, { label: e.target.value })} placeholder="Spec name (e.g Display)" aria-label={`Spec ${index + 1} name`} className="h-11 w-1/2 rounded-md border border-[#d4d1d1] p-3 text-sm" maxLength={40} />
                <input value={spec.value} onChange={(e) => updateSpec(index, { value: e.target.value })} placeholder="Spec value (e.g 6.7 OLED)" aria-label={`Spec ${index + 1} value`} className="h-11 w-1/2 rounded-md border border-[#d4d1d1] p-3 text-sm" maxLength={120} />
                {form.specs.length > 1 && (
                  <button type="button" onClick={() => set("specs", form.specs.filter((_, i) => i !== index))} className="text-sm text-red-500" aria-label={`Remove spec ${index + 1}`}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("specs", [...form.specs, { label: "", value: "" }])} className="mt-3 text-sm font-semibold text-brand">
            + Add Specification
          </button>
          <FieldError message={errors.specs} />

          <p className="my-2 text-sm font-semibold">Product Image *</p>
          <ImageManager images={form.images} onChange={(images) => set("images", images)} error={errors.images} />

          {/* What the first version's form didn't have, out of the way. */}
          <button type="button" onClick={() => setMore(!more)} className="mt-5 flex w-full items-center justify-between border-t border-line pt-4 text-sm font-semibold" aria-expanded={more}>
            More options (sale price, trending, colours, storage)
            <ChevronDown className={cx("h-4 w-4 transition-transform", more && "rotate-180")} />
          </button>
          {more && (
            <div className="mt-3 space-y-4">
              <div>
                <Label htmlFor="subtitle">Short description</Label>
                <input id="subtitle" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className={input(Boolean(errors.subtitle))} placeholder="e.g. 256GB • Titanium Gray (shown on product cards)" maxLength={80} />
                <FieldError message={errors.subtitle} />
              </div>
              <div className="flex gap-5">
                <div className="w-1/2">
                  <Label htmlFor="compareAtPrice">Original price (puts it on sale)</Label>
                  <input id="compareAtPrice" inputMode="numeric" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} className={input(Boolean(errors.compareAtPrice))} placeholder="e.g. 1500000" />
                  <FieldError message={errors.compareAtPrice} />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="saleEndsAt">Sale ends</Label>
                  <input id="saleEndsAt" type="datetime-local" value={form.saleEndsAt} onChange={(e) => set("saleEndsAt", e.target.value)} disabled={!form.compareAtPrice.trim()} className={cx(input(Boolean(errors.saleEndsAt)), "disabled:bg-panel")} />
                  <FieldError message={errors.saleEndsAt} />
                </div>
              </div>
              {off > 0 && (
                <p className="-mt-2 text-sm text-success">
                  On sale: {naira(price)} ({off}% off). It shows in Flash Deals.
                </p>
              )}
              <Toggle id="trending" checked={form.trending} onChange={(value) => set("trending", value)} label="Trending" description="Show it under “Trending This Week” on the home page." />
              <div>
                <p className="mb-2 text-sm font-semibold">Colours</p>
                {form.colors.map((color, index) => (
                  <div key={index} className="mb-2 flex items-center gap-3">
                    <input type="color" value={color.hex} onChange={(e) => updateColor(index, { hex: e.target.value.toUpperCase() })} className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-[#d4d1d1] p-1" aria-label={`Colour ${index + 1}`} />
                    <input value={color.name} onChange={(e) => updateColor(index, { name: e.target.value })} placeholder="Colour name (e.g Titanium Gray)" aria-label={`Colour ${index + 1} name`} className="h-11 flex-1 rounded-md border border-[#d4d1d1] p-3 text-sm" maxLength={30} />
                    <button type="button" onClick={() => set("colors", form.colors.filter((_, i) => i !== index))} className="text-sm text-red-500" aria-label={`Remove colour ${index + 1}`}>
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => set("colors", [...form.colors, { name: "", hex: "#191C1F" }])} className="text-sm font-semibold text-brand">
                  + Add Colour
                </button>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Storage options</p>
                {form.storageOptions.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {form.storageOptions.map((value) => (
                      <span key={value} className="flex items-center gap-1 rounded-md border border-brand bg-brand-soft py-1 pl-3 pr-1 text-sm text-brand">
                        {value}
                        <button type="button" onClick={() => set("storageOptions", form.storageOptions.filter((v) => v !== value))} aria-label={`Remove ${value}`} className="rounded p-0.5 hover:bg-brand-tint">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={storageDraft}
                    onChange={(e) => setStorageDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addStorage();
                      }
                    }}
                    placeholder="e.g. 256GB"
                    aria-label="Storage option"
                    className="h-11 flex-1 rounded-md border border-[#d4d1d1] p-3 text-sm"
                    maxLength={20}
                  />
                  <button type="button" onClick={addStorage} className="text-sm font-semibold text-brand">
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-4 pt-6">
            <Button type="submit" loading={saving} className="h-12 flex-1">
              {editing ? "Update Product" : "Add Product"}
            </Button>
            <button type="button" onClick={onClose} className="h-12 flex-1 rounded-md border border-[#ee2020] text-[#ee2020] hover:bg-[#ee2020] hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
