import React from 'react';
import Navbar from '../../components/layout/Navbar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LOCATIONS = [
  {
    id: '1',
    position: [23.0225, 72.5714] as [number, number],
    title: 'Mangaldas ni Haveli',
    type: 'Homestay',
    description: 'A beautifully restored 150-year-old heritage property in the heart of the walled city.',
    link: '/?search=Mangaldas',
  },
  {
    id: '2',
    position: [23.0240, 72.5730] as [number, number],
    title: 'Manek Chowk',
    type: 'Landmark',
    description: 'Bustling city square that transforms into a night food market.',
    link: '/experiences',
  },
  {
    id: '3',
    position: [23.0210, 72.5700] as [number, number],
    title: 'Dhal ni Pol',
    type: 'Pol Area',
    description: 'Historic neighborhood known for artisan workshops and community life.',
    link: '/pols',
  },
];

export default function HeritageMapPage() {
  const center: [number, number] = [23.0225, 72.5714]; // Old Ahmedabad Coordinates

  return (
    <div className="h-screen bg-[#FAF8F5] text-stone-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col relative w-full h-full">
        <div className="absolute top-6 left-6 z-[400] bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-stone-100 max-w-sm pointer-events-auto">
          <h1 className="text-2xl font-serif font-bold text-[#1E5A5B] mb-2">Heritage Map</h1>
          <p className="text-sm text-stone-600">
            Explore the walled city of Ahmedabad. Click on markers to discover historic Pols, landmarks, and authentic heritage stays.
          </p>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Active Stays & Landmarks</span>
            </div>
          </div>
        </div>

        <div className="w-full h-full z-0 flex-1">
          <MapContainer center={center} zoom={15} scrollWheelZoom={true} className="w-full h-full min-h-[500px]" style={{ height: '500px', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {LOCATIONS.map((loc) => (
              <Marker key={loc.id} position={loc.position}>
                <Popup className="heritage-popup">
                  <div className="p-1 min-w-[200px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B84A22]">
                      {loc.type}
                    </span>
                    <h3 className="text-base font-serif font-bold text-stone-900 mt-1 mb-2">
                      {loc.title}
                    </h3>
                    <p className="text-xs text-stone-600 mb-3">
                      {loc.description}
                    </p>
                    <a
                      href={loc.link}
                      className="inline-block px-4 py-1.5 bg-[#1E5A5B] text-white text-xs font-semibold rounded-full hover:bg-[#154242] transition-colors"
                    >
                      View Details
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>
      
      <style>{`
        .leaflet-container {
          font-family: inherit;
        }
        .heritage-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          border: 1px solid #f5f5f4;
        }
        .heritage-popup .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
    </div>
  );
}
