import React from 'react';
import { Link } from 'react-router-dom';

export default function SearchResults() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link to="/" className="text-sm text-heritage-terracotta hover:underline">← Home</Link>
      <h1 className="text-3xl font-bold mt-2 text-stone-900 font-display">Heritage Homestays Search</h1>
      <p className="text-stone-600 mt-2">Filter by Pol area, festival package (Uttarayan / Navratri / Diwali), and amenities.</p>
    </div>
  );
}
