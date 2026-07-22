'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AdminToast, useToast } from '../ui/confirm-dialog';
import {
  createProduct,
  updateProduct,
  createVariant,
  deleteVariant,
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
  const [variants, setVariants] = useState<VariantData[]>(initialVariants);
  const [newVariant, setNewVariant] = useState({ ...BLANK_VARIANT });
  const [showVariantForm, setShowVariantForm] = useState(false);

  function handleSubmit() {
    startTransition(async () => {
      try {
        const data = {
          ...form,
          tags: tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          sizes: sizesInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
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
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF]';

  return (
    <div className="space-y-5">
      {/* Main info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Product Name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, ''),
                })
              }
              className={inputClass}
              placeholder="e.g. Premium Phone Skin"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={`${inputClass} font-mono`}
              placeholder="e.g. premium-phone-skin"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Tagline</label>
          <input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className={inputClass}
            placeholder="Short descriptor"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
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
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
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
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Base Price (₹)</label>
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
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Sizes (comma-separated)
          </label>
          <input
            value={sizesInput}
            onChange={(e) => setSizesInput(e.target.value)}
            className={inputClass}
            placeholder="e.g. S, M, L, XL"
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4 rounded accent-[#3B5EFF]"
            />
            <span className="text-sm text-gray-700 font-medium">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.customizable}
              onChange={(e) => setForm({ ...form, customizable: e.target.checked })}
              className="w-4 h-4 rounded accent-[#3B5EFF]"
            />
            <span className="text-sm text-gray-700 font-medium">Customizable</span>
          </label>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Variants ({variants.length})</h2>
          <button
            onClick={() => setShowVariantForm(!showVariantForm)}
            className="text-xs text-[#3B5EFF] hover:underline font-medium"
          >
            {showVariantForm ? 'Cancel' : '+ Add Variant'}
          </button>
        </div>

        {showVariantForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Variant Name</label>
                <input
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Midnight Black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Color Name</label>
                <input
                  value={newVariant.color}
                  onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Color Hex</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newVariant.colorHex}
                    onChange={(e) => setNewVariant({ ...newVariant, colorHex: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                  />
                  <input
                    value={newVariant.colorHex}
                    onChange={(e) => setNewVariant({ ...newVariant, colorHex: e.target.value })}
                    className={`${inputClass} flex-1 font-mono`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Stock Qty</label>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reorder Threshold
                </label>
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
            <p className="text-sm text-gray-400 italic">No variants yet</p>
          )}
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100"
            >
              <span
                className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
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
                onClick={() => handleDeleteVariant(v.id)}
                className="text-xs text-red-500 hover:text-red-700 ml-2"
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
          className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
