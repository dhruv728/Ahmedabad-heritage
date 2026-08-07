import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1';
  const variants = {
    primary: 'bg-heritage-polRed hover:bg-red-900 text-white focus:ring-heritage-polRed',
    secondary: 'bg-heritage-sandstone hover:bg-stone-300 text-heritage-dark focus:ring-heritage-sandstone',
    outline: 'border border-stone-300 hover:bg-stone-100 text-stone-700 focus:ring-stone-400',
  };

  return <button className={twMerge(clsx(base, variants[variant], className))} {...props} />;
}
