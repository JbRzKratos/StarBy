'use client';

import type { ChangeEvent } from 'react';
import { useRef, useState, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { SplitPosterPanel } from '../split-poster-panel';
import { ArRoomPreview } from '../ar-room-preview';
import { usePrice } from '@/lib/hooks/usePrice';
import { ErrorBoundary } from '@/components/error-boundary';

type LayoutStyle = 'classic' | 'stepped' | 'grid';
type Orientation = 'horizontal' | 'vertical';

const layoutStyles: LayoutStyle[] = ['classic', 'stepped', 'grid'];
const classicPanels = [3, 4, 5] as const;
const steppedPanels = [3, 5] as const;
const gridOptions = [
  { label: '2x2', cols: 2, rows: 2 },
  { label: '3x2', cols: 3, rows: 2 },
  { label: '3x3', cols: 3, rows: 3 },
] as const;

const sampleGradient =
  'linear-gradient(135deg, #C45D3E 0%, #3B5EFF 30%, #0E0E0F 60%, #2d1b69 100%)';

export function SplitPosterVisualizerDesktop() {
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>('classic');
  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [panelCount, setPanelCount] = useState<number>(3);
  const [gridConfig, setGridConfig] = useState<{ cols: number; rows: number }>({
    cols: 3,
    rows: 2,
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [arOpen, setArOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { formatPrice } = usePrice();

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
  };

  // Layout Engine
  const panelsData = useMemo(() => {
    const data = [];
    const baseWidth = orientation === 'vertical' || layoutStyle !== 'classic' ? 800 : 450;
    const baseHeight = orientation === 'vertical' || layoutStyle !== 'classic' ? 450 : 800;

    if (layoutStyle === 'classic') {
      const isV = orientation === 'vertical';
      for (let i = 0; i < panelCount; i++) {
        const panelW = isV ? baseWidth / panelCount : baseWidth;
        const panelH = isV ? baseHeight : baseHeight / panelCount;
        const bgPosX = isV ? (i / (panelCount - 1)) * 100 : 50;
        const bgPosY = isV ? 50 : (i / (panelCount - 1)) * 100;
        const bgSizeX = isV ? panelCount * 100 : 100;
        const bgSizeY = isV ? 100 : panelCount * 100;

        data.push({
          width: `${panelW}px`,
          height: `${panelH}px`,
          bgPosition: `${bgPosX}% ${bgPosY}%`,
          bgSize: `${bgSizeX}% ${bgSizeY}%`,
          gridCol: undefined,
          gridRow: undefined,
        });
      }
    } else if (layoutStyle === 'stepped') {
      const pCount = [3, 5].includes(panelCount) ? panelCount : 3;
      const heights = pCount === 3 ? [0.8, 1, 0.8] : [0.6, 0.8, 1, 0.8, 0.6];
      const panelW = baseWidth / pCount;

      for (let i = 0; i < pCount; i++) {
        const hScale = heights[i] ?? 1;
        const panelH = baseHeight * hScale;
        const bgPosX = (i / (pCount - 1)) * 100;
        const bgPosY = 50; // center
        const bgSizeX = pCount * 100;
        const bgSizeY = (1 / hScale) * 100;

        data.push({
          width: `${panelW}px`,
          height: `${panelH}px`,
          bgPosition: `${bgPosX}% ${bgPosY}%`,
          bgSize: `${bgSizeX}% ${bgSizeY}%`,
          gridCol: undefined,
          gridRow: undefined,
        });
      }
    } else if (layoutStyle === 'grid') {
      const { cols, rows } = gridConfig;
      const panelW = baseWidth / cols;
      const panelH = baseHeight / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bgPosX = (c / (cols - 1)) * 100;
          const bgPosY = (r / (rows - 1)) * 100;
          const bgSizeX = cols * 100;
          const bgSizeY = rows * 100;

          data.push({
            width: `${panelW}px`,
            height: `${panelH}px`,
            bgPosition: `${bgPosX}% ${bgPosY}%`,
            bgSize: `${bgSizeX}% ${bgSizeY}%`,
            gridCol: c,
            gridRow: r,
          });
        }
      }
    }
    return data;
  }, [layoutStyle, orientation, panelCount, gridConfig]);

  useGSAP(
    () => {
      if (!panelsRef.current) return;
      const panels = Array.from(panelsRef.current.children);
      const tl = gsap.timeline({ paused: true });

      panels.forEach((panel, i) => {
        const data = panelsData[i];
        if (!data) return;

        if (layoutStyle === 'grid') {
          const c = data.gridCol ?? 0;
          const r = data.gridRow ?? 0;
          const ox = (c - (gridConfig.cols - 1) / 2) * 16;
          const oy = (r - (gridConfig.rows - 1) / 2) * 16;
          tl.to(panel, { x: ox, y: oy, duration: 0.5, ease: 'power2.out' }, 0);
        } else if (layoutStyle === 'stepped' || orientation === 'vertical') {
          const pCount = layoutStyle === 'stepped' ? (panelCount === 5 ? 5 : 3) : panelCount;
          const ox = (i - (pCount - 1) / 2) * 16;
          tl.to(panel, { x: ox, y: -6, duration: 0.5, ease: 'power2.out' }, 0);
        } else {
          const oy = (i - (panelCount - 1) / 2) * 16;
          tl.to(panel, { y: oy, x: -6, duration: 0.5, ease: 'power2.out' }, 0);
        }
      });

      const onEnter = () => tl.play();
      const onLeave = () => tl.reverse();
      const container = panelsRef.current;

      container.addEventListener('mouseenter', onEnter);
      container.addEventListener('mouseleave', onLeave);

      return () => {
        container.removeEventListener('mouseenter', onEnter);
        container.removeEventListener('mouseleave', onLeave);
      };
    },
    {
      scope: panelsRef,
      dependencies: [layoutStyle, orientation, panelCount, gridConfig, panelsData],
    },
  );

  return (
    <div ref={containerRef}>
      {/* Settings Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-6 mb-10 overflow-x-auto hide-scrollbar pb-2">
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-caption text-ash uppercase tracking-wider">Style:</span>
          <div className="flex border border-smoke rounded-md overflow-hidden">
            {layoutStyles.map((s) => (
              <button
                key={s}
                onClick={() => setLayoutStyle(s)}
                className={`px-3 py-1.5 font-mono text-caption uppercase tracking-wider transition-colors ${
                  layoutStyle === s
                    ? 'bg-cobalt text-bone'
                    : 'bg-graphite text-ash hover:text-pearl border-l first:border-l-0 border-smoke'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {layoutStyle === 'classic' && (
          <>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-caption text-ash uppercase tracking-wider">
                Split:
              </span>
              <div className="flex border border-smoke rounded-md overflow-hidden">
                <button
                  onClick={() => setOrientation('vertical')}
                  className={`px-3 py-1.5 font-mono text-caption uppercase tracking-wider transition-colors border-r border-smoke ${
                    orientation === 'vertical' ? 'bg-cobalt text-bone' : 'bg-graphite text-ash'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setOrientation('horizontal')}
                  className={`px-3 py-1.5 font-mono text-caption uppercase tracking-wider transition-colors ${
                    orientation === 'horizontal' ? 'bg-cobalt text-bone' : 'bg-graphite text-ash'
                  }`}
                >
                  Top-to-Bottom
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-caption text-ash uppercase tracking-wider">
                Panels:
              </span>
              <div className="flex gap-2">
                {classicPanels.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPanelCount(n)}
                    className={`w-8 h-8 border font-mono text-body-sm flex items-center justify-center transition-colors rounded-md ${
                      panelCount === n
                        ? 'border-cobalt text-cobalt bg-cobalt/10'
                        : 'border-smoke text-ash hover:text-pearl'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {layoutStyle === 'stepped' && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-caption text-ash uppercase tracking-wider">
              Panels:
            </span>
            <div className="flex gap-2">
              {steppedPanels.map((n) => (
                <button
                  key={n}
                  onClick={() => setPanelCount(n)}
                  className={`w-8 h-8 border font-mono text-body-sm flex items-center justify-center transition-colors rounded-md ${
                    (panelCount === 5 ? 5 : 3) === n
                      ? 'border-cobalt text-cobalt bg-cobalt/10'
                      : 'border-smoke text-ash hover:text-pearl'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {layoutStyle === 'grid' && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-caption text-ash uppercase tracking-wider">
              Format:
            </span>
            <div className="flex border border-smoke rounded-md overflow-hidden">
              {gridOptions.map((opt) => {
                const isActive = gridConfig.cols === opt.cols && gridConfig.rows === opt.rows;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setGridConfig({ cols: opt.cols, rows: opt.rows })}
                    className={`px-3 py-1.5 font-mono text-caption uppercase tracking-wider transition-colors border-l first:border-l-0 border-smoke ${
                      isActive ? 'bg-cobalt text-bone' : 'bg-graphite text-ash hover:text-pearl'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Visualizer Area */}
      <div className="bg-graphite border border-smoke rounded-lg p-8 md:p-12 overflow-hidden flex flex-col items-center justify-center min-h-[600px] relative">
        {/* Dynamic Container depending on layout */}
        <div
          ref={panelsRef}
          className="cursor-pointer mx-auto relative z-10"
          style={{
            display: layoutStyle === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns:
              layoutStyle === 'grid' ? `repeat(${gridConfig.cols}, 1fr)` : undefined,
            flexDirection:
              layoutStyle === 'classic' && orientation === 'horizontal' ? 'column' : 'row',
            alignItems: 'center', // important for Stepped layout
            gap: '8px',
          }}
          data-cursor-hover
        >
          {panelsData.map((data, i) => (
            <SplitPosterPanel
              key={i}
              width={data.width}
              height={data.height}
              bgPosition={data.bgPosition}
              bgSize={data.bgSize}
              gradient={sampleGradient}
              imageSrc={uploadedImage}
            />
          ))}
        </div>

        {/* Caption */}
        <div className="absolute bottom-6 font-mono text-caption text-ash">
          Hover to preview wall spacing
        </div>
      </div>

      {/* Order Bar */}
      <div className="mt-8 flex flex-col lg:flex-row gap-4">
        <input
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 border border-smoke rounded-lg px-6 py-4 flex items-center justify-between hover:border-cobalt transition-colors cursor-pointer bg-graphite"
        >
          <div>
            <p className="font-mono text-body-sm text-pearl">Upload Your Photo</p>
            <p className="font-mono text-caption text-ash mt-1">High-Res PNG or JPG required</p>
          </div>
          <span className="font-mono text-caption text-cobalt uppercase">Browse →</span>
        </div>
        <button
          onClick={() => setArOpen(true)}
          className="px-6 py-4 border border-smoke bg-graphite text-pearl font-mono text-caption uppercase tracking-widest hover:border-cobalt hover:text-cobalt transition-colors rounded-lg shrink-0 flex items-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          View in Room
        </button>
        <button className="px-10 py-4 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors rounded-lg shrink-0">
          Order Print — {formatPrice(129 + (panelsData.length - 2) * 50)}
        </button>
      </div>

      <ErrorBoundary>
        <ArRoomPreview
          panels={panelsData.map((p) => ({
            ...p,
            gradient: sampleGradient,
            imageSrc: uploadedImage,
          }))}
          isOpen={arOpen}
          onClose={() => setArOpen(false)}
        />
      </ErrorBoundary>
    </div>
  );
}
