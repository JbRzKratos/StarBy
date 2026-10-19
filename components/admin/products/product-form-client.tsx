'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AdminToast, useToast } from '../ui/confirm-dialog';
import {
  createProduct,
  updateProduct,
  createVariant,
  deleteVariant,
  updateVariantPrice,
  toggleVariantStock,
  updateVariantStockQuantity,
} from '@/app/admin/lib/actions';

interface CategoryOption {
  slug: string;
  name: string;
}
interface VariantData {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  price: number;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  reorderThreshold: number;
}

interface ProductFormClientProps {
  mode: 'create' | 'edit';
  productId?: string;
  categories: CategoryOption[];
  initialData?: {
    name: string;
    slug: string;
    categorySlug: string;
    basePrice: number;
    tagline: string;
    description: string;
    customizable: boolean;
    featured: boolean;
    tags: string[];
    sizes: string[];
    sizePrices?: Record<string, number> | null;
    sizeStock?: Record<string, unknown> | null;
  };
  initialVariants?: VariantData[];
}

const BLANK_PRODUCT = {
  name: '',
  slug: '',
  categorySlug: '',
  basePrice: 0,
  tagline: '',
  description: '',
  customizable: false,
  featured: false,
  tags: [] as string[],
  sizes: [] as string[],
  sizePrices: null as Record<string, number> | null,
  sizeStock: null as Record<string, unknown> | null,
};

const BLANK_VARIANT = {
  name: '',
  color: '',
  colorHex: '#000000',
  price: 0,
  images: [] as string[],
  inStock: true,
  stockQuantity: 0,
  reorderThreshold: 5,
};

