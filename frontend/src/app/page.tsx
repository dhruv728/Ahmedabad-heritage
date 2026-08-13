import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Heart,
  Award,
  Globe,
  ArrowRight,
  Utensils,
  Sun,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User as UserIcon
} from 'lucide-react';

interface ListingPhoto {
  id?: string;
  photo_url: string;
}

interface Listing {
  id: string;
  title: string;
  pol_name: string;
  description: string;
  price_per_night: number | string;
  max_guests: number;
  heritage_verified: boolean;
  photos?: ListingPhoto[];
  amenities?: Record<string, boolean>;
  rating?: number;
  review_count?: number;
}

export default function TravelerLandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal, logout, getRedirectPathForRole } = useAuth();

  // Search & Filter state
  const [polSearch, setPolSearch] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [guestCount, setGuestCount] = useState<string>('2');
  const [activePolFilter, setActivePolFilter] = useState<string>('All');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Listings state
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal State
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bookingCheckIn, setBookingCheckIn] = useState<string>('2026-08-15');
  const [bookingCheckOut, setBookingCheckOut] = useState<string>('2026-08-17');
  const [bookingGuests, setBookingGuests] = useState<number>(2);
  const [bookingPurpose, setBookingPurpose] = useState<string>('Heritage Walk');
  const [bookingArrival, setBookingArrival] = useState<string>('14:00');
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState<boolean>(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  // Auto-calculate dynamic price
  useEffect(() => {
    if (isAuthenticated && selectedListing && bookingCheckIn && bookingCheckOut) {
      if (new Date(bookingCheckOut) <= new Date(bookingCheckIn)) return;

      const calcPrice = async () => {
        setIsCalculatingPrice(true);
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          const token = localStorage.getItem('access_token');
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await axios.post('http://127.0.0.1:8000/api/v1/bookings/calculate-price/', {
            listing_id: selectedListing.id,
            check_in: bookingCheckIn,
            check_out: bookingCheckOut,
            guest_count: bookingGuests
          }, { headers });
          setPriceBreakdown(res.data);
        } catch (err) {
          setPriceBreakdown(null);
        } finally {
          setIsCalculatingPrice(false);
        }
      };
      calcPrice();
    }
  }, [bookingCheckIn, bookingCheckOut, bookingGuests, selectedListing, isAuthenticated]);

  // Requirement 3: Fetch active stays strictly from GET http://127.0.0.1:8000/api/v1/listings/?status=APPROVED
  const fetchListings = async (queryPol = '', queryGuests = '') => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { status: 'APPROVED' };
      if (queryPol) {
        params['pol_name'] = queryPol;
        params['search'] = queryPol;
      }
      if (queryGuests) {
        params['max_guests'] = queryGuests;
      }

      const res = await axios.get('http://127.0.0.1:8000/api/v1/listings/', { params });
      const data = res.data;
      const results = Array.isArray(data) ? data : data.results || [];
      setListings(results);
    } catch (err) {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(polSearch, guestCount);
  };

  const polFilters = ['All', 'Mangaldas Pol', 'Dhal ni Pol', 'Manek Chowk Pol', 'Khadia Pol'];

  const filteredListings = listings.filter((l) => {
    if (activePolFilter === 'All') return true;
    return l.pol_name.toLowerCase().includes(activePolFilter.toLowerCase());
  });

  const calcNights = () => {
    try {
      const d1 = new Date(bookingCheckIn);
      const d2 = new Date(bookingCheckOut);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) || diffDays === 0 ? 2 : diffDays;
    } catch {
      return 2;
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedListing) return;

    if (!isAuthenticated) {
      setAuthNotice('Please Sign In to Book');
      openAuthModal();
      return;
    }

    setIsBookingSubmitting(true);
    setBookingErrorMsg(null);
    setBookingSuccessMsg(null);

    const payload = {
      listing_id: selectedListing.id,
      listing: selectedListing.id,
      check_in: bookingCheckIn,
      check_out: bookingCheckOut,
      guest_count: bookingGuests,
      festival_tag: priceBreakdown?.detected_festival_name || 'none',
      purpose_of_visit: bookingPurpose,
      estimated_arrival_time: bookingArrival,
    };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Requirement 3: POST http://127.0.0.1:8000/api/v1/bookings/
      const res = await axios.post('http://127.0.0.1:8000/api/v1/bookings/', payload, { headers });

      if (res.status === 201 || res.status === 200) {
        const data = res.data;
        setBookingSuccessMsg(`Booking #${data.id || 'BK-101'} created & confirmed! Status: CONFIRMED.`);
        setTimeout(() => {
          setSelectedListing(null);
          setBookingSuccessMsg(null);
        }, 2000);
      }
    } catch (err: any) {
      const errData = err.response?.data;
      const errMsg = errData?.detail || errData?.error || (typeof errData === 'object' ? JSON.stringify(errData) : 'Failed to place booking.');
      setBookingErrorMsg(typeof errMsg === 'string' ? errMsg : 'Failed to place booking.');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans flex flex-col selection:bg-[#B84A22] selection:text-white">
      
      <Navbar />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-12">
        
        {/* 2. Hero Section with Background Courtyard Image */}
        <section className="relative rounded-3xl overflow-hidden shadow-xl min-h-[540px] flex items-end justify-center p-6 sm:p-10 border border-stone-200">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url('/images/hero_courtyard.png')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          </div>

          <div className="relative z-10 w-full max-w-4xl text-center space-y-8 pb-4">
            <div className="space-y-3 max-w-2xl mx-auto drop-shadow-md">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
                Discover Your Heritage Stay
              </h1>
              <p className="text-stone-100 text-sm sm:text-base font-light max-w-xl mx-auto leading-relaxed opacity-90">
                Experience the authentic soul of Ahmedabad. Stay in meticulously preserved Pol havelis and immerse yourself in centuries of living culture.
              </p>
            </div>

            {/* Requirement 3: Floating Search Bar connected to GET /api/v1/listings/?pol_name=... */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-2xl sm:rounded-full p-2 sm:p-3 shadow-2xl border border-stone-100 flex flex-col sm:flex-row items-center gap-3 sm:gap-2 text-left"
            >
              {/* Field 1: Pol Area */}
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 hover:bg-stone-50 rounded-full transition">
                <MapPin className="w-5 h-5 text-[#1E5A5B] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    POL AREA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dhal ni Pol"
                    value={polSearch}
                    onChange={(e) => setPolSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-stone-800 focus:outline-none placeholder-stone-400"
                  />
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-stone-200" />

              {/* Field 2: Check In / Check Out */}
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 hover:bg-stone-50 rounded-full transition">
                <Calendar className="w-5 h-5 text-[#1E5A5B] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    CHECK IN - CHECK OUT
                  </label>
                  <input
                    type="text"
                    placeholder="Add dates"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-stone-800 focus:outline-none placeholder-stone-400"
                  />
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-stone-200" />

              {/* Field 3: Guests */}
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 hover:bg-stone-50 rounded-full transition">
                <Users className="w-5 h-5 text-[#1E5A5B] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    GUESTS
                  </label>
                  <input
                    type="number"
                    placeholder="Add guests"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-stone-800 focus:outline-none placeholder-stone-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-12 h-12 bg-[#B84A22] hover:bg-[#A03E1C] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all shrink-0"
                title="Search Stays"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </section>

        {/* 3. Curated Haveli Stays Section */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                Curated Haveli Stays
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Handpicked heritage homes with verified hosts.
              </p>
            </div>

            {/* Pol Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {polFilters.map((pol) => (
                <button
                  key={pol}
                  onClick={() => {
                    setActivePolFilter(pol);
                    fetchListings(pol === 'All' ? '' : pol, guestCount);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
                    activePolFilter === pol
                      ? 'bg-[#1E5A5B] text-white shadow-sm'
                      : 'bg-stone-200/60 text-stone-700 hover:bg-stone-300/60'
                  }`}
                >
                  {pol}
                </button>
              ))}

              <button
                onClick={() => fetchListings('', '')}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#B84A22] hover:text-[#A03E1C] ml-2 shrink-0"
              >
                View all stays <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-stone-200/50 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-stone-200/80 shadow-sm text-center space-y-3 animate-fade-in">
              <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-stone-800">No listings found in this Pol.</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No active heritage stays match your search criteria. Try exploring another Pol area or resetting filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item) => {
                const photoSrc =
                  item.photos && item.photos.length > 0
                    ? item.photos[0].photo_url
                    : '/images/mangaldas_room.png';

                return (
                  <article
                    key={item.id}
                    onClick={() => setSelectedListing(item)}
                    className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    <div className="relative h-64 overflow-hidden bg-stone-100">
                      <img
                        src={photoSrc}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/mangaldas_room.png';
                        }}
                      />

                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 hover:text-[#B84A22] hover:bg-white transition shadow-sm"
                      >
                        <Heart className="w-4 h-4" />
                      </button>

                      {item.heritage_verified && (
                        <div className="absolute top-3 right-3 bg-[#D4AF37]/95 backdrop-blur-md text-stone-900 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-amber-300">
                          <Award className="w-3.5 h-3.5 text-[#B84A22]" />
                          <span>Heritage Verified</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-[#B84A22] transition-colors">
                            {item.title}
                          </h3>

                          <div className="flex items-center gap-1 text-xs font-bold text-stone-800">
                            <span className="text-amber-500">★</span>
                            <span>{item.rating || 4.9} {item.review_count ? `(${item.review_count})` : ''}</span>
                          </div>
                        </div>

                        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Amenity Tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] text-stone-700 text-[11px] font-medium border border-stone-200">
                          <Sun className="w-3 h-3 text-[#B84A22]" /> Terrace Access
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] text-stone-700 text-[11px] font-medium border border-stone-200">
                          <Utensils className="w-3 h-3 text-[#1E5A5B]" /> Gujarati Thali
                        </span>
                      </div>

                      {/* View Details / Book Now */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-base font-bold text-stone-900 font-serif">
                            ₹{Number(item.price_per_night).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-stone-500 font-normal"> / night</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/listings/${item.id}`);
                            }}
                            className="px-3 py-1.5 rounded-full border border-[#1E5A5B] text-[#1E5A5B] hover:bg-[#1E5A5B]/10 text-xs font-semibold transition"
                          >
                            Details
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedListing(item);
                            }}
                            className="px-4 py-1.5 rounded-full bg-[#B84A22] hover:bg-[#A03E1C] text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition hover:scale-105"
                          >
                            <span>Book Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Conditional Listing Detail / Booking Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-100 relative">
            
            <button
              onClick={() => setSelectedListing(null)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#1E5A5B] bg-[#1E5A5B]/10 px-2.5 py-0.5 rounded-full">
                  {selectedListing.pol_name}
                </span>
                <span className="text-xs font-bold text-amber-600">★ {selectedListing.rating || 4.9}</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900">
                {selectedListing.title}
              </h2>
            </div>

            {/* Read-Only Overview (Photos & Heritage Story) */}
            <div className="space-y-3">
              <div className="h-44 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={selectedListing.photos && selectedListing.photos.length > 0 ? selectedListing.photos[0].photo_url : '/images/mangaldas_room.png'}
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {selectedListing.description}
              </p>

              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 pt-1">
                <span>Rate per night:</span>
                <span className="text-lg font-serif font-bold text-[#B84A22]">
                  ₹{Number(selectedListing.price_per_night).toLocaleString('en-IN')} / night
                </span>
              </div>
            </div>

            {/* Requirement 2: Unauthenticated User Flow (Read-Only Preview + Sign In / Register to Book) */}
            {!isAuthenticated ? (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3 pt-3">
                <p className="text-xs font-medium text-amber-900 text-center">
                  Please sign in or create an account to book your stay.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedListing(null);
                    openAuthModal();
                  }}
                  className="w-full py-3 rounded-full bg-[#B84A22] hover:bg-[#A03E1C] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition hover:scale-105"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In / Register to Book</span>
                </button>
              </div>
            ) : (
              /* Requirement 3: Authenticated User Flow (Date Pickers, Price Breakdown, Confirm Booking) */
              <div className="space-y-4 pt-1">
                {/* Auto-filled User Context */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase font-bold text-stone-500">Full Name</label>
                    <input type="text" readOnly value={user?.full_name || ''} className="w-full bg-stone-100 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase font-bold text-stone-500">Email</label>
                    <input type="text" readOnly value={user?.email || ''} className="w-full bg-stone-100 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase font-bold text-stone-500">Phone</label>
                    <input type="text" readOnly value={user?.phone || ''} className="w-full bg-stone-100 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase font-bold text-stone-500">Home City</label>
                    <input type="text" readOnly value={(user as any)?.home_city || 'Not specified'} className="w-full bg-stone-100 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase font-bold text-stone-500">
                      CHECK IN
                    </label>
                    <input
                      type="date"
                      value={bookingCheckIn}
                      onChange={(e) => setBookingCheckIn(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase font-bold text-stone-500">
                      CHECK OUT
                    </label>
                    <input
                      type="date"
                      value={bookingCheckOut}
                      onChange={(e) => setBookingCheckOut(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase font-bold text-stone-500">
                      PURPOSE OF VISIT
                    </label>
                    <select
                      value={bookingPurpose}
                      onChange={(e) => setBookingPurpose(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                    >
                      <option value="Heritage Walk">Heritage Walk</option>
                      <option value="Festival">Festival</option>
                      <option value="Business">Business</option>
                      <option value="Family">Family</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase font-bold text-stone-500">
                      ESTIMATED ARRIVAL
                    </label>
                    <select
                      value={bookingArrival}
                      onChange={(e) => setBookingArrival(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                    >
                      <option value="12:00:00">12:00 PM</option>
                      <option value="14:00:00">02:00 PM</option>
                      <option value="16:00:00">04:00 PM</option>
                      <option value="18:00:00">06:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase font-bold text-stone-500">
                    GUESTS
                  </label>
                  <select
                    value={bookingGuests}
                    onChange={(e) => setBookingGuests(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                  </select>
                </div>

                {/* Price Breakdown Box */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2 text-xs">
                  {isCalculatingPrice ? (
                     <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-stone-400" /></div>
                  ) : priceBreakdown ? (
                     <>
                       {priceBreakdown.detected_festival_name && (
                         <div className="mb-2 inline-flex items-center gap-1 bg-[#B84A22]/10 text-[#B84A22] px-2 py-1 rounded text-[10px] font-bold">
                           🎉 {priceBreakdown.detected_festival_name} Surge Applied
                         </div>
                       )}
                       <div className="flex justify-between text-stone-600">
                         <span>Base Rate ({calcNights()} nights)</span>
                         <span>₹{priceBreakdown.base_rate}</span>
                       </div>
                       {priceBreakdown.festival_surge > 0 && (
                         <div className="flex justify-between text-stone-600">
                           <span>Festival Surge</span>
                           <span>+ ₹{priceBreakdown.festival_surge}</span>
                         </div>
                       )}
                       {priceBreakdown.weekend_surge > 0 && (
                         <div className="flex justify-between text-stone-600">
                           <span>Weekend Surge</span>
                           <span>+ ₹{priceBreakdown.weekend_surge}</span>
                         </div>
                       )}
                       {priceBreakdown.discount > 0 && (
                         <div className="flex justify-between text-green-600">
                           <span>Long Stay Discount</span>
                           <span>- ₹{priceBreakdown.discount}</span>
                         </div>
                       )}
                       <div className="flex justify-between text-stone-600">
                         <span>AHHE Fee (5%)</span>
                         <span>₹{Math.round(priceBreakdown.total * 0.05).toLocaleString('en-IN')}</span>
                       </div>
                       <div className="pt-2 border-t border-amber-200/80 flex justify-between font-bold text-stone-900 text-sm font-serif">
                         <span>Total Amount</span>
                         <span className="text-[#B84A22]">
                           ₹{Math.round(priceBreakdown.total * 1.05).toLocaleString('en-IN')}
                         </span>
                       </div>
                     </>
                  ) : (
                     <div className="text-center text-stone-500 py-2">Select valid dates for price calculation</div>
                  )}
                </div>

                {bookingErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{bookingErrorMsg}</span>
                  </div>
                )}

                {bookingSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{bookingSuccessMsg}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedListing(null)}
                    className="flex-1 py-3 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isBookingSubmitting}
                    className="flex-1 py-3 rounded-full bg-[#B84A22] hover:bg-[#A03E1C] disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition hover:scale-105"
                  >
                    {isBookingSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Reserving...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#F4EFEA] border-t border-stone-200/80 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-2">
            <h3 className="text-xl font-serif font-bold text-[#1E5A5B]">
              Amdavad Heritage
            </h3>
            <p className="text-xs text-stone-500 max-w-sm">
              © 2024 Amdavad Heritage Homestay Exchange. Preserving the Pols of Ahmedabad.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-medium text-stone-600">
            <a href="#about" className="hover:text-[#B84A22] transition">About the Pols</a>
            <a href="#sustainability" className="hover:text-[#B84A22] transition">Sustainability</a>
            <a href="#guest-policy" className="hover:text-[#B84A22] transition">Guest Policy</a>
            <a href="#privacy" className="hover:text-[#B84A22] transition">Privacy</a>
            <a href="#accessibility" className="hover:text-[#B84A22] transition">Accessibility</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
