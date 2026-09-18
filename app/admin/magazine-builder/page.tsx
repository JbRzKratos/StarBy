'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Plus, Trash2, Save, Type, ImageIcon } from 'lucide-react';
import type { MagazinePage, MagazineElement, ElementFrame } from '@/types/magazine';
import type { PageLayoutType } from '@/types/magazine';
import { TransformBox } from '@/components/magazine/editor/transform-box';

type PartialPage = Omit<MagazinePage, 'layoutType'> & { layoutType: PageLayoutType };

export default function MagazineBuilder() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('fashion');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pages, setPages] = useState<PartialPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const canvasRef = (el: HTMLDivElement | null) => {
    if (el) {
      setContainerRect(el.getBoundingClientRect());
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isCover: boolean,
    pageIndex?: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/magazine-templates/upload', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as { url?: string };

      if (data.url) {
        if (isCover) {
          setCoverImage(data.url);
        } else if (pageIndex !== undefined) {
          setPages((prev) => {
            const next = [...prev];
            const pg = next[pageIndex];
            if (!pg) return prev;
            const bgIndex = pg.elements.findIndex((el) => el.id.includes('bg'));
            if (bgIndex >= 0) {
              const updated = [...pg.elements];
              const bgEl = updated[bgIndex];
              if (bgEl) {
                updated[bgIndex] = { ...bgEl, content: data.url as string };
              }
              next[pageIndex] = { ...pg, elements: updated };
            } else {
              const newEl: MagazineElement = {
                id: `p${pageIndex}-bg-${Date.now()}`,
                type: 'image',
                name: 'Background Image',
                frame: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
                content: data.url as string,
                imageStyle: { objectFit: 'cover' },
                isReplaceable: false,
              };
              next[pageIndex] = { ...pg, elements: [...pg.elements, newEl] };
            }
            return next;
          });
        }
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Please try again.');
    }
  };

  const addPage = () => {
    const newPage: PartialPage = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length + 1,
      layoutType: pages.length === 0 ? 'cover' : 'blank',
      title: `Page ${pages.length + 1}`,
      backgroundColor: '#0D0D0E',
      elements: [],
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
  };

  const addTextBox = () => {
    if (pages.length === 0) return;
    setPages((prev) => {
      const next = [...prev];
      const pg = next[activePageIndex];
      if (!pg) return prev;
      const newEl: MagazineElement = {
        id: `text-${Date.now()}`,
        type: 'text',
        name: 'Text Box',
        frame: { x: 10, y: 10, width: 80, height: 10, zIndex: 10 },
        content: 'EDITABLE HEADLINE',
        textStyle: {
          fontFamily: 'Playfair Display, serif',
          fontSize: 32,
          fontWeight: 800,
          color: '#FFFFFF',
          textAlign: 'center',
        },
        isEditable: true,
      };
      next[activePageIndex] = { ...pg, elements: [...pg.elements, newEl] };
      return next;
    });
  };

  const updateElementFrame = (elementIndex: number, field: keyof ElementFrame, value: number) => {
    setPages((prev) => {
      const next = [...prev];
      const pg = next[activePageIndex];
      if (!pg) return prev;
      const elements = [...pg.elements];
      const el = elements[elementIndex];
      if (!el) return prev;
      elements[elementIndex] = { ...el, frame: { ...el.frame, [field]: value } };
      next[activePageIndex] = { ...pg, elements };
      return next;
    });
  };

  const updateElementContent = (elementIndex: number, value: string) => {
    setPages((prev) => {
      const next = [...prev];
      const pg = next[activePageIndex];
      if (!pg) return prev;
      const elements = [...pg.elements];
      const el = elements[elementIndex];
      if (!el) return prev;
      elements[elementIndex] = { ...el, content: value };
      next[activePageIndex] = { ...pg, elements };
      return next;
    });
  };

  const updateTextStyle = (elementIndex: number, field: string, value: string | number) => {
    setPages((prev) => {
      const next = [...prev];
      const pg = next[activePageIndex];
      if (!pg) return prev;
      const elements = [...pg.elements];
      const el = elements[elementIndex];
      if (!el) return prev;
      elements[elementIndex] = {
        ...el,
        textStyle: { ...(el.textStyle ?? {}), [field]: value } as MagazineElement['textStyle'],
      };
      next[activePageIndex] = { ...pg, elements };
      return next;
    });
  };

  const updateElementFrameObj = (elementIndex: number, frame: Partial<ElementFrame>) => {
    setPages((prev) => {
      const next = [...prev];
      const pg = next[activePageIndex];
      if (!pg) return prev;
      const elements = [...pg.elements];
      const el = elements[elementIndex];
      if (!el) return prev;
      elements[elementIndex] = {
        ...el,
        frame: { ...(el.frame ?? { x: 0, y: 0, width: 50, height: 20 }), ...frame } as ElementFrame,
      };
      next[activePageIndex] = { ...pg, elements };
      return next;
    });
  };

  const removeElement = (elementIndex: number) => {
    setPages((prev) => {
      const next = [...prev];
      const pg = next[activePageIndex];
      if (!pg) return prev;
      const elements = pg.elements.filter((_, i) => i !== elementIndex);
      next[activePageIndex] = { ...pg, elements };
      return next;
    });
  };

  const handleSave = async () => {
    if (!name || pages.length === 0 || !coverImage) {
      alert('Please fill out name, upload a cover image, and add at least one page.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/magazine-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description,
          coverImage,
          pages,
          styleTags: [],
          badge: 'NEW',
        }),
      });
      if (res.ok) {
        alert('Template saved successfully!');
        router.push('/magazine/templates');
      } else {
        alert('Failed to save template. Please try again.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const activePage = pages[activePageIndex];

  return (
    <div className="min-h-screen bg-[#08080A] text-[#F5F1EA] pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase font-display tracking-wide">
              Magazine Builder
            </h1>
            <p className="text-[#F5F1EA]/60 font-mono text-sm mt-1">
              Visually construct editable templates for the studio.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#0057FF] hover:bg-[#0046CC] px-6 py-3 rounded-lg font-mono text-sm uppercase font-bold transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Template
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-4 space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Metadata */}
            <div className="bg-[#121214] border border-[#F5F1EA]/10 p-5 rounded-xl space-y-4">
              <h2 className="font-mono text-xs text-[#0057FF] uppercase font-bold tracking-widest">
                1. Metadata
              </h2>
              <input
                placeholder="Template Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-[#F5F1EA]/10 p-3 rounded font-mono text-sm text-white outline-none"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-[#F5F1EA]/10 p-3 rounded font-mono text-sm text-white outline-none"
              >
                <option value="fashion">Fashion &amp; Lifestyle</option>
                <option value="technology">Technology</option>
                <option value="catalogue">Catalogue</option>
                <option value="editorial">Creative &amp; Editorial</option>
                <option value="business">Business &amp; Reports</option>
              </select>
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-[#F5F1EA]/10 p-3 rounded font-mono text-sm text-white h-20 outline-none"
              />
              <div>
                <label className="block font-mono text-xs text-[#F5F1EA]/60 mb-2">
                  Cover Thumbnail
                </label>
                <input
                  type="file"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="text-xs text-[#F5F1EA]/70"
                  accept="image/*"
                />
                {coverImage && (
                  <Image
                    src={coverImage}
                    alt="Cover"
                    width={200}
                    height={128}
                    className="h-32 w-auto object-contain mt-2 rounded border border-[#F5F1EA]/20"
                    unoptimized
                  />
                )}
              </div>
            </div>

            {/* Pages */}
            <div className="bg-[#121214] border border-[#F5F1EA]/10 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs text-[#0057FF] uppercase font-bold tracking-widest">
                  2. Pages
                </h2>
                <button
                  onClick={addPage}
                  className="p-1.5 bg-[#1A1A1E] hover:bg-[#25252A] rounded border border-[#F5F1EA]/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {pages.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePageIndex(i)}
                    className={`shrink-0 px-4 py-2 font-mono text-xs rounded border transition-colors ${activePageIndex === i ? 'bg-[#0057FF] border-[#0057FF] text-white' : 'bg-[#1A1A1E] border-[#F5F1EA]/20 text-[#F5F1EA]/70 hover:border-[#F5F1EA]/40'}`}
                  >
                    Pg {i + 1}
                  </button>
                ))}
              </div>

              {activePage && (
                <div className="pt-4 border-t border-[#F5F1EA]/10 space-y-4">
                  <div>
                    <label className="block font-mono text-xs text-[#F5F1EA]/60 mb-2">
                      Page Background (JPG/PNG)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(e, false, activePageIndex)}
                      className="text-xs text-[#F5F1EA]/70"
                      accept="image/*"
                    />
                  </div>

                  <button
                    onClick={addTextBox}
                    className="w-full py-2 bg-[#1A1A1E] hover:bg-[#25252A] border border-[#F5F1EA]/10 rounded flex items-center justify-center gap-2 font-mono text-xs text-white transition-colors"
                  >
                    <Type className="w-3 h-3" /> Add Editable Text Box
                  </button>

                  <div className="space-y-4 mt-2">
                    {activePage.elements
                      .map((el, realIdx) => ({ el, realIdx }))
                      .filter(({ el }) => el.type === 'text')
                      .map(({ el, realIdx }) => (
                        <div
                          key={el.id}
                          className="p-3 bg-[#0D0D0E] border border-[#F5F1EA]/10 rounded space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase">
                              {el.name}
                            </span>
                            <button onClick={() => removeElement(realIdx)}>
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>

                          <input
                            value={el.content as string}
                            onChange={(e) => updateElementContent(realIdx, e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-[#F5F1EA]/10 p-2 rounded font-mono text-xs text-white outline-none"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-mono text-[#F5F1EA]/50 uppercase block mb-1">
                                Font Size
                              </label>
                              <input
                                type="number"
                                value={el.textStyle?.fontSize ?? 32}
                                onChange={(e) =>
                                  updateTextStyle(realIdx, 'fontSize', parseInt(e.target.value))
                                }
                                className="w-full bg-[#1A1A1E] p-2 rounded font-mono text-xs text-white outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-[#F5F1EA]/50 uppercase block mb-1">
                                Color
                              </label>
                              <input
                                type="color"
                                value={el.textStyle?.color ?? '#FFFFFF'}
                                onChange={(e) => updateTextStyle(realIdx, 'color', e.target.value)}
                                className="w-full h-[34px] bg-[#1A1A1E] p-0.5 rounded cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {(['x', 'y', 'width', 'height'] as const).map((field) => (
                              <div key={field}>
                                <label className="text-[9px] font-mono text-[#F5F1EA]/50 uppercase block mb-1">
                                  {field === 'width'
                                    ? 'W%'
                                    : field === 'height'
                                      ? 'H%'
                                      : field.toUpperCase() + '%'}
                                </label>
                                <input
                                  type="number"
                                  value={el.frame?.[field] ?? 0}
                                  onChange={(e) =>
                                    updateElementFrame(realIdx, field, Number(e.target.value))
                                  }
                                  className="w-full bg-[#1A1A1E] p-1 text-center rounded font-mono text-xs text-white outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Canvas Preview */}
          <div className="lg:col-span-8">
            <div
              className="bg-[#121214] border border-[#F5F1EA]/10 rounded-xl p-8 flex items-center justify-center min-h-[70vh]"
              onPointerDown={() => setSelectedElementId(null)}
            >
              {activePage ? (
                <div
                  ref={canvasRef}
                  className="relative shadow-2xl overflow-hidden ring-1 ring-white/10"
                  style={{
                    width: '400px',
                    height: '565px',
                    backgroundColor: activePage.backgroundColor ?? '#FFFFFF',
                  }}
                >
                  {activePage.elements.map((el) => {
                    const style: React.CSSProperties = {
                      position: 'absolute',
                      left: `${el.frame?.x ?? 0}%`,
                      top: `${el.frame?.y ?? 0}%`,
                      width: `${el.frame?.width ?? 100}%`,
                      height: `${el.frame?.height ?? 100}%`,
                      zIndex: el.frame?.zIndex ?? 0,
                    };

                    if (el.type === 'image') {
                      return (
                        <div
                          key={el.id}
                          style={style}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setSelectedElementId(el.id);
                          }}
                        >
                          <Image
                            src={el.content as string}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      );
                    }

                    if (el.type === 'text') {
                      return (
                        <div
                          key={el.id}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setSelectedElementId(el.id);
                          }}
                          style={{
                            ...style,
                            fontFamily: el.textStyle?.fontFamily,
                            color: el.textStyle?.color,
                            fontSize: `${(el.textStyle?.fontSize ?? 12) * 0.4}px`,
                            fontWeight: el.textStyle?.fontWeight,
                            textAlign:
                              (el.textStyle?.textAlign as React.CSSProperties['textAlign']) ??
                              'left',
                            border: '1px dashed rgba(0,87,255,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent:
                              el.textStyle?.textAlign === 'center' ? 'center' : 'flex-start',
                            padding: '2px 4px',
                          }}
                        >
                          {el.content}
                        </div>
                      );
                    }
                    return null;
                  })}

                  {activePage.elements.map((el, idx) => {
                    if (el.id !== selectedElementId || !el.frame) return null;
                    return (
                      <TransformBox
                        key={`tb-${el.id}`}
                        frame={el.frame}
                        containerRect={containerRect}
                        onUpdateFrame={(newFrame) => updateElementFrameObj(idx, newFrame)}
                        onDelete={() => removeElement(idx)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <ImageIcon className="w-12 h-12 text-[#F5F1EA]/20 mx-auto" />
                  <p className="font-mono text-sm text-[#F5F1EA]/40">
                    Add a page to start building your template.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
