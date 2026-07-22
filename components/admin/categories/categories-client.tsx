'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import { createCategory, updateCategory, deleteCategory } from '@/app/admin/lib/actions';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline: string;
  gradient: string;
  featured: boolean;
  productCount: number;
}

const BLANK = {
  slug: '',
  name: '',
  description: '',
  tagline: '',
  gradient: 'from-gray-500 to-gray-700',
};

export function CategoriesClient({ categories }: { categories: CategoryRow[] }) {
  const { toast, show, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK);

  function openEdit(cat: CategoryRow) {
    setEditId(cat.id);
    setForm({
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      tagline: cat.tagline,
      gradient: cat.gradient,
    });
    setShowCreate(false);
  }

  function openCreate() {
    setShowCreate(true);
    setEditId(null);
    setForm(BLANK);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        if (editId) {
          await updateCategory(editId, {
            name: form.name,
            description: form.description,
            tagline: form.tagline,
            gradient: form.gradient,
          });
          show('Category updated', 'success');
        } else {
          await createCategory(form);
          show('Category created', 'success');
        }
        setEditId(null);
        setShowCreate(false);
      } catch (e) {
        show(e instanceof Error ? e.message : 'Error', 'error');
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteCategory(deleteId);
        show('Category deleted', 'success');
      } catch (e) {
        show(e instanceof Error ? e.message : 'Cannot delete', 'error');
      } finally {
        setDeleteId(null);
      }
    });
  }

  const inputClass =
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF]';

  const FormPanel = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-900">
        {editId ? 'Edit Category' : 'New Category'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Name</label>
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
            placeholder="Category name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={`${inputClass} font-mono`}
            placeholder="category-slug"
            disabled={!!editId}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Tagline</label>
        <input
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          className={inputClass}
          placeholder="Short tagline"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Description</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${inputClass} resize-none`}
          placeholder="Category description"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Gradient CSS classes</label>
        <input
          value={form.gradient}
          onChange={(e) => setForm({ ...form, gradient: e.target.value })}
          className={inputClass}
          placeholder="from-gray-500 to-gray-700"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={isPending || !form.name}
          className="px-4 py-2 bg-[#3B5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#2a4de8] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => {
            setEditId(null);
            setShowCreate(false);
          }}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <button
          onClick={openCreate}
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
          Add Category
        </button>
      </div>

      {showCreate && FormPanel}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tagline
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Products
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <>
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{cat.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{cat.tagline}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">
                    {cat.productCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-xs text-[#3B5EFF] hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="text-xs text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {editId === cat.id && (
                  <tr key={`${cat.id}-edit`}>
                    <td colSpan={4} className="px-4 pb-4 bg-blue-50/20">
                      {FormPanel}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                  No categories yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Delete category"
          description="Are you sure? This fails if products are still assigned to this category."
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
