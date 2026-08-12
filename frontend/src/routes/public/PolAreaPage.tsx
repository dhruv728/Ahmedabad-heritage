import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { MapPin, Search, ArrowRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const POLS = [
  {
    id: 'mandvi',
    name: 'Mandvi ni Pol',
    description: 'Known for its intricate wooden facades and bustling community life. One of the oldest pols with deep historical significance.',
    image: '/images/hero_courtyard.png',
    activeStays: 4,
  },
  {
    id: 'dhal',
    name: 'Dhal ni Pol',
    description: 'Famous for its beautifully restored heritage homes and artisan workshops. A prime example of community-driven conservation.',
    image: '/images/mangaldas_room.png',
    activeStays: 6,
  },
  {
    id: 'french',
    name: 'French Pol',
    description: 'A unique blend of Gujarati and French colonial architecture. A quiet enclave offering a serene heritage experience.',
    image: '/images/hero_courtyard.png',
    activeStays: 2,
  },
];

export default function PolAreaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredPols = POLS.filter((pol) =>
    pol.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1E5A5B]">
            Explore the Pols
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Discover the living heritage of Ahmedabad through its historic neighborhoods. Each Pol has its own unique story, architecture, and community.
          </p>
        </div>

        <div className="max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-stone-400" />
          </div>
          <input
            type="text"
            placeholder="Search Pols by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E5A5B] focus:border-transparent transition-shadow"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPols.map((pol) => (
            <div key={pol.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-stone-100 group flex flex-col">
              <div className="relative h-56 overflow-hidden bg-stone-100">
                <img
                  src={pol.image}
                  alt={pol.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/mangaldas_room.png';
                  }}
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#1E5A5B] shadow-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Ahmedabad
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif font-bold text-stone-900 mb-2 group-hover:text-[#B84A22] transition-colors">
                  {pol.name}
                </h3>
                <p className="text-sm text-stone-600 line-clamp-3 mb-6 flex-1">
                  {pol.description}
                </p>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
                    <Home className="w-4 h-4 text-[#B84A22]" />
                    <span>{pol.activeStays} Stays</span>
                  </div>
                  <button
                    onClick={() => navigate(`/?search=${encodeURIComponent(pol.name)}`)}
                    className="text-[#1E5A5B] hover:text-[#B84A22] text-sm font-bold flex items-center gap-1 transition-colors"
                  >
                    View Stays <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredPols.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-500">No Pols found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
