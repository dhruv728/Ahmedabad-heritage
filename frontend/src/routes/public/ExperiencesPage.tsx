import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { Filter, Calendar, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

const EXPERIENCES = [
  {
    id: 'walk',
    title: 'Heritage Walk of Ahmedabad',
    category: 'Walk',
    description: 'A guided walk starting from Swaminarayan Mandir in Kalupur to Jama Masjid. Witness the intricate architecture, secret passages, and the morning hustle of the Pols.',
    price: 350,
    duration: '2.5 Hours',
    image: '/images/hero_courtyard.png',
  },
  {
    id: 'food',
    title: 'Night Food Tour at Manek Chowk',
    category: 'Food',
    description: 'Experience the transformation of the city square into a bustling street food paradise. Taste iconic dishes like Ghughra sandwich, Pav Bhaji, and unique dosas.',
    price: 800,
    duration: '3 Hours',
    image: '/images/mangaldas_room.png',
  },
  {
    id: 'art',
    title: 'Block Printing Workshop',
    category: 'Art',
    description: 'Learn the ancient art of block printing from local artisans. Create your own souvenir fabric using traditional carved wooden blocks and natural dyes.',
    price: 1200,
    duration: '4 Hours',
    image: '/images/hero_courtyard.png',
  },
  {
    id: 'culture',
    title: 'Festive Pol Garba (Seasonal)',
    category: 'Culture',
    description: 'Join the locals in their neighborhood chowk for an authentic, high-energy Garba night during Navratri. Traditional attire encouraged!',
    price: 500,
    duration: 'Late Night',
    image: '/images/mangaldas_room.png',
  },
];

const CATEGORIES = ['All', 'Food', 'Walk', 'Art', 'Culture'];

export default function ExperiencesPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState<any>(null);

  const filteredExperiences = EXPERIENCES.filter((exp) =>
    activeFilter === 'All' ? true : exp.category === activeFilter
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1E5A5B]">
            Heritage Experiences
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Immerse yourself in the culture, flavors, and traditions of Ahmedabad. Book authentic local experiences hosted by our community.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Filter className="w-5 h-5 text-stone-400 mr-2 hidden sm:block" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === cat
                  ? 'bg-[#B84A22] text-white shadow-md'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredExperiences.map((exp) => (
            <div key={exp.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-stone-100 flex flex-col sm:flex-row group">
              <div className="w-full sm:w-2/5 h-64 sm:h-auto relative overflow-hidden bg-stone-100">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/mangaldas_room.png';
                  }}
                />
                <div className="absolute top-3 left-3 bg-[#1E5A5B]/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm uppercase tracking-wider">
                  {exp.category}
                </div>
              </div>

              <div className="p-6 sm:w-3/5 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2 group-hover:text-[#B84A22] transition-colors">
                    {exp.title}
                  </h3>
                  <p className="text-sm text-stone-600 line-clamp-3">
                    {exp.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {exp.duration}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Ahmedabad</span>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div className="text-lg font-serif font-bold text-stone-900">
                    ₹{exp.price} <span className="text-xs font-normal text-stone-500">/ person</span>
                  </div>
                  <button
                    onClick={() => setSelectedExperience(exp)}
                    className="px-4 py-2 bg-[#B84A22] text-white rounded-full text-sm font-semibold hover:bg-[#A03E1C] transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    Book <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Booking Modal */}
      {selectedExperience && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedExperience(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
            >
              ✕
            </button>
            
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#1E5A5B] uppercase tracking-wider">{selectedExperience.category}</div>
              <h2 className="text-2xl font-serif font-bold text-stone-900">{selectedExperience.title}</h2>
            </div>
            
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-center gap-3">
               <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
               <p className="text-sm text-amber-900 font-medium">Experience booking is currently simulated in this demo.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">Select Date</label>
                <input type="date" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1E5A5B] outline-none" />
              </div>
              
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">Participants</label>
                <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1E5A5B] outline-none">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'People'}</option>)}
                </select>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedExperience(null)}
              className="w-full py-3.5 bg-[#B84A22] text-white rounded-full font-semibold hover:bg-[#A03E1C] transition-colors shadow-md"
            >
              Confirm Booking - ₹{selectedExperience.price}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
