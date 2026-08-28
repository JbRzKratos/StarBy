'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type {
  MagazineDocument,
  MagazinePage,
  MagazineElement,
  PreflightReport,
  MagazineTheme,
  AlignAction,
  DistributeAction,
  ClipboardItem,
} from '@/types/magazine';
import { DEFAULT_THEME } from '@/types/magazine';
import { MAGAZINE_TEMPLATES } from '@/data/magazineTemplates';
import {
  alignElements,
  distributeElements,
  reorderElementZIndex,
  reorderElementAbsolute,
} from '@/lib/magazine/editor-state';
import { runPreflightCheck } from '@/lib/magazine/preflight';
import { downloadMagazinePdf } from '@/lib/magazine/pdf-generator';
import { TopToolbar } from './top-toolbar';
import { LeftPanel } from './left-panel';
import { CanvasWorkspace } from './canvas-workspace';
import { RightInspector } from './right-inspector';
import { ContextMenu } from './context-menu';
import { PublicationPreviewer } from '@/components/magazine/publication-previewer';
import { PreflightModal } from '@/components/magazine/preflight-modal';
import { useCartStore } from '@/lib/stores/cart-store';

interface MagazineEditorProps {
  initialDocument?: MagazineDocument | undefined;
  templateId?: string | undefined;
}

