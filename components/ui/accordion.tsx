'use client';

import { useRef, useState } from 'react';
import { gsap } from '@/lib/gsap-config';

interface AccordionItemProps {
  question: string;
  answer: string;
}

export function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!contentRef.current) return;

    if (isOpen) {
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(true);
      gsap.set(contentRef.current, { height: 'auto', opacity: 1 });
      gsap.from(contentRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.out' });
    }
  };

  return (
    <div className="border-b border-smoke">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-display text-body-lg text-bone group-hover:text-cobalt transition-colors pr-4">
          {question}
        </span>
        <span
          className={`font-mono text-pearl text-xl transition-transform ${isOpen ? 'rotate-45' : ''}`}
        >
          +
        </span>
      </button>
      <div ref={contentRef} className={`overflow-hidden ${isOpen ? '' : 'h-0 opacity-0'}`}>
        <p className="text-pearl text-body-md pb-5 leading-relaxed max-w-2xl">{answer}</p>
      </div>
    </div>
  );
}
