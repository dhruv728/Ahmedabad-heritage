import React from 'react';

interface BookingSummaryProps {
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
}

export function BookingSummary({ checkIn, checkOut, guests, totalPrice }: BookingSummaryProps) {
  return (
    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm space-y-2">
      <div className="flex justify-between">
        <span className="text-stone-600">Check-in:</span>
        <span className="font-medium text-stone-900">{checkIn}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-600">Check-out:</span>
        <span className="font-medium text-stone-900">{checkOut}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-600">Guests:</span>
        <span className="font-medium text-stone-900">{guests}</span>
      </div>
      <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-base text-stone-900">
        <span>Total Price:</span>
        <span className="text-heritage-polRed">₹{totalPrice}</span>
      </div>
    </div>
  );
}
