'use client';

import { useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { getFeaturedCategories, type Category } from '@/data/categories';
import { BentoTile, CATEGORY_GROUPS } from './bento-tile';
import { ArrowUpRight } from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'wearables', label: 'Wearables' },
  { id: 'wall', label: 'Wall Art' },
  { id: 'editorial', label: 'Editorial' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function BentoGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const categories = useMemo(() => getFeaturedCategories(), []);

  // Filter categories based on active tab
  const displayedCategories = useMemo(() => {
    if (activeTab === 'all') return categories;
    return categories.filter((cat) => CATEGORY_GROUPS[cat.slug] === activeTab);
  }, [categories, activeTab]);

  // Initial scroll-triggered reveal
  useGSAP(
    () => {
      if (!gridRef.current) return;

      ScrollTrigger.batch(gridRef.current.children, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 40, opacity: 0, scale: 0.98 },
            { y: 0, opacity: 1, scale: 1, duration: 0.55, stagger: 0.06, ease: 'power3.out' },
          );
        },
        start: 'top 85%',
        once: true,
      });
    },
    { scope: sectionRef, dependencies: [activeTab] },
  );

  // Tab switch micro-animation
  const handleTabChange = (tabId: TabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);

    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.03, ease: 'power2.out' },
      );
    }
  };

  // Compute layout classes based on activeTab and category slug
  const getTileLayout = (cat: Category) => {
    if (activeTab === 'all') {
      switch (cat.slug) {
        case 'tees':
          return {
            className: 'col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[380px] lg:min-h-[520px]',
            sizeVariant: 'hero' as const,
          };
        case 'hoodies':
        case 'magazine':
        case 'split-posters':
        case 'wall-studio':
          return {
            className: 'col-span-1 sm:col-span-2 lg:col-span-2 min-h-[250px]',
            sizeVariant: 'wide' as const,
          };
        default:
          return {
            className: 'col-span-1 sm:col-span-1 lg:col-span-1 min-h-[250px]',
            sizeVariant: 'compact' as const,
          };
      }
    }

    if (activeTab === 'wearables') {
      return {
        className: 'col-span-1 min-h-[420px]',
        sizeVariant: 'hero' as const,
      };
    }

    if (activeTab === 'wall') {
      if (cat.slug === 'split-posters') {
        return {
          className: 'col-span-1 sm:col-span-2 min-h-[320px]',
          sizeVariant: 'wide' as const,
        };
      }
      return {
        className: 'col-span-1 min-h-[320px]',
        sizeVariant: 'wide' as const,
      };
    }

    // activeTab === 'editorial'
    if (cat.slug === 'magazine') {
      return {
        className: 'col-span-1 sm:col-span-2 lg:col-span-3 min-h-[320px]',
        sizeVariant: 'hero' as const,
      };
    }
    return {
      className: 'col-span-1 min-h-[260px]',
      sizeVariant: 'compact' as const,
    };
  };

  const gridContainerClass = useMemo(() => {
    if (activeTab === 'wearables') {
      return 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5';
    }
    if (activeTab === 'wall') {
      return 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5';
    }
    if (activeTab === 'editorial') {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5';
    }
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5';
  }, [activeTab]);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24 bg-[#0A0A0C] border-t border-b border-white/[0.04] overflow-hidden"
    >
      <div className="section-container relative z-10">
        {/* ── Minimalist Section Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <span className="overline-label block mb-2 text-ash text-[11px] tracking-[0.2em]">
              Collections
            </span>
            <h2 className="font-display text-display-fluid-lg font-bold text-bone tracking-tight">
              Find Your Canvas
            </h2>
            <p className="font-sans text-body-sm text-ash max-w-md mt-1.5">
              Engineered physical mediums for custom creation.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Minimalist Tab Selector */}
            <div
              role="tablist"
              aria-label="Canvas medium categories"
              className="inline-flex items-center p-1 rounded-full bg-smoke/20 border border-smoke/30"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleTabChange(tab.id)}
                    className={`font-mono text-caption uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-bone text-charcoal font-bold shadow-sm'
                        : 'text-pearl/70 hover:text-bone'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <Link
              href="/products/all"
              className="hidden md:inline-flex items-center gap-1.5 font-mono text-caption text-pearl/70 hover:text-bone uppercase tracking-widest transition-colors pl-2"
            >
              <span>Explore All</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cobalt" />
            </Link>
          </div>
        </div>

        {/* ── Bento Grid ── */}
        <div ref={gridRef} className={gridContainerClass}>
          {displayedCategories.map((cat) => {
            const layout = getTileLayout(cat);
            return (
              <BentoTile
                key={cat.slug}
                category={cat}
                className={layout.className}
                sizeVariant={layout.sizeVariant}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
