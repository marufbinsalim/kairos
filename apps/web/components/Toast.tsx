'use client';
import { useEffect, useState } from 'react';

/** Bottom-right toast, Vercel-style inverted pill. Auto-dismisses. */
export function Toast({ message, onDone, duration = 2500 }: { message: string; onDone: () => void; duration?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), duration);
    const done = setTimeout(onDone, duration + 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium px-4 py-3 rounded-lg shadow-xl transition-all duration-250 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <svg className="w-4 h-4 text-green-400 dark:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  );
}
