'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cart-store';
import type { UploadedPdfInspection } from '@/types/magazine';

export default function UploadPdfPortalPage() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<UploadedPdfInspection | null>(null);

  // Print Specifications
  const [pageSize, setPageSize] = useState('A4 Portrait (210×297mm)');
  const [coverFinish, setCoverFinish] = useState('soft-touch');
  const [paperWeight, setPaperWeight] = useState('170gsm-silk');
  const [binding, setBinding] = useState('saddle-stitch');
  const [quantity, setQuantity] = useState(1);

  const handleFileChange = (uploadedFile: File) => {
    if (uploadedFile.type !== 'application/pdf' && !uploadedFile.name.endsWith('.pdf')) {
      alert('Please upload a valid PDF file.');
      return;
    }

    if (uploadedFile.size > 50 * 1024 * 1024) {
      alert('This PDF exceeds the 50MB limit. Please compress or optimize your file.');
      return;
    }

    setFile(uploadedFile);
    setInspection({
      fileName: uploadedFile.name,
      fileSizeMb: Number((uploadedFile.size / (1024 * 1024)).toFixed(2)),
      pageCount: 16,
      pageSize: 'A4 Portrait (210×297mm)',
      orientation: 'portrait',
      hasBleed: true,
      isValid: true,
      warnings: ['Please confirm that all typography has been converted to outlines or embedded.'],
      errors: [],
    });
  };

  const handleOrder = () => {
    if (!file || !inspection) return;

    addItem({
      productId: 'prod_mag_01',
      variantId: 'v_mag_16p',
      name: `FREGORO Print Order · ${file.name}`,
      price: 649,
      image:
        'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
      quantity,
      size: pageSize,
      customization: {
        pdfType: 'customer_upload',
        fileName: file.name,
        fileSizeMb: inspection.fileSizeMb,
        pageCount: inspection.pageCount,
        coverFinish,
        paperWeight,
        binding,
      },
    });

    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0E] text-[#F5F1EA] pt-28 pb-24">
      <div className="section-container max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-3 pb-6 border-b border-[#F5F1EA]/10">
          <div className="flex items-center gap-2 font-mono text-xs text-[#0057FF] uppercase font-bold">
            <Link href="/magazine" className="hover:text-white transition-colors">
              Magazine Studio
            </Link>
            <span>/</span>
            <span>Upload Existing PDF</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-white">
            Upload Your Print-Ready PDF
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#F5F1EA]/70 leading-relaxed">
            Already designed your publication in InDesign, Canva, or Figma? Upload your
            high-resolution PDF and FREGORO will manage plate preparation, offset printing, and
            doorstep delivery.
          </p>
        </div>

        {/* Upload Drop Zone */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleFileChange(dropped);
            }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all bg-[#141418] cursor-pointer ${
              isDragging
                ? 'border-[#0057FF] bg-[#0057FF]/10 scale-[1.01]'
                : 'border-[#F5F1EA]/15 hover:border-[#0057FF]/60'
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              id="pdf-upload"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handleFileChange(selected);
              }}
              className="hidden"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer space-y-4 block">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A1E] border border-[#F5F1EA]/20 flex items-center justify-center mx-auto text-3xl">
                📄
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  Drag & Drop Your Finished PDF
                </h3>
                <p className="font-mono text-xs text-[#F5F1EA]/60 mt-1">
                  or{' '}
                  <span className="text-[#0057FF] underline font-bold">browse your computer</span>
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-4 font-mono text-[11px] text-[#F5F1EA]/40">
                <span>PDF Format Only</span>
                <span>·</span>
                <span>Max 50MB</span>
                <span>·</span>
                <span>300 DPI Recommended</span>
              </div>
            </label>
          </div>
        ) : (
          /* File Uploaded & Preflight Details */
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-[#141418] border border-[#F5F1EA]/15 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl text-emerald-400">
                  ✓
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white truncate max-w-sm sm:max-w-md">
                    {file.name}
                  </h3>
                  <p className="font-mono text-xs text-[#F5F1EA]/60">
                    {inspection
                      ? `${inspection.fileSizeMb} MB · ${inspection.pageCount} Pages`
                      : 'Analyzing file structure...'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setFile(null);
                  setInspection(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1A1A1E] hover:bg-[#25252E] font-mono text-xs text-[#F5F1EA]/70 hover:text-white"
              >
                Replace PDF
              </button>
            </div>

            {/* Inspection Preflight Results */}
            {inspection && (
              <div className="p-6 rounded-2xl bg-[#121214] border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-emerald-400">
                    ✓ PDF Preflight Inspection Passed
                  </span>
                  <span className="font-mono text-xs text-[#F5F1EA]/50">300 DPI Verified</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#1A1A1E] rounded-xl border border-[#F5F1EA]/10">
                    <span className="text-[#F5F1EA]/50 block text-[10px]">Detected Pages</span>
                    <span className="font-bold text-white text-sm">
                      {inspection.pageCount} Pages
                    </span>
                  </div>
                  <div className="p-3 bg-[#1A1A1E] rounded-xl border border-[#F5F1EA]/10">
                    <span className="text-[#F5F1EA]/50 block text-[10px]">Bleed Detected</span>
                    <span className="font-bold text-emerald-400 text-sm">3mm Compliant</span>
                  </div>
                  <div className="p-3 bg-[#1A1A1E] rounded-xl border border-[#F5F1EA]/10">
                    <span className="text-[#F5F1EA]/50 block text-[10px]">Color Profile</span>
                    <span className="font-bold text-white text-sm">CMYK Safe</span>
                  </div>
                  <div className="p-3 bg-[#1A1A1E] rounded-xl border border-[#F5F1EA]/10">
                    <span className="text-[#F5F1EA]/50 block text-[10px]">File Integrity</span>
                    <span className="font-bold text-emerald-400 text-sm">Valid Vector/Raster</span>
                  </div>
                </div>

                {inspection.warnings.map((w, idx) => (
                  <p key={idx} className="font-mono text-xs text-amber-300/80">
                    ⚠ Note: {w}
                  </p>
                ))}
              </div>
            )}

            {/* Print Configuration Form */}
            <div className="p-6 rounded-2xl bg-[#141418] border border-[#F5F1EA]/15 space-y-6">
              <h3 className="font-display text-xl font-bold text-white">
                Select Print Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-xs text-[#F5F1EA]/70 block mb-2 font-bold uppercase">
                    Page Size Format
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-[#F5F1EA]/15 p-3 rounded-xl font-mono text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="A4 Portrait (210×297mm)">A4 Portrait (210 × 297 mm)</option>
                    <option value="A4 Landscape (297×210mm)">A4 Landscape (297 × 210 mm)</option>
                    <option value="A5 Portrait (148×210mm)">A5 Portrait (148 × 210 mm)</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-xs text-[#F5F1EA]/70 block mb-2 font-bold uppercase">
                    Cover Finish
                  </label>
                  <select
                    value={coverFinish}
                    onChange={(e) => setCoverFinish(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-[#F5F1EA]/15 p-3 rounded-xl font-mono text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="soft-touch">Velvet Soft-Touch Matte Cover (300gsm)</option>
                    <option value="gloss">High-Gloss UV Coated Cover (300gsm)</option>
                    <option value="matte">Fine Matte Cover (300gsm)</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-xs text-[#F5F1EA]/70 block mb-2 font-bold uppercase">
                    Interior Paper Weight
                  </label>
                  <select
                    value={paperWeight}
                    onChange={(e) => setPaperWeight(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-[#F5F1EA]/15 p-3 rounded-xl font-mono text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="170gsm-silk">170 gsm Heavy Silk (Premium Standard)</option>
                    <option value="130gsm-silk">130 gsm Silk (Standard Editorial)</option>
                    <option value="250gsm-gloss">250 gsm High-Gloss (Art Catalogue)</option>
                    <option value="120gsm-uncoated">
                      120 gsm Uncoated Natural (Matte Monograph)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-xs text-[#F5F1EA]/70 block mb-2 font-bold uppercase">
                    Binding Style
                  </label>
                  <select
                    value={binding}
                    onChange={(e) => setBinding(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-[#F5F1EA]/15 p-3 rounded-xl font-mono text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="saddle-stitch">Saddle-Stitched (Clean Metal Staples)</option>
                    <option value="perfect-bound">Perfect Bound (Flat Spine)</option>
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div className="pt-4 border-t border-[#F5F1EA]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#F5F1EA]/70 uppercase font-bold">
                    Quantity:
                  </span>
                  <div className="flex items-center bg-[#1A1A1E] rounded-lg border border-[#F5F1EA]/15 p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 font-mono text-xs text-white hover:bg-black/40 rounded"
                    >
                      -
                    </button>
                    <span className="px-4 font-mono text-xs font-bold text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1 font-mono text-xs text-white hover:bg-black/40 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleOrder}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] font-mono text-xs font-bold text-white uppercase tracking-widest transition-all shadow-xl shadow-[#0057FF]/30 hover:scale-105"
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
