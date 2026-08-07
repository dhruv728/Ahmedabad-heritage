import React from 'react';
import { Link } from 'react-router-dom';

export default function Messages() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link to="/" className="text-sm text-heritage-terracotta hover:underline">← Home</Link>
      <h1 className="text-3xl font-bold mt-2 text-stone-900 font-display">In-Platform Messaging</h1>
      <p className="text-stone-600 mt-2">Chat between host and guest prior to check-in.</p>
    </div>
  );
}
