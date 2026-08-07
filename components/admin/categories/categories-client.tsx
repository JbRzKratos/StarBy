'use client';

import React, { useState, useTransition } from 'react';
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
    'w-full text-sm border border-smoke bg-graphite text-bone rounded-sm px-3 py-2.5 focus:outline-none focus:border-cobalt font-mono';

  const FormPanel = (
    <div className="bg-charcoal rounded-sm border border-smoke p-5 space-y-3">
      <h2 className="text-body-lg font-display text-bone">
        {editId ? 'Edit Category' : 'New Category'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Name</label>
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
          <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Slug</label>
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
        <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Tagline</label>
        <input
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          className={inputClass}
          placeholder="Short tagline"
        />
      </div>
      <div>
        <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Description</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${inputClass} resize-none`}
          placeholder="Category description"
        />
      </div>
      <div>
        <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Gradient CSS classes</label>
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
          className="px-6 py-3 bg-cobalt text-bone text-caption font-mono uppercase tracking-widest hover:bg-cobalt/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => {
            setEditId(null);
            setShowCreate(false);
          }}
          className="px-6 py-3 text-caption font-mono uppercase tracking-widest text-ash hover:text-bone"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm font-bold text-bone mb-2">Categories Manager</h1>
          <p className="font-mono text-body-sm text-pearl">{categories.length} categories</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-6 py-3 bg-cobalt text-bone text-caption font-mono uppercase tracking-widest hover:bg-cobalt/90 transition-colors"
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

      <div className="bg-charcoal rounded-sm border border-smoke overflow-hidden">
        <table className="w-full text-left font-mono text-body-sm text-bone">
          <thead className="bg-graphite border-b border-smoke">
            <tr>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Name
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Tagline
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-center">
                Products
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke">
            {categories.map((cat) => (
              <React.Fragment key={cat.id}>
                <tr className="hover:bg-smoke/10">
                  <td className="px-6 py-4">
                    <p className="font-medium text-bone">{cat.name}</p>
                    <p className="text-caption text-ash mt-1">{cat.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-pearl">{cat.tagline}</td>
                  <td className="px-6 py-4 text-center">
                    {cat.productCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-cobalt uppercase text-caption hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="text-ember uppercase text-caption hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {editId === cat.id && (
                  <tr key={`${cat.id}-edit`}>
                    <td colSpan={4} className="px-6 py-6 bg-graphite/50 border-t border-smoke/30">
                      {FormPanel}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ash">
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
