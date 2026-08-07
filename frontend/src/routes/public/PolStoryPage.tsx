import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function PolStoryPage() {
  const { polSlug } = useParams<{ polSlug: string }>();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="text-sm text-heritage-terracotta hover:underline">← Back to Home</Link>
      <h1 className="text-3xl font-bold mt-2 text-stone-900 font-display">Pol Heritage Story: {polSlug}</h1>
      <p className="text-stone-600 mt-2">Exploration of architectural history, chabutras, and community culture in this Pol cluster.</p>
    </div>
  );
}
