'use client';

import { useState, useTransition, useEffect, Fragment, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Edit2,
  Check,
  X,
  DollarSign,
  Layers,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from 'lucide-react';
import { AdminBadge } from '../ui/badge';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import {
  deleteProduct,
  toggleVariantStock,
  updateProductPrice,
  updateProductName,
  updateVariantPrice,
  batchUpdateCategoryPrice,
} from '@/app/admin/lib/actions';
import { isCategoryComingSoon } from '@/data/categories';

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

export interface CustomerSellingCategory {
  id: string;
  name: string;
  icon: string;
  categorySlugs: string[];
  status: 'active' | 'coming-soon';
  description: string;
  badge: string;
  suggestedPrices: number[];
}

export const CUSTOMER_SELLING_CATEGORIES: CustomerSellingCategory[] = [
  {
    id: 'tees',
    name: 'T-Shirts & Tees',
    icon: '👕',
    categorySlugs: ['tees', 'oversized-tees'],
    status: 'active',
    description: 'Classic Heavyweight & Oversized Streetwear Graphic Tees (180-240 GSM)',
    badge: 'Selling Live',
    suggestedPrices: [699, 799, 899, 999, 1199],
  },
  {
    id: 'hoodies',
    name: 'Hoodies & Fleece',
    icon: '🧥',
    categorySlugs: ['hoodies'],
    status: 'active',
    description: 'Core Heavyweight & Boxy Streetwear Hoodies (380-420 GSM)',
    badge: 'Selling Live',
    suggestedPrices: [1499, 1799, 1999, 2299, 2499],
  },
  {
    id: 'magazine',
    name: 'Photo Magazine',
    icon: '📖',
    categorySlugs: ['magazine'],
    status: 'active',
    description: 'Custom Physical Editorial Magazine Studio & Preflight Print',
    badge: 'Selling Live',
    suggestedPrices: [1299, 1499, 1799, 1999],
  },
  {
    id: 'posters',
    name: 'Framed Art Posters',
    icon: '🖼️',
    categorySlugs: ['posters'],
    status: 'active',
    description: 'Giclée Fine Art & High-Definition Framed Wall Posters',
    badge: 'Selling Live',
    suggestedPrices: [399, 499, 699, 899, 1299],
  },
  {
    id: 'split-posters',
    name: 'Split Posters',
    icon: '🧩',
    categorySlugs: ['split-posters'],
    status: 'active',
    description: 'Multi-Panel Split Art (3-Piece, 5-Piece Stepped Canvas)',
    badge: 'Selling Live',
    suggestedPrices: [1299, 1499, 1899, 2299, 2799],
  },
  {
    id: 'wall-studio',
    name: 'Wall Studio Compositions',
    icon: '🏛️',
    categorySlugs: ['wall-studio'],
    status: 'active',
    description: 'Prebuilt Architectural Gallery Walls & Layout Systems',
    badge: 'Selling Live',
    suggestedPrices: [1499, 1999, 2499, 2999, 3999],
  },
  {
    id: 'mugs-cups',
    name: 'Cups & Mugs',
    icon: '☕',
    categorySlugs: ['mugs-cups'],
    status: 'coming-soon',
    description: 'Custom Ceramic Stoneware & Insulated Travel Tumblers',
    badge: 'Coming Soon',
    suggestedPrices: [349, 399, 449, 499, 599],
  },
  {
    id: 'skins',
    name: 'Device Skins',
    icon: '📱',
    categorySlugs: ['skins'],
    status: 'coming-soon',
    description: 'Precision Vinyl Tech Armor for Laptops & Phones',
    badge: 'Coming Soon',
    suggestedPrices: [399, 499, 599, 699],
  },
  {
    id: 'stationery',
    name: 'Stationery & Journals',
    icon: '📓',
    categorySlugs: ['stationery'],
    status: 'coming-soon',
    description: 'Custom Hardcover Notebooks, Daily Planners & Journals',
    badge: 'Coming Soon',
    suggestedPrices: [449, 499, 599, 699],
  },
  {
    id: 'accessories',
    name: 'Accessories & Misc',
    icon: '🎒',
    categorySlugs: ['accessories', 'prints'],
    status: 'coming-soon',
    description: 'Keychains, Caps, Statement Stickers & Photo Prints',
    badge: 'Coming Soon',
    suggestedPrices: [199, 299, 399, 499],
  },
];

export function ProductsClient({
  products,
  categories: _categories,
}: {
  products: ProductRow[];
  categories: CategoryOption[];
}) {
  const { toast, show, dismiss } = useToast();
  const [productList, setProductList] = useState<ProductRow[]>(products);
  const [search, setSearch] = useState('');
  const [selectedCustomerCat, setSelectedCustomerCat] = useState<string>('all');
  const [sellingStatusFilter, setSellingStatusFilter] = useState<'all' | 'active' | 'coming-soon'>(
    'all'
  );
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Product title/name editing state
  const [editingNameProductId, setEditingNameProductId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');
  const [savingNameId, setSavingNameId] = useState<string | null>(null);
  const [recentlySavedNameId, setRecentlySavedNameId] = useState<string | null>(null);

  // Price editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [syncVariants, setSyncVariants] = useState<boolean>(true);
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);

  // Variant price editing state
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editVariantPriceValue, setEditVariantPriceValue] = useState<string>('');
  const [savingVariantPriceId, setSavingVariantPriceId] = useState<string | null>(null);

  // Batch category price state
  const [batchModalCategory, setBatchModalCategory] = useState<CustomerSellingCategory | null>(
    null
  );
  const [batchPriceValue, setBatchPriceValue] = useState<string>('');
  const [batchSyncVariants, setBatchSyncVariants] = useState<boolean>(true);
  const [isBatchSaving, setIsBatchSaving] = useState<boolean>(false);

  useEffect(() => {
    setProductList(products);
  }, [products]);

  // Compute product count per customer category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: productList.length };
    CUSTOMER_SELLING_CATEGORIES.forEach((cat) => {
      counts[cat.id] = productList.filter((p) =>
        cat.categorySlugs.includes(p.categorySlug.toLowerCase())
      ).length;
    });
    return counts;
  }, [productList]);

  // Filtered products list
  const filtered = useMemo(() => {
    return productList.filter((p) => {
      // 1. Search Query
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.categorySlug.toLowerCase().includes(search.toLowerCase());

      // 2. Customer Selling Category Filter
      let matchCustomerCat = true;
      if (selectedCustomerCat !== 'all') {
        const targetCat = CUSTOMER_SELLING_CATEGORIES.find((c) => c.id === selectedCustomerCat);
        if (targetCat) {
          matchCustomerCat = targetCat.categorySlugs.includes(p.categorySlug.toLowerCase());
        } else {
          matchCustomerCat = p.categorySlug.toLowerCase() === selectedCustomerCat.toLowerCase();
        }
      }

      // 3. Selling Status (Live vs Coming Soon)
      let matchStatus = true;
      if (sellingStatusFilter !== 'all') {
        const isComingSoon = isCategoryComingSoon(p.categorySlug);
        if (sellingStatusFilter === 'active') {
          matchStatus = !isComingSoon;
        } else if (sellingStatusFilter === 'coming-soon') {
          matchStatus = isComingSoon;
        }
      }

      // 4. Stock Filter
      const matchStock =
        stockFilter === 'all' ||
        (stockFilter === 'instock' && p.variants.some((v) => v.inStock)) ||
        (stockFilter === 'outofstock' && p.variants.every((v) => !v.inStock)) ||
        (stockFilter === 'lowstock' &&
          p.variants.some((v) => v.inStock && v.stockQuantity <= v.reorderThreshold));

      return matchSearch && matchCustomerCat && matchStatus && matchStock;
    });
  }, [productList, search, selectedCustomerCat, sellingStatusFilter, stockFilter]);

  // Current selected category metadata
  const currentCategoryMeta = useMemo(() => {
    if (selectedCustomerCat === 'all') return null;
    return CUSTOMER_SELLING_CATEGORIES.find((c) => c.id === selectedCustomerCat) || null;
  }, [selectedCustomerCat]);

  // Stats for the currently selected customer category
  const categoryStats = useMemo(() => {
    if (filtered.length === 0) return null;
    const prices = filtered.map((p) => p.basePrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((acc, val) => acc + val, 0) / prices.length);
    return { min, max, avg, count: filtered.length };
  }, [filtered]);

  async function handleSaveProductName(productId: string) {
    const trimmed = editNameValue.trim();
    if (!trimmed) {
      show('Product name cannot be empty.', 'error');
      return;
    }

    setSavingNameId(productId);
    try {
      await updateProductName(productId, trimmed);
      setProductList((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, name: trimmed } : p))
      );
      setEditingNameProductId(null);
      setRecentlySavedNameId(productId);
      setTimeout(() => setRecentlySavedNameId(null), 2500);
      show(`Product name updated to "${trimmed}"! Live in storefront.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update product name';
      show(msg, 'error');
    } finally {
      setSavingNameId(null);
    }
  }

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
        })
      );
      setEditingProductId(null);
      setRecentlySavedId(productId);
      setTimeout(() => setRecentlySavedId(null), 2500);
      show(`Base price updated to ₹${newPrice.toLocaleString('en-IN')}! Live in store.`, 'success');
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
        })
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

  async function handleApplyBatchCategoryPrice() {
    if (!batchModalCategory) return;
    const newPrice = parseFloat(batchPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      show('Please enter a valid positive price.', 'error');
      return;
    }

    setIsBatchSaving(true);
    try {
      const primarySlug = batchModalCategory.categorySlugs[0];
      const res = await batchUpdateCategoryPrice(primarySlug, newPrice, batchSyncVariants);

      setProductList((prev) =>
        prev.map((p) => {
          if (batchModalCategory.categorySlugs.includes(p.categorySlug.toLowerCase())) {
            return {
              ...p,
              basePrice: newPrice,
              variants: batchSyncVariants
                ? p.variants.map((v) => ({ ...v, price: newPrice }))
                : p.variants,
            };
          }
          return p;
        })
      );

      show(
        `Batch price updated! ${res.count} products in ${batchModalCategory.name} are now ₹${newPrice.toLocaleString('en-IN')}.`,
        'success'
      );
      setBatchModalCategory(null);
      setBatchPriceValue('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply batch category price';
      show(msg, 'error');
    } finally {
      setIsBatchSaving(false);
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
          }))
        );
        show(`Variant marked ${!current ? 'in stock' : 'out of stock'}`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update stock';
        show(msg, 'error');
      }
    });
  }

  return (
    <div className="space-y-5 pb-16">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-bone">Product Catalog &amp; Pricing</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#3B5EFF]/15 text-[#7B9EFF] border border-[#3B5EFF]/30">
              {productList.length} Products
            </span>
          </div>
          <p className="text-xs text-ash/70 mt-0.5">
            Categorized exactly as sold to customers. Click any price to edit live or batch-update entire lines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/40 border border-white/10 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-ash/60 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'grouped'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-ash/60 hover:text-white'
              }`}
              title="Grouped by Selling Category View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grouped</span>
            </button>
          </div>

          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#3B5EFF] hover:bg-[#2a4de8] text-white text-xs font-semibold rounded-lg transition-colors shadow-lg hover:shadow-[#3B5EFF]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── 1. Customer-Facing Category Navigation Pills ────────────────── */}
      <div className="bg-black/30 rounded-2xl border border-white/10 p-3 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ash/80 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#3B5EFF]" />
            <span>Customer Selling Categories</span>
          </span>

          {/* Quick Status Filter: All / Live / Coming Soon */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setSellingStatusFilter('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                sellingStatusFilter === 'all'
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-ash/60 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSellingStatusFilter('active')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                sellingStatusFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-ash/60 hover:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Selling Live</span>
            </button>
            <button
              type="button"
              onClick={() => setSellingStatusFilter('coming-soon')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                sellingStatusFilter === 'coming-soon'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-ash/60 hover:text-amber-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Coming Soon</span>
            </button>
          </div>
        </div>

        {/* Category Pills Carousel / Wrap */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {/* All Tab */}
          <button
            type="button"
            onClick={() => setSelectedCustomerCat('all')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
              selectedCustomerCat === 'all'
                ? 'bg-[#3B5EFF] border-[#3B5EFF] text-white shadow-md shadow-[#3B5EFF]/20 font-bold'
                : 'bg-white/5 border-white/10 text-ash hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🌟 All Products</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                selectedCustomerCat === 'all'
                  ? 'bg-black/30 text-white'
                  : 'bg-white/10 text-ash/70'
              }`}
            >
              {categoryCounts.all}
            </span>
          </button>

          {/* Individual Customer Selling Categories */}
          {CUSTOMER_SELLING_CATEGORIES.filter((cat) => {
            if (sellingStatusFilter === 'active') return cat.status === 'active';
            if (sellingStatusFilter === 'coming-soon') return cat.status === 'coming-soon';
            return true;
          }).map((cat) => {
            const isSelected = selectedCustomerCat === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCustomerCat(cat.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-md font-bold'
                    : 'bg-white/5 border-white/10 text-ash/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-black/15 text-black' : 'bg-white/10 text-ash/60'
                  }`}
                >
                  {count}
                </span>
                {cat.status === 'coming-soon' && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-amber-600' : 'bg-amber-400'
                    }`}
                    title="Coming Soon in Store"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Category Highlight Banner & Quick Batch Price Updater ───── */}
      {currentCategoryMeta && (
        <div className="bg-gradient-to-r from-[#171B26] via-[#111319] to-[#151922] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
              {currentCategoryMeta.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-bone">{currentCategoryMeta.name}</h2>
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    currentCategoryMeta.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {currentCategoryMeta.badge}
                </span>
              </div>
              <p className="text-xs text-ash/70 mt-0.5">{currentCategoryMeta.description}</p>
              {categoryStats && (
                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-ash/80 flex-wrap">
                  <span>
                    Products: <strong className="text-bone">{categoryStats.count}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Range:{' '}
                    <strong className="text-emerald-400">
                      ₹{categoryStats.min.toLocaleString('en-IN')} – ₹
                      {categoryStats.max.toLocaleString('en-IN')}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Average: <strong className="text-bone">₹{categoryStats.avg.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Batch Update Button for this Category */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setBatchModalCategory(currentCategoryMeta);
                setBatchPriceValue(
                  categoryStats?.avg ? String(categoryStats.avg) : String(currentCategoryMeta.suggestedPrices[0])
                );
              }}
              className="w-full md:w-auto px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Set Uniform Price for All {currentCategoryMeta.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Search & Stock Filter Bar ─────────────────────────────────── */}
      <div className="bg-black/20 rounded-xl border border-white/10 p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ash/60 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products by title, slug, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-white/10 rounded-lg bg-black/40 text-bone placeholder:text-ash/40 focus:outline-none focus:border-[#3B5EFF]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ash/50 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="text-xs border border-white/10 rounded-lg px-3 py-2 bg-black/40 text-bone focus:outline-none focus:border-[#3B5EFF] min-w-[130px]"
        >
          <option value="all">All Stock Levels</option>
          <option value="instock">In Stock Only</option>
          <option value="outofstock">Out of Stock</option>
          <option value="lowstock">Low Stock Alerts</option>
        </select>

        <span className="text-xs text-ash/60 font-mono ml-auto">
          Showing <strong>{filtered.length}</strong> of {productList.length}
        </span>
      </div>

      {/* ── 4. Main Products Presentation (Table or Grouped View) ────────── */}
      {viewMode === 'table' ? (
        <div className="bg-black/20 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="bg-black/50 border-b border-white/10">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-ash/70 uppercase tracking-wider">
                    Product Title &amp; Slug
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-ash/70 uppercase tracking-wider">
                    Selling Category
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-ash/70 uppercase tracking-wider">
                    Base Price (Live)
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-ash/70 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-ash/70 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-ash/70 uppercase tracking-wider">
                    Customer Status
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-ash/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-ash/60">
                      No products match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => renderProductRow(product))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── GROUPED BY CATEGORY VIEW ────────────────────────────────────── */
        <div className="space-y-6">
          {CUSTOMER_SELLING_CATEGORIES.map((cat) => {
            const catProducts = filtered.filter((p) =>
              cat.categorySlugs.includes(p.categorySlug.toLowerCase())
            );
            if (catProducts.length === 0) return null;

            return (
              <div
                key={cat.id}
                className="bg-black/25 rounded-2xl border border-white/10 overflow-hidden shadow-xl"
              >
                {/* Category Header */}
                <div className="px-5 py-3.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-bone">{cat.name}</h3>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.2 rounded-full border ${
                            cat.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {cat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-ash/60">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-ash/70">
                      {catProducts.length} {catProducts.length === 1 ? 'Product' : 'Products'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchModalCategory(cat);
                        setBatchPriceValue(String(cat.suggestedPrices[0]));
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span>Set Price for Category</span>
                    </button>
                  </div>
                </div>

                {/* Table for this category */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs whitespace-nowrap">
                    <tbody className="divide-y divide-white/5">
                      {catProducts.map((product) => renderProductRow(product))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. Batch Category Price Modal ─────────────────────────────────── */}
      {batchModalCategory && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setBatchModalCategory(null)}
        >
          <div
            className="w-full max-w-md bg-[#13151D] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-2 bg-white/5 rounded-xl border border-white/10">
                  {batchModalCategory.icon}
                </span>
                <div>
                  <h3 className="text-base font-bold text-bone">
                    Update {batchModalCategory.name}
                  </h3>
                  <p className="text-xs text-ash/60">
                    Set a uniform base price for all products in this customer category
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalCategory(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Input Form */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                New Base Price (₹ INR)
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base font-bold text-emerald-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={batchPriceValue}
                  onChange={(e) => setBatchPriceValue(e.target.value)}
                  placeholder="e.g. 799"
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 bg-black/60 border border-white/20 focus:border-emerald-400 rounded-xl text-lg font-mono font-bold text-white focus:outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-ash/60">Presets:</span>
                {batchModalCategory.suggestedPrices.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBatchPriceValue(String(preset))}
                    className={`px-2.5 py-1 rounded-lg border font-mono text-xs transition-all ${
                      batchPriceValue === String(preset)
                        ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/15'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              {/* Sync variants checkbox */}
              <label className="flex items-center gap-2 pt-2 text-xs text-white/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={batchSyncVariants}
                  onChange={(e) => setBatchSyncVariants(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-black/60 border-white/20 focus:ring-emerald-400"
                />
                <span>Also synchronize all variants (colors/sizes) to this base price</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setBatchModalCategory(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-ash text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBatchCategoryPrice}
                disabled={isBatchSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isBatchSaving ? (
                  <span>Applying Price…</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Apply Price Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Confirm Delete Dialog ─────────────────────────────────────── */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete product"
          description="This will permanently delete this product and all its variants from the store database. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* ── 7. Toast Alerts ──────────────────────────────────────────────── */}
      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );

  // Helper to render individual product row with fast inline price editor
  function renderProductRow(product: ProductRow) {
    const inStockCount = product.variants.filter((v) => v.inStock).length;
    const lowStock = product.variants.some(
      (v) => v.inStock && v.stockQuantity <= v.reorderThreshold && v.stockQuantity > 0
    );
    const outOfStock = product.variants.every((v) => !v.inStock);
    const stockVariant = outOfStock ? 'out-of-stock' : lowStock ? 'low-stock' : 'active';
    const stockLabel = outOfStock
      ? 'Out of stock'
      : lowStock
      ? `Low (${inStockCount}/${product.variants.length})`
      : `${inStockCount}/${product.variants.length} in stock`;

    const isExpanded = expandedId === product.id;
    const isEditingPrice = editingProductId === product.id;
    const isEditingName = editingNameProductId === product.id;
    const isRecentlySaved = recentlySavedId === product.id;
    const isRecentlySavedName = recentlySavedNameId === product.id;
    const isComingSoon = isCategoryComingSoon(product.categorySlug);

    // Find suggested prices based on category
    const matchedCategory = CUSTOMER_SELLING_CATEGORIES.find((c) =>
      c.categorySlugs.includes(product.categorySlug.toLowerCase())
    );

    return (
      <Fragment key={product.id}>
        <tr
          className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${
            isExpanded ? 'bg-blue-500/[0.07]' : ''
          } ${isRecentlySaved ? 'bg-emerald-500/10' : ''} ${isRecentlySavedName ? 'bg-blue-500/10' : ''}`}
          onClick={() => setExpandedId(isExpanded ? null : product.id)}
        >
          {/* Product Name & Slug (Live Inline Editable) */}
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            {isEditingName ? (
              <div className="flex flex-col gap-1.5 p-2 bg-black/90 border border-blue-500/50 rounded-xl shadow-2xl min-w-[260px] max-w-sm">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveProductName(product.id);
                      if (e.key === 'Escape') setEditingNameProductId(null);
                    }}
                    autoFocus
                    placeholder="Enter product title"
                    className="w-full px-2.5 py-1 text-xs bg-black border border-blue-400 rounded-lg text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveProductName(product.id)}
                    disabled={savingNameId === product.id}
                    title="Save live product title"
                    className="px-2.5 py-1 bg-[#3B5EFF] hover:bg-[#3B5EFF]/90 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {savingNameId === product.id ? '…' : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNameProductId(null)}
                    title="Cancel"
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-ash hover:text-white rounded-lg text-xs shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-ash/50 font-mono">Press Enter to save • Live in storefront</p>
              </div>
            ) : (
              <div className="group/name flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNameProductId(product.id);
                        setEditNameValue(product.name);
                      }}
                      title="Click to edit product name live"
                      className={`font-semibold text-left transition-colors flex items-center gap-1.5 rounded px-1.5 py-0.5 -ml-1.5 border border-transparent hover:border-white/15 hover:bg-white/5 cursor-pointer ${
                        isRecentlySavedName
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'text-bone hover:text-[#3B5EFF]'
                      }`}
                    >
                      <span className="truncate max-w-[260px]">{product.name}</span>
                      <Edit2 className="w-3 h-3 text-ash/30 group-hover/name:text-[#3B5EFF] transition-colors shrink-0" />
                    </button>
                    {product.featured && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#3B5EFF]/20 text-[#7B9EFF] rounded border border-[#3B5EFF]/30">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ash/50 font-mono mt-0.5">{product.slug}</p>
                </div>
              </div>
            )}
          </td>

          {/* Customer Selling Category */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span>{matchedCategory?.icon || '📦'}</span>
              <span className="text-bone/90 capitalize font-medium">
                {matchedCategory?.name || product.categorySlug}
              </span>
            </div>
          </td>

          {/* Base Price (Live Inline Editable) */}
          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
            {isEditingPrice ? (
              <div className="flex flex-col items-end gap-1.5 p-2 bg-black/90 border border-emerald-500/50 rounded-xl shadow-2xl">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-emerald-400 font-mono font-bold">₹</span>
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
                    placeholder="799"
                    className="w-24 px-2 py-1 text-sm bg-black border border-emerald-400 rounded-lg text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveBasePrice(product.id)}
                    disabled={savingPriceId === product.id}
                    title="Save live price"
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {savingPriceId === product.id ? '…' : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProductId(null)}
                    title="Cancel"
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-ash hover:text-white rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {/* Quick Preset Buttons for This Category */}
                {matchedCategory && (
                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-[9px] font-mono text-ash/60">Presets:</span>
                    {matchedCategory.suggestedPrices.slice(0, 4).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setEditPriceValue(String(amt))}
                        className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-mono text-white/90"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sync Variants Checkbox */}
                {product.variants.length > 0 && (
                  <label className="flex items-center gap-1.5 text-[10px] text-ash/80 cursor-pointer select-none pt-0.5">
                    <input
                      type="checkbox"
                      checked={syncVariants}
                      onChange={(e) => setSyncVariants(e.target.checked)}
                      className="w-3 h-3 rounded text-emerald-500 bg-black/60 border-white/20"
                    />
                    <span>Sync all {product.variants.length} variant prices</span>
                  </label>
                )}
              </div>
            ) : (
              <div className="group/price flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductId(product.id);
                    setEditPriceValue(String(product.basePrice));
                    setSyncVariants(true);
                  }}
                  title="Click to edit price live in store"
                  className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isRecentlySaved
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 text-white hover:border-[#3B5EFF] hover:bg-[#3B5EFF]/10'
                  }`}
                >
                  <span>₹{product.basePrice.toLocaleString('en-IN')}</span>
                  <Edit2 className="w-3 h-3 text-ash/40 group-hover/price:text-[#3B5EFF] transition-colors" />
                </button>
              </div>
            )}
          </td>

          {/* Variants Count */}
          <td className="px-4 py-3 text-center text-ash/80 font-mono">
            {product.variants.length}
          </td>

          {/* Stock Badge */}
          <td className="px-4 py-3">
            <AdminBadge variant={stockVariant} label={stockLabel} />
          </td>

          {/* Customer Selling Status */}
          <td className="px-4 py-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border ${
                isComingSoon
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isComingSoon ? 'bg-amber-400' : 'bg-emerald-400'}`}
              />
              <span>{isComingSoon ? 'Coming Soon' : 'Selling Live'}</span>
            </span>
          </td>

          {/* Actions */}
          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-2.5">
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="text-xs text-[#3B5EFF] hover:underline font-semibold"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setDeleteConfirm(product.id)}
                className="text-xs text-red-500/80 hover:text-red-400 hover:underline font-medium cursor-pointer"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>

        {/* ── Expanded Variants Row with Variant Price Editor ───────────── */}
        {isExpanded && (
          <tr key={`${product.id}-expanded`}>
            <td colSpan={7} className="px-4 py-3 bg-[#111319] border-y border-white/10">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-ash/80 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B5EFF]" />
                    <span>Variants Pricing &amp; Inventory</span>
                  </p>
                  <span className="text-[11px] text-ash/50">
                    Click the pencil on any variant to set custom pricing per color/size
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {product.variants.map((v) => {
                    const isEditingVarPrice = editingVariantId === v.id;
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-3 bg-black/40 rounded-xl px-3.5 py-2 border border-white/5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0 shadow"
                            style={{ background: v.colorHex }}
                          />
                          <span className="text-xs text-bone font-medium truncate">
                            {v.name}
                          </span>
                        </div>

                        {/* Variant Price Editor */}
                        <div className="flex items-center gap-2 shrink-0">
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
                                className="w-20 px-1.5 py-0.5 text-xs bg-black border border-[#3B5EFF] rounded text-bone font-mono focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveVariantPrice(product.id, v.id)}
                                disabled={savingVariantPriceId === v.id}
                                className="px-1.5 py-0.5 bg-emerald-600/30 text-emerald-400 rounded text-[11px] font-bold"
                              >
                                {savingVariantPriceId === v.id ? '…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingVariantId(null)}
                                className="px-1 py-0.5 text-ash hover:text-white text-[11px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="group/var flex items-center gap-1">
                              <span className="text-xs text-bone font-mono font-semibold">
                                ₹{v.price.toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingVariantId(v.id);
                                  setEditVariantPriceValue(String(v.price));
                                }}
                                title="Edit variant price"
                                className="p-1 text-ash/40 group-hover/var:text-[#3B5EFF] hover:bg-white/10 rounded"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}

                          {/* Stock Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleStock(v.id, v.inStock)}
                            disabled={isPending}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-colors ${
                              v.inStock
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                          >
                            {v.inStock ? 'In Stock' : 'Out'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  }
}
