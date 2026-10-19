import { getR2AssetUrl } from '@/lib/r2';

interface HeroThreeCharactersProps {
  className?: string;
  priority?: boolean;
  isMobile?: boolean;
}

export function HeroThreeCharacters({
  className = '',
  isMobile = false,
}: HeroThreeCharactersProps) {
  const desktopSrc = getR2AssetUrl('images/hero-three-models.webp');
  const mobileSrc = getR2AssetUrl('images/hero-three-models-mobile.webp');

  return (
    <div
      className={`relative w-full h-full flex items-end justify-center select-none pointer-events-none ${className}`}
    >
      <picture className="relative w-full h-full flex items-end justify-center pointer-events-none">
        {/* Mobile viewport (<768px): load 58.7 KB optimized WebP */}
        <source media="(max-width: 767px)" srcSet={mobileSrc} type="image/webp" />
        {/* Desktop viewport (>=768px): load high-res WebP */}
        <source media="(min-width: 768px)" srcSet={desktopSrc} type="image/webp" />
        <img
          src={isMobile ? mobileSrc : desktopSrc}
          alt="Fregoro Studios Hero Models - Three Men in Navy Blue Suits"
          width={1230}
          height={977}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          draggable={false}
          className="w-full h-full object-contain object-bottom pointer-events-none"
        />
      </picture>
    </div>
  );
}
