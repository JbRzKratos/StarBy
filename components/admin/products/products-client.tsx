'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AdminBadge } from '../ui/badge';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import { deleteProduct, toggleVariantStock } from '@/app/admin/lib/actions';

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
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = products.filter((p) => {
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

  function handleDelete(productId: string) {
    startTransition(async () => {
      try {
        await deleteProduct(productId);
        show('Product deleted', 'success');
      } catch {
        show('Failed to delete product', 'error');
      } finally {
        setDeleteConfirm(null);
      }
    });
  }

  function handleToggleStock(variantId: string, current: boolean) {
    startTransition(async () => {
      try {
        await toggleVariantStock(variantId, !current);
        show(`Variant marked ${!current ? 'in stock' : 'out of stock'}`, 'success');
      } catch {
        show('Failed to update stock', 'error');
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#3B5EFF] text-white text-sm font-medium rounded-lg hover:bg-[#2a4de8] transition-colors"
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF]"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20"
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
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20"
        >
          <option value="all">All Stock</option>
          <option value="instock">In Stock</option>
          <option value="outofstock">Out of Stock</option>
          <option value="lowstock">Low Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Category
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Base Price
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Variants
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Stock
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Flags
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
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

                return (
                  <>
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : product.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{product.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{product.categorySlug}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ₹{product.basePrice.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
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
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Variants
                            </p>
                            {product.variants.map((v) => (
                              <div
                                key={v.id}
                                className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5 border border-gray-100"
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                                  style={{ background: v.colorHex }}
                                />
                                <span className="text-sm text-gray-800 flex-1">
                                  {v.name} — {v.color}
                                </span>
                                <span className="text-xs text-gray-500">₹{v.price}</span>
                                <span
                                  className={`text-xs font-medium ${v.inStock ? 'text-green-700' : 'text-red-600'}`}
                                >
                                  {v.inStock ? `${v.stockQuantity} in stock` : 'Out of stock'}
                                </span>
                                <button
                                  onClick={() => handleToggleStock(v.id, v.inStock)}
                                  disabled={isPending}
                                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                                    v.inStock
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                                  }`}
                                >
                                  {v.inStock ? 'Mark out' : 'Mark in'}
                                </button>
                              </div>
                            ))}
                            {product.variants.length === 0 && (
                              <p className="text-xs text-gray-400 italic">No variants yet</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
