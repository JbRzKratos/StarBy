'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SavedDesign {
  id: string;
  productId: string;
  title: string | null;
  previewUrl: string | null;
  createdAt: string;
}

export function SavedDesigns() {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const res = await fetch('/api/customizer/user');
      const data = await res.json();
      if (data.success) {
        setDesigns(data.designs);
      }
    } catch (err) {
      console.error('Failed to fetch designs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this design?')) return;

    setDeleting(id);
    try {
      const res = await fetch('/api/customizer/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setDesigns((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete design', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4">Loading designs...</div>;
  }

  if (designs.length === 0) {
    return (
      <div className="bg-graphite border border-smoke p-8 text-center rounded-sm">
        <h3 className="font-mono text-pearl mb-2">No saved designs</h3>
        <p className="text-ash mb-6">You haven't created any custom designs yet.</p>
        <Link
          href="/products/all"
          className="inline-block px-6 py-2 border border-cobalt text-cobalt font-mono hover:bg-cobalt hover:text-bone transition-colors"
        >
          Start Creating
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {designs.map((design) => (
        <div
          key={design.id}
          className="bg-graphite border border-smoke flex flex-col rounded-sm overflow-hidden group"
        >
          <div className="relative aspect-square bg-night">
            {design.previewUrl ? (
              <Image
                src={design.previewUrl}
                alt={design.title || 'Design'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-ash font-mono text-sm">
                No Preview
              </div>
            )}
            <div className="absolute inset-0 bg-night/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <Link
                href={`/customize/${design.productId}?designId=${design.id}`}
                className="bg-cobalt text-bone px-4 py-2 font-mono text-xs uppercase tracking-wider"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(design.id)}
                disabled={deleting === design.id}
                className="bg-red-500/80 text-bone px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deleting === design.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-mono text-bone text-sm truncate">{design.title || 'My Design'}</h3>
            <p className="text-ash text-xs mt-1">
              {new Date(design.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
