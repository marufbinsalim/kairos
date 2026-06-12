'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/lib/store/authSlice';
import { KairosLogo } from './KairosLogo';

/** Brand lockup that links to the dashboard when signed in, the landing page otherwise. */
export function BrandLink({ size = 28, text = true, className = '' }: { size?: number; text?: boolean; className?: string }) {
  const { accessToken } = useSelector(selectAuth);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const href = mounted && accessToken ? '/dashboard' : '/';

  return (
    <Link href={href} className={`flex items-center gap-2.5 ${className}`}>
      <KairosLogo size={size} />
      {text && (
        <span className="text-gray-900 dark:text-white font-semibold tracking-tight" style={{ fontSize: size >= 28 ? '1rem' : '0.875rem' }}>
          kairos
        </span>
      )}
    </Link>
  );
}
