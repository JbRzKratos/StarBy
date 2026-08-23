'use client';

import Image from 'next/image';
import Link from 'next/link';

interface FregoroLogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'text';
  textIsDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

export function FregoroLogo({
  className = '',
  variant = 'full',
  textIsDark = false,
  size = 'md',
  href = '/',
}: FregoroLogoProps) {
  const sizeClasses = {
    sm: {
      img: 'h-7 w-auto',
      text: 'text-lg',
      sub: 'text-[9px] tracking-[0.25em]',
    },
    md: {
      img: 'h-9 w-auto',
      text: 'text-2xl',
      sub: 'text-[10px] tracking-[0.3em]',
    },
    lg: {
      img: 'h-12 w-auto',
      text: 'text-3xl',
      sub: 'text-xs tracking-[0.35em]',
    },
  }[size];

  const content = (
    <span className={`inline-flex items-center gap-3 select-none ${className}`}>
      {variant !== 'text' && (
        <span className="relative inline-flex items-center justify-center flex-shrink-0">
          <Image
            src="/images/fregoro-logo.png"
            alt="Fregoro Studios"
            width={60}
            height={40}
            priority
            className={`${sizeClasses.img} object-contain transition-transform group-hover:scale-105 duration-300 ${
              textIsDark ? '' : 'brightness-0 invert'
            }`}
          />
        </span>
      )}

      {variant !== 'mark' && (
        <span className="inline-flex flex-col leading-none">
          <span
            className={`font-display font-black tracking-tight uppercase ${sizeClasses.text} ${
              textIsDark ? 'text-[#0A0A0A]' : 'text-[#F5F1EA]'
            }`}
          >
            Fregoro
          </span>
          <span
            className={`font-mono font-bold uppercase ${sizeClasses.sub} mt-0.5 ${
              textIsDark ? 'text-[#0A0A0A]/70' : 'text-[#ED9518]'
            }`}
          >
            Studios
          </span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}
