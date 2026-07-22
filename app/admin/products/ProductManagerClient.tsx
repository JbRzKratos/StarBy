'use client';

import { useState, useTransition } from 'react';
import { toggleVariantStock, deleteProduct, addProduct } from '../actions';

export interface ProductVariant {
  id: string;
  name: string;
  color?: string;
  colorHex?: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  categorySlug: string;
  basePrice: number | string;
  variants: ProductVariant[];
}

type ProductManagerClientProps = {
  products: Product[];
};

export function ProductManagerClient({ products: initialProducts }: ProductManagerClientProps) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categorySlug: 'tees',
    basePrice: '1000',
    tagline: '',
    description: '',
  });

  const handleToggleStock = (variantId: string, currentStock: boolean) => {
    startTransition(async () => {
      await toggleVariantStock(variantId, !currentStock);
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      startTransition(async () => {
        await deleteProduct(productId);
      });
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await addProduct({
        name: formData.name,
        slug: formData.slug,
        categorySlug: formData.categorySlug,
        basePrice: parseFloat(formData.basePrice),
        tagline: formData.tagline,
        description: formData.description,
      });
      setShowAddForm(false);
      setFormData({
        name: '',
        slug: '',
        categorySlug: 'tees',
        basePrice: '1000',
        tagline: '',
        description: '',
      });
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-display-sm font-bold text-bone mb-2">
            Products Manager
          </h1>
          <p className="font-mono text-body-sm text-pearl">
            Add, edit, or delete products and manage variant stock availability.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-cobalt text-bone font-mono text-caption uppercase tracking-widest px-6 py-3 hover:bg-cobalt/90 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddProduct}
          className="bg-charcoal border border-smoke p-6 rounded-sm space-y-4"
        >
          <h2 className="font-display text-body-lg text-bone mb-4 border-b border-smoke pb-2">
            Add New Product
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              required
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-graphite border border-smoke text-bone font-mono text-body-sm p-3 focus:border-cobalt outline-none"
            />
            <input
              required
              placeholder="Slug (e.g. unique-tee)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="bg-graphite border border-smoke text-bone font-mono text-body-sm p-3 focus:border-cobalt outline-none"
            />
            <input
              required
              placeholder="Category Slug"
              value={formData.categorySlug}
              onChange={(e) => setFormData({ ...formData, categorySlug: e.target.value })}
              className="bg-graphite border border-smoke text-bone font-mono text-body-sm p-3 focus:border-cobalt outline-none"
            />
            <input
              required
              type="number"
              placeholder="Base Price"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              className="bg-graphite border border-smoke text-bone font-mono text-body-sm p-3 focus:border-cobalt outline-none"
            />
            <input
              required
              placeholder="Tagline"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="bg-graphite border border-smoke text-bone font-mono text-body-sm p-3 focus:border-cobalt outline-none col-span-2"
            />
            <textarea
              required
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-graphite border border-smoke text-bone font-mono text-body-sm p-3 focus:border-cobalt outline-none col-span-2 h-24"
            />
          </div>
          <button
            disabled={isPending}
            type="submit"
            className="bg-emerald-600 text-bone font-mono text-caption uppercase px-6 py-3 disabled:opacity-50 mt-4"
          >
            Save Product
          </button>
        </form>
      )}

      <div className="space-y-6">
        {initialProducts.map((product) => (
          <div
            key={product.id}
            className="bg-charcoal border border-smoke rounded-sm overflow-hidden flex flex-col"
          >
            <div className="bg-graphite border-b border-smoke p-4 flex justify-between items-center">
              <div>
                <h3 className="font-display text-body-lg font-bold text-bone">{product.name}</h3>
                <p className="font-mono text-caption text-ash">
                  {product.categorySlug} • ₹{product.basePrice} • {product.variants.length} variants
                </p>
              </div>
              <button
                disabled={isPending}
                onClick={() => handleDeleteProduct(product.id)}
                className="text-ember font-mono text-caption uppercase hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
            <div className="p-4">
              {product.variants.length === 0 ? (
                <p className="font-mono text-caption text-ash">
                  No variants exist for this product.
                </p>
              ) : (
                <table className="w-full text-left font-mono text-body-sm text-bone">
                  <thead>
                    <tr className="border-b border-smoke/50 text-ash">
                      <th className="py-2 font-normal">Variant Name</th>
                      <th className="py-2 font-normal">Color</th>
                      <th className="py-2 font-normal">Stock Status</th>
                      <th className="py-2 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-smoke/30">
                    {product.variants.map((v: ProductVariant) => (
                      <tr key={v.id} className="hover:bg-smoke/10">
                        <td className="py-3">{v.name}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full border border-smoke"
                              style={{ backgroundColor: v.colorHex }}
                            />
                            <span>{v.color}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          {v.inStock ? (
                            <span className="text-emerald-400">In Stock</span>
                          ) : (
                            <span className="text-ember">Out of Stock</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            disabled={isPending}
                            onClick={() => handleToggleStock(v.id, v.inStock)}
                            className="text-cobalt hover:underline uppercase text-caption disabled:opacity-50"
                          >
                            Toggle Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
