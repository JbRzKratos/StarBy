'use client';

import Image from 'next/image';

interface HeroThreeCharactersProps {
  priority?: boolean;
  className?: string;
  isMobile?: boolean;
}

export function HeroThreeCharacters({ priority = true, className = '' }: HeroThreeCharactersProps) {
  return (
    <div
      className={`relative w-full h-full flex items-end justify-center select-none pointer-events-none ${className}`}
    >
      <div className="relative w-full h-full z-10">
        <Image
          src="/images/hero-three-models.png"
          alt="Fregoro Studios Hero Models - Three Men in Navy Blue Suits"
          fill
          quality={100}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 1200px, (max-width: 1536px) 1600px, 2000px"
          priority={priority}
          className="object-contain object-bottom"
          draggable={false}
        />
      </div>
    </div>
  );
}
