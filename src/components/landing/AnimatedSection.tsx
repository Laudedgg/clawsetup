'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
  stagger?: boolean;
  delay?: number;
}

export default function AnimatedSection({
  children,
  className = '',
  direction = 'up',
  stagger = false,
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add('visible');
          }, delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const animClass = stagger
    ? 'stagger-children'
    : direction === 'left'
    ? 'scroll-animate-left'
    : direction === 'right'
    ? 'scroll-animate-right'
    : 'scroll-animate';

  return (
    <div ref={ref} className={`${animClass} ${className}`}>
      {children}
    </div>
  );
}
