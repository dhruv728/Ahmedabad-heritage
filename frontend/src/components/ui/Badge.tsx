import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'heritage' | 'festival' | 'verified';
  className?: string;
}

export function Badge({ children, variant = 'heritage', className }: BadgeProps) {
  const variants = {
    heritage: 'bg-amber-100 text-amber-900 border-amber-300',
    festival: 'bg-orange-100 text-orange-900 border-orange-300',
    verified: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  };

  return (
    <span className={twMerge(clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[variant], className))}>
      {children}
    </span>
  );
}