export function MagazineEditor({ initialDocument, templateId }: MagazineEditorProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [, startTransition] = useTransition();

  // Initialize document state
  const [doc, setDoc] = useState<MagazineDocument>(() => {
    if (initialDocument) return initialDocument;

    const tpl = MAGAZINE_TEMPLATES.find((t) => t.id === templateId || t.slug === templateId) ||
      MAGAZINE_TEMPLATES[0] || {
        id: 'tpl-vogue-editorial',
        name: 'Vogue Luxe Editorial',
        dimensionKey: 'a4-portrait',
        theme: DEFAULT_THEME,
        pages: [],
      };

    return {
      id: `mag-${Date.now()}`,
      title: tpl.name || 'Editorial Issue No. 01',
      templateId: tpl.id,
      dimensionKey: tpl.dimensionKey || 'a4-portrait',
      theme: tpl.theme || DEFAULT_THEME,
      pages: JSON.parse(JSON.stringify(tpl.pages)),
      pageCount: tpl.pages.length,
      coverFinish: 'soft-touch',
      paperWeight: '170gsm-silk',
      bindingType: 'saddle-stitch',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'page' | 'spread'>('page');
  const [zoom, setZoom] = useState<number>(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [enableSnap, setEnableSnap] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Responsive sidebar collapse states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialW = window.innerWidth;
      if (initialW < 1280) setRightPanelOpen(false);
      if (initialW < 768) setLeftPanelOpen(false);
      setIsMobileScreen(initialW < 768);

      const handleResize = () => {
        setIsMobileScreen(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // History & Clipboard
  const [undoStack, setUndoStack] = useState<MagazineDocument[]>([]);
  const [redoStack, setRedoStack] = useState<MagazineDocument[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [preflightReport, setPreflightReport] = useState<PreflightReport | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Uploaded images — persisted to localStorage
  const [uploadedImages, setUploadedImages] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('fregoro_uploads');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Persist uploaded images
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Only store last 20 uploads to limit storage usage
      localStorage.setItem('fregoro_uploads', JSON.stringify(uploadedImages.slice(-20)));
    } catch {
      // QuotaExceededError — silently ignore
    }
  }, [uploadedImages]);

  // Push new state to history
  const pushState = useCallback(
    (newDoc: MagazineDocument) => {
      setUndoStack((prev) => [...prev.slice(-30), doc]);
      setRedoStack([]);
      setDoc(newDoc);
    },
    [doc],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, doc]);
    setDoc(previous);
  }, [undoStack, doc]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    if (!next) return;
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, doc]);
    setDoc(next);
  }, [redoStack, doc]);

  // Current active page and selected elements
  const activePage = doc.pages[currentPageIndex] || doc.pages[0];
  const selectedElements = (activePage?.elements || []).filter((el) =>
    selectedElementIds.includes(el.id),
  );

  // ─── Clipboard Actions: Copy, Cut, Paste, Duplicate ───
  const handleCopy = useCallback(() => {
    if (selectedElements.length === 0) return;
    setClipboard({
      elements: JSON.parse(JSON.stringify(selectedElements)),
      copiedAt: Date.now(),
    });
  }, [selectedElements]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const updatedPages = doc.pages.map((page, idx) => {
      if (idx !== currentPageIndex) return page;
      return {
        ...page,
        elements: page.elements.filter((el) => !selectedElementIds.includes(el.id)),
      };
    });
    pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    setSelectedElementIds([]);
  }, [doc, currentPageIndex, selectedElementIds, pushState]);

  const handleCut = useCallback(() => {
    handleCopy();
    handleDeleteSelected();
  }, [handleCopy, handleDeleteSelected]);

  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.elements.length === 0 || !activePage) return;

    const offset = 3; // 3% offset for pasted items
    const pastedElements: MagazineElement[] = clipboard.elements.map((el) => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      frame: {
        ...el.frame,
        x: Math.min(90, el.frame.x + offset),
        y: Math.min(90, el.frame.y + offset),
        zIndex: (activePage.elements.length + 1) * 10,
      },
    }));

    const updatedPages = doc.pages.map((p, idx) =>
      idx === currentPageIndex ? { ...p, elements: [...p.elements, ...pastedElements] } : p,
    );

    pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    setSelectedElementIds(pastedElements.map((e) => e.id));
  }, [clipboard, activePage, doc, currentPageIndex, pushState]);

  const handleDuplicate = useCallback(() => {
    if (selectedElements.length === 0 || !activePage) return;

    const offset = 3;
    const duplicatedElements: MagazineElement[] = selectedElements.map((el) => ({
      ...JSON.parse(JSON.stringify(el)),
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      frame: {
        ...el.frame,
        x: Math.min(90, el.frame.x + offset),
        y: Math.min(90, el.frame.y + offset),
        zIndex: (activePage.elements.length + 1) * 10,
      },
    }));

    const updatedPages = doc.pages.map((p, idx) =>
      idx === currentPageIndex ? { ...p, elements: [...p.elements, ...duplicatedElements] } : p,
    );

    pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    setSelectedElementIds(duplicatedElements.map((e) => e.id));
  }, [selectedElements, activePage, doc, currentPageIndex, pushState]);

  // ─── Layer & Alignment Operations ───
  const handleAlign = useCallback(
    (action: AlignAction) => {
      if (selectedElements.length === 0 || !activePage) return;
      const relativeToPage = selectedElements.length === 1;
      const aligned = alignElements(selectedElements, action, relativeToPage);

      const updatedElements = activePage.elements.map((el) => {
        const found = aligned.find((item) => item.id === el.id);
        return found || el;
      });

      const updatedPages = doc.pages.map((p, idx) =>
        idx === currentPageIndex ? { ...p, elements: updatedElements } : p,
      );

      pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    },
    [selectedElements, activePage, doc, currentPageIndex, pushState],
  );

  const handleDistribute = useCallback(
    (action: DistributeAction) => {
      if (selectedElements.length <= 1 || !activePage) return;
      const distributed = distributeElements(selectedElements, action);

      const updatedElements = activePage.elements.map((el) => {
        const found = distributed.find((item) => item.id === el.id);
        return found || el;
      });

      const updatedPages = doc.pages.map((p, idx) =>
        idx === currentPageIndex ? { ...p, elements: updatedElements } : p,
      );

      pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    },
    [selectedElements, activePage, doc, currentPageIndex, pushState],
  );

  const handleReorderLayer = useCallback(
    (elementId: string, action: 'front' | 'back' | 'forward' | 'backward') => {
      if (!activePage) return;
      const updatedPage = reorderElementZIndex(activePage, elementId, action);
      const updatedPages = doc.pages.map((p, idx) => (idx === currentPageIndex ? updatedPage : p));
      pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    },
    [activePage, doc, currentPageIndex, pushState],
  );

  const handleReorderLayerAbsolute = useCallback(
    (elementId: string, toIndex: number) => {
      if (!activePage) return;
      const updatedPage = reorderElementAbsolute(activePage, elementId, toIndex);
      const updatedPages = doc.pages.map((p, idx) => (idx === currentPageIndex ? updatedPage : p));
      pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    },
    [activePage, doc, currentPageIndex, pushState],
  );

  const handleToggleLock = useCallback(
    (elementId: string) => {
      if (!activePage) return;
      const updatedElements = activePage.elements.map((el) =>
        el.id === elementId ? { ...el, locked: !el.locked } : el,
      );
      const updatedPages = doc.pages.map((p, idx) =>
        idx === currentPageIndex ? { ...p, elements: updatedElements } : p,
      );
      pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    },
    [activePage, doc, currentPageIndex, pushState],
  );

  const handleToggleVisibility = useCallback(
    (elementId: string) => {
      if (!activePage) return;
      const updatedElements = activePage.elements.map((el) =>
        el.id === elementId ? { ...el, visible: el.visible === false ? true : false } : el,
      );
      const updatedPages = doc.pages.map((p, idx) =>
        idx === currentPageIndex ? { ...p, elements: updatedElements } : p,
      );
      pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
    },
    [activePage, doc, currentPageIndex, pushState],
  );

  // ─── Keyboard Event Listener ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (modifier && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (modifier && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (modifier && e.key === 'x') {
        e.preventDefault();
        handleCut();
      } else if (modifier && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (modifier && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElements.length === 0 || !activePage) return;
        e.preventDefault();
        const step = e.shiftKey ? 3 : 0.5; // percentage step
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        const updatedElements = activePage.elements.map((el) => {
          if (!selectedElementIds.includes(el.id) || el.locked) return el;
          return {
            ...el,
            frame: {
              ...el.frame,
              x: Math.max(-20, Math.min(100, el.frame.x + dx)),
              y: Math.max(-20, Math.min(100, el.frame.y + dy)),
            },
          };
        });

        const updatedPages = doc.pages.map((p, idx) =>
          idx === currentPageIndex ? { ...p, elements: updatedElements } : p,
        );
        pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleCopy,
    handleCut,
    handlePaste,
    handleDuplicate,
    handleDeleteSelected,
    selectedElements,
    selectedElementIds,
    activePage,
    doc,
    currentPageIndex,
    pushState,
  ]);

  // Context Menu listener
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Autosave to localStorage
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`fregoro_mag_${doc.id}`, JSON.stringify(doc));
      } catch {
        // ignore
      }
      setIsSaving(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [doc]);

  // ─── Page Mutations ───
  const handleAddPage = () => {
    const newPage: MagazinePage = {
      id: `page-${Date.now()}`,
      pageNumber: doc.pages.length + 1,
      layoutType: 'editorial-single',
      title: `Page ${doc.pages.length + 1}`,
      backgroundColor: doc.theme.backgroundColor,
      elements: [],
    };
    const updatedPages = [...doc.pages, newPage];
    pushState({
      ...doc,
      pages: updatedPages,
      pageCount: updatedPages.length,
      updatedAt: new Date().toISOString(),
    });
    setCurrentPageIndex(updatedPages.length - 1);
    setSelectedElementIds([]);
  };

  const handleDuplicatePage = (index: number) => {
    const pageToDup = doc.pages[index];
    if (!pageToDup) return;
    const duplicated: MagazinePage = {
      ...JSON.parse(JSON.stringify(pageToDup)),
      id: `page-${Date.now()}`,
      pageNumber: index + 2,
      title: `${pageToDup.title} (Copy)`,
    };
    const updatedPages = [
      ...doc.pages.slice(0, index + 1),
      duplicated,
      ...doc.pages.slice(index + 1),
    ].map((p, i) => ({ ...p, pageNumber: i + 1 }));

    pushState({
      ...doc,
      pages: updatedPages,
      pageCount: updatedPages.length,
      updatedAt: new Date().toISOString(),
    });
    setCurrentPageIndex(index + 1);
  };

  const handleDeletePage = (index: number) => {
    if (doc.pages.length <= 1) return;
    const updatedPages = doc.pages
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, pageNumber: i + 1 }));

    pushState({
      ...doc,
      pages: updatedPages,
      pageCount: updatedPages.length,
      updatedAt: new Date().toISOString(),
    });
    setCurrentPageIndex(Math.max(0, index - 1));
    setSelectedElementIds([]);
  };

  const handleReorderPage = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= doc.pages.length ||
      toIndex >= doc.pages.length
    )
      return;

    const updatedPages = [...doc.pages];
    const [movedPage] = updatedPages.splice(fromIndex, 1);
    if (!movedPage) return;
    updatedPages.splice(toIndex, 0, movedPage);

    const renumberedPages = updatedPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));

    pushState({
      ...doc,
      pages: renumberedPages,
      updatedAt: new Date().toISOString(),
    });

    if (currentPageIndex === fromIndex) {
      setCurrentPageIndex(toIndex);
    } else if (currentPageIndex > fromIndex && currentPageIndex <= toIndex) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (currentPageIndex < fromIndex && currentPageIndex >= toIndex) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handleAddElement = useCallback(
    (element: MagazineElement) => {
      if (!activePage) return;
      const updatedElements = [...activePage.elements, element];
      const updatedPages = doc.pages.map((p, idx) =>
        idx === currentPageIndex ? { ...p, elements: updatedElements } : p,
      );

      pushState({ ...doc, pages: updatedPages, updatedAt: new Date().toISOString() });
      setSelectedElementIds([element.id]);
    },
    [activePage, doc, currentPageIndex, pushState],
  );

  const handleUpdateElement = (
    pageIndex: number,
    elementId: string,
    updates: Partial<MagazineElement>,
    isFinal: boolean,
  ) => {
    if (isFinal) {
      // Commit to undo history using latest state
      setDoc((prev) => {
        const updatedPages = prev.pages.map((page, idx) => {
          if (idx !== pageIndex) return page;
          const updatedElements = page.elements.map((el) =>
            el.id === elementId ? { ...el, ...updates } : el,
          );
          return { ...page, elements: updatedElements };
        });
        const newDoc = { ...prev, pages: updatedPages, updatedAt: new Date().toISOString() };
        // Push to undo stack
        setUndoStack((prevStack) => [...prevStack.slice(-30), prev]);
        setRedoStack([]);
        return newDoc;
      });
    } else {
      // Live drag update — use functional form to avoid stale closure
      setDoc((prev) => {
        const updatedPages = prev.pages.map((page, idx) => {
          if (idx !== pageIndex) return page;
          const updatedElements = page.elements.map((el) =>
            el.id === elementId ? { ...el, ...updates } : el,
          );
          return { ...page, elements: updatedElements };
        });
        return { ...prev, pages: updatedPages };
      });
    }
  };

  const handleUploadImage = useCallback((file: File): Promise<string | null> => {
    const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    return new Promise((resolve) => {
      setUploadError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError('Only JPEG, PNG, and WebP images are supported.');
        resolve(null);
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setUploadError(
          `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max size is 10 MB.`,
        );
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedImages((prev) => [dataUrl, ...prev]);
        resolve(dataUrl);
      };
      reader.onerror = () => {
        setUploadError('Failed to read file. Please try again.');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleReplaceImage = useCallback(
    async (file: File) => {
      const dataUrl = await handleUploadImage(file);
      if (!dataUrl || selectedElementIds.length === 0) return;
      // Replace the selected image element's content
      const selectedId = selectedElementIds[0];
      if (!selectedId || !activePage) return;
      const el = activePage.elements.find((e) => e.id === selectedId);
      if (!el || el.type !== 'image') return;
      handleUpdateElement(currentPageIndex, selectedId, { content: dataUrl }, true);
    },
    [handleUploadImage, selectedElementIds, activePage, currentPageIndex],
  );

  const handleInsertUploadedImage = useCallback(
    async (dataUrlOrFile: string | File) => {
      let url: string;
      if (typeof dataUrlOrFile === 'string') {
        url = dataUrlOrFile;
      } else {
        const result = await handleUploadImage(dataUrlOrFile);
        if (!result) return;
        url = result;
      }

      // If an image element is selected, replace it; otherwise insert new
      if (selectedElementIds.length === 1 && activePage) {
        const sel = activePage.elements.find(
          (e) => e.id === selectedElementIds[0] && e.type === 'image',
        );
        if (sel) {
          handleUpdateElement(currentPageIndex, sel.id, { content: url }, true);
          return;
        }
      }

      // Insert as new element
      if (!activePage) return;
      const newEl = {
        id: `el-${Date.now()}`,
        type: 'image' as const,
        name: 'Uploaded Image',
        frame: {
          x: 10,
          y: 15,
          width: 80,
          height: 50,
          zIndex: (activePage.elements.length + 1) * 10,
        },
        content: url,
        originalDpi: 96,
        imageStyle: { objectFit: 'cover' as const, borderRadius: 4 },
      };
      handleAddElement(newEl);
    },
    [handleUploadImage, selectedElementIds, activePage, currentPageIndex, handleAddElement],
  );

  const handleOpenPreflight = () => {
    const report = runPreflightCheck(doc);
    setPreflightReport(report);
    setShowPreflightModal(true);
  };

  const handleDownloadPdf = async () => {
    await downloadMagazinePdf(doc);
  };

  const handleOrder = () => {
    addItem({
      productId: 'prod_mag_01',
      variantId: 'v_mag_12p',
      name: `FREGORO Magazine · ${doc.title}`,
      price: 499,
      image:
        doc.pages[0]?.elements?.find((e) => e.type === 'image')?.content ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      quantity: 1,
      size: 'A4 Portrait',
      customization: {
        magazineId: doc.id,
        magazineTitle: doc.title,
        pageCount: doc.pages.length,
        coverFinish: doc.coverFinish,
        paperWeight: doc.paperWeight,
        bindingType: doc.bindingType,
      },
    });

    startTransition(() => {
      router.push('/checkout');
    });
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="h-[100dvh] w-screen flex flex-col bg-[#0A0A0C] overflow-hidden text-[#F5F1EA] select-none"
    >
      {/* ── 1. Top Studio Toolbar ── */}
      <TopToolbar
        document={doc}
        onUpdateTitle={(title) => pushState({ ...doc, title, updatedAt: new Date().toISOString() })}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'page' ? 'spread' : 'page'))}
        zoom={zoom}
        onZoomChange={setZoom}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides((prev) => !prev)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        showRulers={showRulers}
        onToggleRulers={() => setShowRulers((prev) => !prev)}
        enableSnap={enableSnap}
        onToggleSnap={() => setEnableSnap((prev) => !prev)}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isSaving={isSaving}
        onOpenPreflight={handleOpenPreflight}
        onOpenPreview={() => setShowPreviewModal(true)}
        onDownloadPdf={handleDownloadPdf}
        onOrderPrint={handleOrder}
        preflightReport={preflightReport}
        leftPanelOpen={leftPanelOpen}
        onToggleLeftPanel={() => setLeftPanelOpen((prev) => !prev)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen((prev) => !prev)}
      />

      {/* ── 2. Three-Column Workspace Stage ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        {leftPanelOpen && (
          <div
            className={
              isMobileScreen
                ? 'absolute inset-y-0 left-0 z-50 flex shadow-2xl'
                : 'relative shrink-0 flex h-full'
            }
          >
            <LeftPanel
              document={doc}
              currentPageIndex={currentPageIndex}
              selectedElementIds={selectedElementIds}
              onSelectPage={(index) => {
                setCurrentPageIndex(index);
                setSelectedElementIds([]);
                if (isMobileScreen) setLeftPanelOpen(false);
              }}
              onAddPage={handleAddPage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
              onReorderPage={handleReorderPage}
              onAddElement={(el) => {
                handleAddElement(el);
                if (isMobileScreen) setLeftPanelOpen(false);
              }}
              onSelectElement={(id) => setSelectedElementIds([id])}
              onToggleLockElement={handleToggleLock}
              onToggleVisibilityElement={handleToggleVisibility}
              onReorderLayer={(id, dir) =>
                handleReorderLayer(id, dir === 'up' ? 'forward' : 'backward')
              }
              onReorderLayerAbsolute={handleReorderLayerAbsolute}
              onApplyTheme={(theme: MagazineTheme) =>
                pushState({ ...doc, theme, updatedAt: new Date().toISOString() })
              }
              onApplyTemplate={(tplId: string) => {
                const tpl = MAGAZINE_TEMPLATES.find((t) => t.id === tplId);
                if (!tpl) return;
                pushState({
                  ...doc,
                  templateId: tpl.id,
                  theme: tpl.theme,
                  pages: JSON.parse(JSON.stringify(tpl.pages)),
                  pageCount: tpl.pages.length,
                  updatedAt: new Date().toISOString(),
                });
                if (isMobileScreen) setLeftPanelOpen(false);
              }}
              uploadedImages={uploadedImages}
              uploadError={uploadError}
              onUploadImage={handleUploadImage}
              onInsertUploadedImage={(url) => handleInsertUploadedImage(url)}
              selectedImageId={
                selectedElementIds.length === 1 &&
                activePage?.elements.find((e) => e.id === selectedElementIds[0])?.type === 'image'
                  ? selectedElementIds[0]
                  : undefined
              }
            />
            {isMobileScreen && (
              <div
                className="fixed inset-0 bg-black/60 -z-10"
                onClick={() => setLeftPanelOpen(false)}
              />
            )}
          </div>
        )}

        {/* Center Canvas */}
        <CanvasWorkspace
          document={doc}
          currentPageIndex={currentPageIndex}
          selectedElementIds={selectedElementIds}
          viewMode={viewMode}
          zoom={zoom}
          showGuides={showGuides}
          showGrid={showGrid}
          showRulers={showRulers}
          enableSnap={enableSnap}
          onSelectElements={setSelectedElementIds}
          onUpdateElement={handleUpdateElement}
          onDuplicateSelected={handleDuplicate}
          onDeleteSelected={handleDeleteSelected}
          onBringForward={() =>
            selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'forward')
          }
          onSendBackward={() =>
            selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'backward')
          }
          onToggleLock={handleToggleLock}
          onAddPage={handleAddPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onZoomChange={setZoom}
        />

        {/* Right Inspector */}
        {rightPanelOpen && (
          <div
            className={
              isMobileScreen
                ? 'absolute inset-y-0 right-0 z-50 flex shadow-2xl'
                : 'relative shrink-0 flex h-full'
            }
          >
            <RightInspector
              document={doc}
              currentPageIndex={currentPageIndex}
              selectedElements={selectedElements}
              onUpdateElement={(id, updates) =>
                handleUpdateElement(currentPageIndex, id, updates, true)
              }
              onUpdatePageBackground={(bgColor) => {
                const updatedPages = doc.pages.map((p, idx) =>
                  idx === currentPageIndex ? { ...p, backgroundColor: bgColor } : p,
                );
                pushState({ ...doc, pages: updatedPages });
              }}
              onUpdateDocumentProps={(updates) => pushState({ ...doc, ...updates })}
              onAlign={handleAlign}
              onDistribute={handleDistribute}
              onDeleteSelected={handleDeleteSelected}
              onBringForward={() =>
                selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'forward')
              }
              onSendBackward={() =>
                selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'backward')
              }
              onBringToFront={() =>
                selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'front')
              }
              onSendToBack={() =>
                selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'back')
              }
              onToggleLock={handleToggleLock}
              onReplaceImage={handleReplaceImage}
            />
            {isMobileScreen && (
              <div
                className="fixed inset-0 bg-black/60 -z-10"
                onClick={() => setRightPanelOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* ── 3. Right Click Context Menu ── */}
      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          hasSelection={selectedElementIds.length > 0}
          isLocked={selectedElements[0]?.locked}
          canPaste={!!clipboard && clipboard.elements.length > 0}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteSelected}
          onBringForward={() =>
            selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'forward')
          }
          onSendBackward={() =>
            selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'backward')
          }
          onBringToFront={() =>
            selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'front')
          }
          onSendToBack={() =>
            selectedElementIds[0] && handleReorderLayer(selectedElementIds[0], 'back')
          }
          onToggleLock={() => selectedElementIds[0] && handleToggleLock(selectedElementIds[0])}
          onClose={() => setContextMenuPos(null)}
        />
      )}

      {/* ── 4. Publication Preview Modal ── */}
      {showPreviewModal && (
        <PublicationPreviewer
          document={doc}
          onClose={() => setShowPreviewModal(false)}
          onDownloadPdf={handleDownloadPdf}
          onOrder={() => {
            setShowPreviewModal(false);
            handleOrder();
          }}
        />
      )}

      {/* ── 5. Preflight Print Check Modal ── */}
      {showPreflightModal && preflightReport && (
        <PreflightModal
          report={preflightReport}
          onClose={() => setShowPreflightModal(false)}
          onSelectPage={(pageNum) => {
            setCurrentPageIndex(pageNum - 1);
            setShowPreflightModal(false);
          }}
          onProceedToOrder={() => {
            setShowPreflightModal(false);
            handleOrder();
          }}
        />
      )}
    </div>
  );
}
