'use client';

import { ReactNode } from 'react';

interface DemoWindowProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function DemoWindow({ children, title, className = '' }: DemoWindowProps) {
  return (
    <div className={`demo-window ${className}`}>
      <div className="demo-window-bar">
        <div className="demo-window-dot bg-[#ff5f57]" />
        <div className="demo-window-dot bg-[#febc2e]" />
        <div className="demo-window-dot bg-[#28c840]" />
        {title && (
          <span className="ml-3 text-xs text-white/30 font-mono">{title}</span>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
