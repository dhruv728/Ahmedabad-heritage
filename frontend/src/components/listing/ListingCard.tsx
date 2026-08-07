import React from 'react';
import { Badge } from '../ui/Badge';

interface ListingCardProps {
  id: string;
  title: string;
  polName: string;
  pricePerNight: number;
  rating?: number;
  imageUrl?: string;
  isHeritageVerified?: boolean;
}

export function ListingCard({
  title,
  polName,
  pricePerNight,
  rating = 4.8,
  isHeritageVerified = true,
}: ListingCardProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="h-48 bg-stone-200 relative flex items-center justify-center text-stone-400">
        <span>Haveli Image Placeholder</span>
        {isHeritageVerified && (
          <div className="absolute top-3 left-3">
            <Badge variant="verified">Heritage Authenticity</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-stone-500 font-medium uppercase tracking-wider">{polName}</div>
        <h3 className="text-lg font-bold text-stone-900 font-display mt-1">{title}</h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-heritage-polRed">₹{pricePerNight} <span className="text-xs font-normal text-stone-500">/ night</span></span>
          <span className="text-xs text-stone-600 font-medium">★ {rating}</span>
        </div>
      </div>
    </div>
  );
}
