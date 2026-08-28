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
      img: 'h-6 w-auto sm:h-7',
      text: 'text-base sm:text-lg font-black tracking-tight',
      sub: 'text-[8px] sm:text-[9px] tracking-[0.28em]',
    },
    md: {
      img: 'h-8 w-auto sm:h-9',
      text: 'text-xl sm:text-2xl font-black tracking-tight',
      sub: 'text-[9px] sm:text-[10px] tracking-[0.32em]',
    },
    lg: {
      img: 'h-10 w-auto sm:h-12',
      text: 'text-2xl sm:text-3xl font-black tracking-tight',
      sub: 'text-[10px] sm:text-xs tracking-[0.36em]',
    },
  }[size];

  const content = (
    <span className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {variant !== 'text' && (
        <span className="relative inline-flex items-center justify-center flex-shrink-0">
          <Image
            src={variant === 'mark' ? "/images/fregoro-emblem.png" : "/images/fregoro-logo.png"}
            alt="Fregoro Studios Icon"
            width={120}
            height={60}
            priority
            className={`${sizeClasses.img} object-contain transition-transform group-hover:scale-105 duration-300 ${
              textIsDark ? '' : 'brightness-0 invert'
            }`}
          />
        </span>
      )}

      {variant !== 'mark' && (
        <span className="inline-flex flex-col leading-none justify-center">
          <span
            className={`font-display uppercase leading-none ${sizeClasses.text} ${
              textIsDark ? 'text-[#0A0A0A]' : 'text-[#F5F1EA]'
            }`}
          >
            Fregoro
          </span>
          <span
            className={`font-mono font-bold uppercase ${sizeClasses.sub} mt-0.5 leading-none ${
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
