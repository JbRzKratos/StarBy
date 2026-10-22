import { getImageProps } from 'next/image';
import { getR2AssetUrl } from '@/lib/r2-public';

interface HeroThreeCharactersProps {
  className?: string;
}

/**
 * Hero artwork with art direction.
 *
 * Two source crops are used (mobile / desktop). `getImageProps` lets us keep the
 * <picture> element while still routing both crops through the Next.js image
 * optimizer, so each breakpoint receives a correctly sized AVIF/WebP variant.
 */
export function HeroThreeCharacters({ className = '' }: HeroThreeCharactersProps) {
  const alt = 'Fregoro Studios Hero Models - Three Men in Navy Blue Suits';
  const desktopSrc = getR2AssetUrl('images/hero-three-models.webp');
  const mobileSrc = getR2AssetUrl('images/hero-three-models-mobile.webp');

  const mobile = getImageProps({
    src: mobileSrc,
    alt,
    width: 1230,
    height: 977,
    quality: 72,
    sizes: '(max-width: 767px) 96vw',
  });
  const desktop = getImageProps({
    src: desktopSrc,
    alt,
    width: 1230,
    height: 977,
    quality: 78,
    sizes: '(min-width: 768px) 92vw',
  });

  return (
    <div
      className={`relative w-full h-full flex items-end justify-center select-none pointer-events-none ${className}`}
    >
      {/* Preload the correct crop for the active breakpoint (LCP) */}
      <link
        rel="preload"
        as="image"
        media="(max-width: 767px)"
        href={mobile.props.src}
        imageSrcSet={mobile.props.srcSet}
        imageSizes={mobile.props.sizes}
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        media="(min-width: 768px)"
        href={desktop.props.src}
        imageSrcSet={desktop.props.srcSet}
        imageSizes={desktop.props.sizes}
        fetchPriority="high"
      />

      <picture className="relative w-full h-full flex items-end justify-center pointer-events-none">
        <source media="(max-width: 767px)" srcSet={mobile.props.srcSet} sizes={mobile.props.sizes} />
        <source media="(min-width: 768px)" srcSet={desktop.props.srcSet} sizes={desktop.props.sizes} />
        <img
          {...desktop.props}
          alt={alt}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          draggable={false}
          className="w-full min-w-full h-full object-cover object-bottom -scale-x-100 pointer-events-none"
        />
      </picture>
    </div>
  );
}
