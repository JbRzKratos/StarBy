'use client';

import { useState, useTransition, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { AdminBadge } from '../ui/badge';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import {
  deleteProduct,
  toggleVariantStock,
  updateProductPrice,
  updateVariantPrice,
} from '@/app/admin/lib/actions';

interface VariantRow {
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

interface ProductRow {
  id: string;
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
  createdAt: string;
  variants: VariantRow[];
}

interface CategoryOption {
  slug: string;
  name: string;
}

export function ProductsClient({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: CategoryOption[];
}) {
  const { toast, show, dismiss } = useToast();
  const [productList, setProductList] = useState<ProductRow[]>(products);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Price editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [syncVariants, setSyncVariants] = useState<boolean>(false);
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editVariantPriceValue, setEditVariantPriceValue] = useState<string>('');
  const [savingVariantPriceId, setSavingVariantPriceId] = useState<string | null>(null);

  useEffect(() => {
    setProductList(products);
  }, [products]);

  const filtered = productList.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.categorySlug === catFilter;
    const matchStock =
      stockFilter === 'all' ||
      (stockFilter === 'instock' && p.variants.some((v) => v.inStock)) ||
      (stockFilter === 'outofstock' && p.variants.every((v) => !v.inStock)) ||
      (stockFilter === 'lowstock' &&
        p.variants.some((v) => v.inStock && v.stockQuantity <= v.reorderThreshold));
    return matchSearch && matchCat && matchStock;
  });

  async function handleSaveBasePrice(productId: string) {
    const newPrice = parseFloat(editPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      show('Price must be a valid positive number or 0.', 'error');
      return;
    }

    setSavingPriceId(productId);
    try {
      await updateProductPrice(productId, newPrice, syncVariants);
      setProductList((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              basePrice: newPrice,
              variants: syncVariants
                ? p.variants.map((v) => ({ ...v, price: newPrice }))
                : p.variants,
            };
          }
          return p;
        }),
      );
      setEditingProductId(null);
      show(`Base price updated to ₹${newPrice.toLocaleString('en-IN')}! Reflected live.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update price';
      show(msg, 'error');
    } finally {
      setSavingPriceId(null);
    }
  }

  async function handleSaveVariantPrice(productId: string, variantId: string) {
    const newPrice = parseFloat(editVariantPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      show('Variant price must be a valid positive number or 0.', 'error');
      return;
    }

    setSavingVariantPriceId(variantId);
    try {
      await updateVariantPrice(variantId, newPrice);
      setProductList((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              variants: p.variants.map((v) => (v.id === variantId ? { ...v, price: newPrice } : v)),
            };
          }
          return p;
        }),
      );
      setEditingVariantId(null);
      show(`Variant price updated to ₹${newPrice.toLocaleString('en-IN')}!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update variant price';
      show(msg, 'error');
    } finally {
      setSavingVariantPriceId(null);
    }
  }

  function handleDelete(productId: string) {
    startTransition(async () => {
      try {
        await deleteProduct(productId);
        setProductList((prev) => prev.filter((p) => p.id !== productId));
        show('Product deleted', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete product';
        show(msg, 'error');
      } finally {
        setDeleteConfirm(null);
      }
    });
  }

  function handleToggleStock(variantId: string, current: boolean) {
    startTransition(async () => {
      try {
        await toggleVariantStock(variantId, !current);
        setProductList((prev) =>
          prev.map((p) => ({
            ...p,
            variants: p.variants.map((v) => (v.id === variantId ? { ...v, inStock: !current } : v)),
          })),
        );
        show(`Variant marked ${!current ? 'in stock' : 'out of stock'}`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update stock';
        show(msg, 'error');
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-bone">Products</h1>
          <p className="text-sm text-ash/60">{products.length} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5EFF] text-white text-sm font-medium rounded-lg hover:bg-[#2a4de8] transition-colors w-full sm:w-auto"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-black/20 rounded-xl border border-white/10 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ash/60"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF]"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-sm border border-white/10 rounded-lg px-3 py-2 bg-black/20 focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 min-w-[140px] flex-1 sm:flex-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="text-sm border border-white/10 rounded-lg px-3 py-2 bg-black/20 focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 min-w-[140px] flex-1 sm:flex-none"
        >
          <option value="all">All Stock</option>
          <option value="instock">In Stock</option>
          <option value="outofstock">Out of Stock</option>
          <option value="lowstock">Low Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-black/40 border-b border-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ash/60 uppercase tracking-wide">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ash/60 uppercase tracking-wide">
                  Category
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-ash/60 uppercase tracking-wide">
                  Base Price (Live)
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-ash/60 uppercase tracking-wide">
                  Variants
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ash/60 uppercase tracking-wide">
                  Stock
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ash/60 uppercase tracking-wide">
                  Flags
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ash/60 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ash/60">
                    No products match the current filter
                  </td>
                </tr>
              )}
              {filtered.map((product) => {
                const inStockCount = product.variants.filter((v) => v.inStock).length;
                const lowStock = product.variants.some(
                  (v) => v.inStock && v.stockQuantity <= v.reorderThreshold && v.stockQuantity > 0,
                );
                const outOfStock = product.variants.every((v) => !v.inStock);
                const stockVariant = outOfStock
                  ? 'out-of-stock'
                  : lowStock
                    ? 'low-stock'
                    : 'active';
                const stockLabel = outOfStock
                  ? 'Out of stock'
                  : lowStock
                    ? `Low (${inStockCount}/${product.variants.length})`
                    : `${inStockCount}/${product.variants.length} variants`;
                const isExpanded = expandedId === product.id;
                const isEditingPrice = editingProductId === product.id;

                return (
                  <Fragment key={product.id}>
                    <tr
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : product.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-bone">{product.name}</p>
                        <p className="text-xs text-ash/60 font-mono">{product.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-ash/80 capitalize">{product.categorySlug}</td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isEditingPrice ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-ash/80 font-mono">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={editPriceValue}
                                onChange={(e) => setEditPriceValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveBasePrice(product.id);
                                  if (e.key === 'Escape') setEditingProductId(null);
                                }}
                                autoFocus
                                className="w-24 px-2 py-1 text-sm bg-black/80 border border-[#3B5EFF] rounded text-bone font-mono focus:outline-none focus:ring-1 focus:ring-[#3B5EFF]"
                              />
                              <button
                                onClick={() => handleSaveBasePrice(product.id)}
                                disabled={savingPriceId === product.id}
                                title="Save price (Reflects live in store & invoices)"
                                className="px-2 py-1 bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/50 rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {savingPriceId === product.id ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                title="Cancel"
                                className="px-2 py-1 bg-white/5 border border-white/10 text-ash hover:text-bone hover:bg-white/10 rounded text-xs transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                            {product.variants.length > 0 && (
                              <label className="flex items-center gap-1.5 text-[11px] text-ash/80 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={syncVariants}
                                  onChange={(e) => setSyncVariants(e.target.checked)}
                                  className="w-3 h-3 rounded text-[#3B5EFF] bg-black/40 border-white/20"
                                />
                                <span>Also update all {product.variants.length} variant prices</span>
                              </label>
                            )}
                          </div>
                        ) : (
                          <div className="group/price flex items-center justify-end gap-1.5">
                            <span className="font-semibold text-bone font-mono text-sm">
                              ₹{product.basePrice.toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => {
                                setEditingProductId(product.id);
                                setEditPriceValue(String(product.basePrice));
                                setSyncVariants(false);
                              }}
                              title="Click to edit price (Admin Only)"
                              className="p-1 text-ash/40 group-hover/price:text-[#3B5EFF] hover:bg-white/5 rounded transition-colors"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-ash/80">
                        {product.variants.length}
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge variant={stockVariant} label={stockLabel} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {product.featured && <AdminBadge variant="active" label="Featured" />}
                          {product.customizable && <AdminBadge variant="staff" label="Custom" />}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="text-xs text-[#3B5EFF] hover:underline font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${product.id}-expanded`}>
                        <td colSpan={7} className="px-4 pb-4 bg-blue-50/20">
                          <div className="pt-2 space-y-1.5">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-ash/60 uppercase tracking-wider">
                                Variants Pricing & Stock
                              </p>
                              <span className="text-[11px] text-ash/60">
                                Click any variant price pencil to adjust variant-specific pricing
                              </span>
                            </div>
                            {product.variants.map((v) => {
                              const isEditingVarPrice = editingVariantId === v.id;
                              return (
                                <div
                                  key={v.id}
                                  className="flex items-center gap-3 bg-black/30 rounded-lg px-4 py-2.5 border border-white/5"
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-white/10 flex-shrink-0"
                                    style={{ background: v.colorHex }}
                                  />
                                  <span className="text-sm text-bone/90 flex-1">
                                    {v.name} — {v.color}
                                  </span>

                                  {/* Variant Price Editor */}
                                  <div
                                    className="flex items-center gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {isEditingVarPrice ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-ash/80 font-mono">₹</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="any"
                                          value={editVariantPriceValue}
                                          onChange={(e) => setEditVariantPriceValue(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveVariantPrice(product.id, v.id);
                                            if (e.key === 'Escape') setEditingVariantId(null);
                                          }}
                                          autoFocus
                                          className="w-20 px-1.5 py-0.5 text-xs bg-black/80 border border-[#3B5EFF] rounded text-bone font-mono focus:outline-none"
                                        />
                                        <button
                                          onClick={() => handleSaveVariantPrice(product.id, v.id)}
                                          disabled={savingVariantPriceId === v.id}
                                          className="px-1.5 py-0.5 bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/50 rounded text-[11px] font-semibold"
                                        >
                                          {savingVariantPriceId === v.id ? '…' : 'Save'}
                                        </button>
                                        <button
                                          onClick={() => setEditingVariantId(null)}
                                          className="px-1.5 py-0.5 bg-white/5 text-ash hover:text-bone rounded text-[11px]"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="group/var flex items-center gap-1">
                                        <span className="text-xs text-bone font-mono font-medium">
                                          ₹{v.price}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingVariantId(v.id);
                                            setEditVariantPriceValue(String(v.price));
                                          }}
                                          title="Edit variant price (Admin Only)"
                                          className="p-1 text-ash/40 group-hover/var:text-[#3B5EFF] hover:bg-white/5 rounded transition-colors"
                                        >
                                          <svg
                                            width="11"
                                            height="11"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <span
                                    className={`text-xs font-medium ${v.inStock ? 'text-green-500' : 'text-red-400'}`}
                                  >
                                    {v.inStock ? `${v.stockQuantity} in stock` : 'Out of stock'}
                                  </span>
                                  <button
                                    onClick={() => handleToggleStock(v.id, v.inStock)}
                                    disabled={isPending}
                                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                                      v.inStock
                                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                    }`}
                                  >
                                    {v.inStock ? 'Mark out' : 'Mark in'}
                                  </button>
                                </div>
                              );
                            })}
                            {product.variants.length === 0 && (
                              <p className="text-xs text-ash/60 italic">No variants yet</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete product"
          description="This will permanently delete this product and all its variants. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