export function ProductFormClient({
  mode,
  productId,
  categories,
  initialData = BLANK_PRODUCT,
  initialVariants = [],
}: ProductFormClientProps) {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialData);
  const [tagsInput, setTagsInput] = useState(initialData.tags.join(', '));
  const [sizesInput, setSizesInput] = useState(initialData.sizes.join(', '));
  const [sizePrices, setSizePrices] = useState<Record<string, number>>(() => {
    return (initialData.sizePrices as Record<string, number>) || {};
  });
  const [sizeStock, setSizeStock] = useState<Record<string, { quantity: number; inStock: boolean }>>(() => {
    const raw = (initialData.sizeStock as Record<string, unknown>) || {};
    const result: Record<string, { quantity: number; inStock: boolean }> = {};
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === 'number') {
        result[k] = { quantity: v, inStock: v > 0 };
      } else if (v && typeof v === 'object') {
        const item = v as { quantity?: unknown; inStock?: unknown };
        result[k] = {
          quantity: typeof item.quantity === 'number' ? item.quantity : 50,
          inStock: item.inStock !== false,
        };
      }
    });
    return result;
  });
  const [variants, setVariants] = useState<VariantData[]>(initialVariants);
  const [newVariant, setNewVariant] = useState({ ...BLANK_VARIANT });
  const [showVariantForm, setShowVariantForm] = useState(false);

  function handleSubmit() {
    startTransition(async () => {
      try {
        const activeSizes = sizesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const cleanSizePrices: Record<string, number> = {};
        const cleanSizeStock: Record<string, { quantity: number; inStock: boolean }> = {};

        activeSizes.forEach((s) => {
          const upper = s.toUpperCase();
          const p = sizePrices[s] ?? sizePrices[upper] ?? form.basePrice;
          cleanSizePrices[s] = p;
          cleanSizePrices[upper] = p;
          if (upper === '2XL') cleanSizePrices['XXL'] = p;
          if (upper === 'XXL') cleanSizePrices['2XL'] = p;
          if (upper === '3XL') cleanSizePrices['XXXL'] = p;
          if (upper === 'XXXL') cleanSizePrices['3XL'] = p;

          const stockItem = sizeStock[s] ?? sizeStock[upper] ?? { quantity: 50, inStock: true };
          cleanSizeStock[s] = stockItem;
          cleanSizeStock[upper] = stockItem;
          if (upper === '2XL') cleanSizeStock['XXL'] = stockItem;
          if (upper === 'XXL') cleanSizeStock['2XL'] = stockItem;
          if (upper === '3XL') cleanSizeStock['XXXL'] = stockItem;
          if (upper === 'XXXL') cleanSizeStock['3XL'] = stockItem;
        });

        const data = {
          ...form,
          tags: tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          sizes: activeSizes,
          sizePrices: Object.keys(cleanSizePrices).length > 0 ? cleanSizePrices : null,
          sizeStock: Object.keys(cleanSizeStock).length > 0 ? cleanSizeStock : null,
        };
        if (mode === 'create') {
          await createProduct(data);
          show('Product created!', 'success');
          setTimeout(() => router.push('/admin/products'), 1200);
        } else if (productId) {
          await updateProduct(productId, data);
          show('Product updated!', 'success');
        }
      } catch (e) {
        show(e instanceof Error ? e.message : 'Error saving product', 'error');
      }
    });
  }

  function handleAddVariant() {
    if (!productId) {
      show('Save the product first before adding variants', 'error');
      return;
    }
    startTransition(async () => {
      try {
        await createVariant({ productId, ...newVariant });
        setVariants((prev) => [...prev, { id: Date.now().toString(), ...newVariant }]);
        setNewVariant({ ...BLANK_VARIANT });
        setShowVariantForm(false);
        show('Variant added', 'success');
      } catch {
        show('Failed to add variant', 'error');
      }
    });
  }

  function handleDeleteVariant(variantId: string) {
    startTransition(async () => {
      try {
        await deleteVariant(variantId);
        setVariants((prev) => prev.filter((v) => v.id !== variantId));
        show('Variant deleted', 'success');
      } catch {
        show('Failed to delete variant', 'error');
      }
    });
  }

  const inputClass =
    'w-full text-sm text-bone bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF] placeholder:text-ash/40';

  return (
    <div className="space-y-5">
      {/* Main info */}
      <div className="bg-black/20 rounded-xl border border-white/10 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-bone">Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ash mb-1.5">Product Name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                  ...(mode === 'create'
                    ? {
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-]/g, ''),
                      }
                    : {}),
                })
              }
              className={inputClass}
              placeholder="e.g. Premium Phone Skin"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ash mb-1.5">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={`${inputClass} font-mono`}
              placeholder="e.g. premium-phone-skin"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ash mb-1.5">Tagline</label>
          <input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className={inputClass}
            placeholder="Short descriptor"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ash mb-1.5">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${inputClass} resize-none`}
            placeholder="Full product description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ash mb-1.5">Category</label>
            <select
              value={form.categorySlug}
              onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
              className={inputClass}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ash mb-1.5">Base Price (₹)</label>
            <input
              type="number"
              min={0}
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ash mb-1.5">
            Tags (comma-separated)
          </label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={inputClass}
            placeholder="e.g. iphone, premium, matte"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ash mb-1.5">
            Sizes (comma-separated)
          </label>
          <input
            value={sizesInput}
            onChange={(e) => setSizesInput(e.target.value)}
            className={inputClass}
            placeholder="e.g. S, M, L, XL, 2XL, 3XL"
          />
        </div>

        {/* Size-Based Pricing Box */}
        {(() => {
          const parsedSizes = sizesInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          if (parsedSizes.length === 0) return null;

          return (
            <div className="bg-black/30 rounded-xl border border-white/10 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-bone uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-[#3B5EFF]">✦</span> Pricing &amp; Stock Inventory by Size
                  </h3>
                  <p className="text-[11px] text-ash mt-0.5">
                    Set selling price and inventory stock per size (defaults to Base Price ₹{form.basePrice || 0} and 50 stock)
                  </p>
                </div>

                {/* Quick Auto-Fill Buttons from Excel Catalog */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-ash uppercase font-mono">Excel Prices:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...sizePrices };
                      parsedSizes.forEach((s) => {
                        const u = s.toUpperCase();
                        updated[s] = u === '3XL' || u === 'XXXL' ? 645 : 600;
                      });
                      setSizePrices(updated);
                      show('Applied Regular Tee prices (₹600 / 3XL: ₹645)', 'success');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white/90 border border-white/10 cursor-pointer"
                  >
                    Regular (600/645)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...sizePrices };
                      parsedSizes.forEach((s) => {
                        const u = s.toUpperCase();
                        updated[s] = u === '3XL' || u === 'XXXL' ? 699 : 670;
                      });
                      setSizePrices(updated);
                      show('Applied Oversized Tee prices (₹670 / 3XL: ₹699)', 'success');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white/90 border border-white/10 cursor-pointer"
                  >
                    Oversized (670/699)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...sizePrices };
                      parsedSizes.forEach((s) => {
                        const u = s.toUpperCase();
                        updated[s] = u === '3XL' || u === 'XXXL' ? 720 : 699;
                      });
                      setSizePrices(updated);
                      show('Applied Acid Wash prices (₹699 / 3XL: ₹720)', 'success');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white/90 border border-white/10 cursor-pointer"
                  >
                    Acid Wash (699/720)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...sizePrices };
                      parsedSizes.forEach((s) => {
                        const u = s.toUpperCase();
                        updated[s] = u === '3XL' || u === 'XXXL' ? 780 : 750;
                      });
                      setSizePrices(updated);
                      show('Applied Hoodie prices (₹750 / 3XL: ₹780)', 'success');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white/90 border border-white/10 cursor-pointer"
                  >
                    Hoodie (750/780)
                  </button>
                </div>
              </div>

              {/* Stock Quick Presets Bar */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2 flex-wrap gap-2">
                <span className="text-[11px] text-ash font-medium flex items-center gap-1">
                  <span>📦 Size Inventory:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...sizeStock };
                      parsedSizes.forEach((s) => {
                        const u = s.toUpperCase();
                        updated[s] = { quantity: 50, inStock: true };
                        updated[u] = { quantity: 50, inStock: true };
                      });
                      setSizeStock(updated);
                      show('Set 50 stock for all sizes', 'success');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 cursor-pointer"
                  >
                    Set All 50
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...sizeStock };
                      parsedSizes.forEach((s) => {
                        const u = s.toUpperCase();
                        updated[s] = { quantity: 100, inStock: true };
                        updated[u] = { quantity: 100, inStock: true };
                      });
                      setSizeStock(updated);
                      show('Set 100 stock for all sizes', 'success');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 cursor-pointer"
                  >
                    Set All 100
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...sizeStock };
                      parsedSizes.forEach((s) => {
                        const u = s.toUpperCase();
                        const cur = updated[s] || updated[u] || { quantity: 50, inStock: true };
                        updated[s] = { ...cur, inStock: true };
                        updated[u] = { ...cur, inStock: true };
                      });
                      setSizeStock(updated);
                      show('Marked all sizes in stock', 'success');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 cursor-pointer"
                  >
                    All In Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...sizeStock };
                      parsedSizes.forEach((s) => {
                        const u = s.toUpperCase();
                        const cur = updated[s] || updated[u] || { quantity: 0, inStock: false };
                        updated[s] = { ...cur, inStock: false };
                        updated[u] = { ...cur, inStock: false };
                      });
                      setSizeStock(updated);
                      show('Marked all sizes out of stock', 'success');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 cursor-pointer"
                  >
                    All Out of Stock
                  </button>
                </div>
              </div>

              {/* Grid of Size Price & Stock Input Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
                {parsedSizes.map((size) => {
                  const upper = size.toUpperCase();
                  const currentPrice =
                    sizePrices[size] !== undefined
                      ? sizePrices[size]
                      : sizePrices[upper] !== undefined
                      ? sizePrices[upper]
                      : form.basePrice;

                  const currentStockItem =
                    sizeStock[size] ??
                    sizeStock[upper] ?? {
                      quantity: 50,
                      inStock: true,
                    };

                  return (
                    <div
                      key={size}
                      className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col gap-2 focus-within:border-[#3B5EFF] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-white uppercase">
                          Size {size}
                        </span>
                        {(upper === '3XL' || upper === 'XXXL') && (
                          <span className="text-[8px] font-mono bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded border border-purple-500/30">
                            Extended
                          </span>
                        )}
                      </div>

                      {/* Selling Price */}
                      <div>
                        <span className="block text-[10px] text-ash/70 font-mono mb-0.5">Price</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono text-ash pointer-events-none">
                            ₹
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={currentPrice ?? 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setSizePrices((prev) => ({
                                ...prev,
                                [size]: val,
                                [upper]: val,
                              }));
                            }}
                            className="w-full pl-5 pr-2 py-1 bg-black/60 border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-[#3B5EFF]"
                          />
                        </div>
                      </div>

                      {/* Stock Quantity */}
                      <div>
                        <span className="block text-[10px] text-ash/70 font-mono mb-0.5">Stock (qty)</span>
                        <input
                          type="number"
                          min={0}
                          value={currentStockItem.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value, 10) || 0;
                            setSizeStock((prev) => ({
                              ...prev,
                              [size]: { quantity: qty, inStock: qty > 0 ? (prev[size]?.inStock ?? true) : false },
                              [upper]: { quantity: qty, inStock: qty > 0 ? (prev[upper]?.inStock ?? true) : false },
                            }));
                          }}
                          className="w-full px-2 py-1 bg-black/60 border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-[#3B5EFF]"
                        />
                      </div>

                      {/* In-Stock Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextInStock = !currentStockItem.inStock;
                          setSizeStock((prev) => ({
                            ...prev,
                            [size]: { ...currentStockItem, inStock: nextInStock },
                            [upper]: { ...currentStockItem, inStock: nextInStock },
                          }));
                        }}
                        className={`text-[10px] py-1 px-1.5 rounded font-mono font-bold transition-all border text-center ${
                          currentStockItem.inStock
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                        }`}
                      >
                        {currentStockItem.inStock ? '✓ In Stock' : '✕ Out'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4 rounded accent-[#3B5EFF]"
            />
            <span className="text-sm text-ash font-medium">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.customizable}
              onChange={(e) => setForm({ ...form, customizable: e.target.checked })}
              className="w-4 h-4 rounded accent-[#3B5EFF]"
            />
            <span className="text-sm text-ash font-medium">Customizable</span>
          </label>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-black/20 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-bone">Variants ({variants.length})</h2>
          <button
            onClick={() => setShowVariantForm(!showVariantForm)}
            className="text-xs text-[#3B5EFF] hover:underline font-medium"
          >
            {showVariantForm ? 'Cancel' : '+ Add Variant'}
          </button>
        </div>

        {showVariantForm && (
          <div className="bg-black/40 rounded-lg p-4 mb-4 space-y-3 border border-white/10">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ash mb-1">Variant Name</label>
                <input
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Midnight Black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ash mb-1">Color Name</label>
                <input
                  value={newVariant.color}
                  onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ash mb-1">Color Hex</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newVariant.colorHex}
                    onChange={(e) => setNewVariant({ ...newVariant, colorHex: e.target.value })}
                    className="w-10 h-10 rounded border border-white/10 cursor-pointer"
                  />
                  <input
                    value={newVariant.colorHex}
                    onChange={(e) => setNewVariant({ ...newVariant, colorHex: e.target.value })}
                    className={`${inputClass} flex-1 font-mono`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ash mb-1">Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={newVariant.price}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ash mb-1">Stock Qty</label>
                <input
                  type="number"
                  min={0}
                  value={newVariant.stockQuantity}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, stockQuantity: parseInt(e.target.value) || 0 })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ash mb-1">Reorder Threshold</label>
                <input
                  type="number"
                  min={0}
                  value={newVariant.reorderThreshold}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      reorderThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <button
              onClick={handleAddVariant}
              disabled={isPending || !newVariant.name}
              className="px-4 py-2 bg-[#3B5EFF] text-white text-sm font-medium rounded-lg hover:bg-[#2a4de8] transition-colors disabled:opacity-50"
            >
              Add Variant
            </button>
          </div>
        )}

        <div className="space-y-2">
          {variants.length === 0 && !showVariantForm && (
            <p className="text-sm text-ash/60 italic">No variants yet</p>
          )}
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 bg-black/40 rounded-lg px-4 py-2.5 border border-white/5"
            >
              <span
                className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0"
                style={{ background: v.colorHex }}
              />
              <span className="text-sm text-bone/90 flex-1">
                {v.name} — {v.color}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-ash/80">₹</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={v.price}
                  onBlur={async (e) => {
                    const p = parseFloat(e.target.value);
                    if (!isNaN(p) && p >= 0 && p !== v.price) {
                      try {
                        await updateVariantPrice(v.id, p);
                        setVariants((prev) =>
                          prev.map((item) => (item.id === v.id ? { ...item, price: p } : item)),
                        );
                        show(`Variant price updated to ₹${p}`, 'success');
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : 'Failed to update price';
                        show(msg, 'error');
                      }
                    }
                  }}
                  className="w-20 px-2 py-1 text-xs bg-black/60 border border-white/20 rounded text-bone font-mono focus:border-[#3B5EFF] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-ash/70 font-mono">Stock:</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={v.stockQuantity}
                  onBlur={async (e) => {
                    const q = parseInt(e.target.value, 10);
                    if (!isNaN(q) && q >= 0 && q !== v.stockQuantity) {
                      try {
                        await updateVariantStockQuantity(v.id, q);
                        setVariants((prev) =>
                          prev.map((item) =>
                            item.id === v.id ? { ...item, stockQuantity: q, inStock: q > 0 } : item
                          )
                        );
                        show(`Variant stock updated to ${q} units`, 'success');
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : 'Failed to update stock';
                        show(msg, 'error');
                      }
                    }
                  }}
                  className="w-16 px-2 py-1 text-xs bg-black/60 border border-white/20 rounded text-bone font-mono focus:border-[#3B5EFF] focus:outline-none text-center"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await toggleVariantStock(v.id, !v.inStock);
                    setVariants((prev) =>
                      prev.map((item) => (item.id === v.id ? { ...item, inStock: !v.inStock } : item))
                    );
                    show(`Variant marked ${!v.inStock ? 'in stock' : 'out of stock'}`, 'success');
                  } catch (err: unknown) {
                    show(err instanceof Error ? err.message : 'Failed to toggle stock', 'error');
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                  v.inStock
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {v.inStock ? 'In stock' : 'Out'}
              </button>
              <button
                onClick={() => handleDeleteVariant(v.id)}
                className="text-xs text-red-400 hover:text-red-300 ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending || !form.name || !form.slug || !form.categorySlug}
          className="px-6 py-2.5 bg-[#3B5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#2a4de8] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
        </button>
        <button
          onClick={() => router.push('/admin/products')}
          className="px-4 py-2.5 text-sm font-medium text-ash/80 hover:text-white"
        >
          Cancel
        </button>
      </div>

      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
