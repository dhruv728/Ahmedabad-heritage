import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ListingWizard from '../../components/host/ListingWizard';
import {
  Building2,
  Calendar,
  Check,
  X,
  Plus,
  Sparkles,
  Sun,
  Utensils,
  Bath,
  Building,
  User as UserIcon,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  ArrowRight,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

interface HostBookingRequest {
  id: string;
  traveler_name: string;
  traveler_phone: string;
  property_title: string;
  pol_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'PENDING_APPROVAL' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'REQUESTED' | string;
}

interface HostProperty {
  id: string;
  title: string;
  pol_name: string;
  price_per_night: number;
  pricing_mode: 'per_room' | 'per_person';
  status: 'pending' | 'active';
  amenities: {
    rooftop_access: boolean;
    attached_bath: boolean;
    gujarati_breakfast: boolean;
  };
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'listings' | 'pricing'>('requests');

  // Booking Requests Queue State (Starts empty)
  const [bookingRequests, setBookingRequests] = useState<HostBookingRequest[]>([]);

  // Host Properties State (Starts empty)
  const [properties, setProperties] = useState<HostProperty[]>([]);

  // ML Pricing Widget State
  const [selectedFestival, setSelectedFestival] = useState<string>('uttarayan');
  const [mlSuggestedPrice, setMlSuggestedPrice] = useState<number>(3960);
  const [isMlLoading, setIsMlLoading] = useState<boolean>(false);
  const [pricingMode, setPricingMode] = useState<'per_room' | 'per_person'>('per_room');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchHostData = async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      // Requirement 2: Fetch live host bookings from GET http://127.0.0.1:8000/api/v1/bookings/host-bookings/
      const bookingsRes = await axios.get('http://127.0.0.1:8000/api/v1/bookings/host-bookings/', { headers });
      const data = bookingsRes.data;
      const results = Array.isArray(data) ? data : data.results || [];
      const formatted: HostBookingRequest[] = results.map((b: any) => ({
        id: String(b.id || 'BK-100'),
        traveler_name: b.guest?.full_name || b.guest?.email || 'Traveler Guest',
        traveler_phone: b.guest?.phone || 'Phone not provided',
        property_title: b.listing?.title || 'Heritage Stay',
        pol_name: b.listing?.pol_name || 'Old Ahmedabad',
        check_in: b.check_in,
        check_out: b.check_out,
        guests: b.guest_count || 1,
        total_price: Number(b.total_price) || 0,
        status: b.status?.toUpperCase() || 'REQUESTED',
      }));
      setBookingRequests(formatted);
    } catch (err) {
      console.warn('Failed to fetch host bookings');
    }

    try {
      // Fetch host properties
      const propsRes = await axios.get('http://127.0.0.1:8000/api/v1/listings/', { headers });
      const data = propsRes.data;
      const results = Array.isArray(data) ? data : data.results || [];
      const hostProps = user?.id ? results.filter((p: any) => p.host?.id === user.id || p.host === user.id) : results;
      const formattedProps: HostProperty[] = hostProps.map((p: any) => ({
        id: String(p.id),
        title: p.title,
        pol_name: p.pol_name,
        price_per_night: Number(p.price_per_night) || 0,
        pricing_mode: 'per_room',
        status: p.status === 'APPROVED' || p.status === 'active' ? 'active' : 'pending',
        amenities: p.amenities || { rooftop_access: false, attached_bath: true, gujarati_breakfast: false },
      }));
      setProperties(formattedProps);
    } catch (err) {
      console.warn('Failed to fetch host properties');
    }
  };

  useEffect(() => {
    fetchHostData();
  }, [user?.id]);

  // Requirement 2: Handle Accept / Decline / Check-In / Check-Out Actions
  const handleBookingAction = async (id: string, action: 'CONFIRMED' | 'REJECTED' | 'CHECK_IN' | 'CHECK_OUT') => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let endpoint = `http://127.0.0.1:8000/api/v1/bookings/${id}/accept/`;
      let nextStatus = 'CONFIRMED';
      let actionText = 'accepted & confirmed';

      if (action === 'REJECTED') {
        endpoint = `http://127.0.0.1:8000/api/v1/bookings/${id}/reject/`;
        nextStatus = 'CANCELLED_REFUNDED';
        actionText = 'declined and payment refunded to traveler';
      } else if (action === 'CHECK_IN') {
        endpoint = `http://127.0.0.1:8000/api/v1/bookings/${id}/check_in/`;
        nextStatus = 'CHECKED_IN';
        actionText = 'checked-in successfully';
      } else if (action === 'CHECK_OUT') {
        endpoint = `http://127.0.0.1:8000/api/v1/bookings/${id}/check_out/`;
        nextStatus = 'STAYED';
        actionText = 'checked-out (stay completed)';
      }

      await axios.patch(endpoint, {}, { headers });

      setBookingRequests((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b))
      );

      setNotification(`Booking request ${id} has been ${actionText}!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.warn('Backend API update error');
    }
  };

  const calculateMlSurgePrice = async (festival: string) => {
    setIsMlLoading(true);
    try {
      const res = await fetch('/api/v1/ml/suggest-price/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pol_name: 'Mandvi ni Pol',
          room_type: 'entire_haveli',
          max_guests: 4,
          heritage_verified: true,
          festival_tag: festival,
          days_to_event: festival === 'uttarayan' ? 14 : festival === 'navratri' ? 30 : 60,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggested_price_per_night) {
          setMlSuggestedPrice(Math.round(data.suggested_price_per_night));
        }
      } else {
        const mult = festival === 'uttarayan' ? 2.2 : festival === 'navratri' ? 1.8 : festival === 'diwali' ? 1.6 : 1.0;
        setMlSuggestedPrice(Math.round(1800 * mult));
      }
    } catch {
      const mult = festival === 'uttarayan' ? 2.2 : festival === 'navratri' ? 1.8 : festival === 'diwali' ? 1.6 : 1.0;
      setMlSuggestedPrice(Math.round(1800 * mult));
    } finally {
      setIsMlLoading(false);
    }
  };

  useEffect(() => {
    calculateMlSurgePrice(selectedFestival);
  }, [selectedFestival]);

  if (showWizard) {
    return (
      <ListingWizard
        onSuccess={() => {
          setShowWizard(false);
          fetchHostData();
          setNotification('New heritage property created! Status set to PENDING Admin Verification.');
        }}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans selection:bg-[#B84A22] selection:text-white">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-[#1E5A5B]">
              Amdavad Heritage
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-[#B84A22] bg-[#B84A22]/10 px-3 py-1 rounded-full">
              Host Control Tower
            </span>

            <div className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-sm">
              <div className="w-7 h-7 rounded-full bg-[#B84A22] text-white flex items-center justify-center text-xs font-bold font-serif">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'H'}
              </div>
              <span className="text-xs font-bold text-stone-800">{user?.full_name || user?.email || 'Host'}</span>
              <button onClick={logout} title="Sign Out" className="ml-1 text-stone-400 hover:text-[#B84A22] transition">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E5A5B]">
              Host Management Portal
            </h1>
            <p className="text-stone-500 text-sm">
              Review traveler booking requests, adjust festival pricing, and manage your heritage listings.
            </p>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B84A22] hover:bg-[#A03E1C] text-white text-xs font-semibold shadow-md transition hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Property</span>
          </button>
        </div>

        {/* Status Notification Toast */}
        {notification && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center gap-3 shadow-md animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-stone-200/70 p-1 rounded-2xl text-xs font-semibold max-w-lg">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'requests' ? 'bg-white text-[#1E5A5B] shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Booking Requests ({bookingRequests.filter((b) => b.status === 'REQUESTED' || b.status === 'CONFIRMED').length})
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'listings' ? 'bg-white text-[#1E5A5B] shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            My Properties ({properties.length})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'pricing' ? 'bg-white text-[#1E5A5B] shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ML Smart Pricing Engine
          </button>
        </div>

        {/* TAB 1: BOOKING REQUESTS OVERVIEW */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="border-b border-stone-200/80 pb-3">
              <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#B84A22]" /> Incoming Traveler Reservations
              </h2>
            </div>

            {bookingRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-stone-200/80 shadow-sm text-center space-y-3 animate-fade-in">
                <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="font-serif font-bold text-lg text-stone-800">No booking requests yet.</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  When travelers book your heritage homestay, incoming reservation requests will appear here for your review and approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingRequests.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#1E5A5B] uppercase tracking-wider bg-[#1E5A5B]/10 px-2.5 py-0.5 rounded-full">
                          {b.pol_name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : b.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-stone-900">
                        {b.traveler_name} ({b.guests} Guests)
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-[#B84A22]" /> {b.check_in} to {b.check_out}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-[#1E5A5B]" /> {b.traveler_phone}
                        </span>
                        <span className="font-bold text-stone-900">
                          Total Payout: ₹{b.total_price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {b.status === 'REQUESTED' ? (
                      <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button
                          onClick={() => handleBookingAction(b.id, 'REJECTED')}
                          className="flex-1 lg:flex-none px-5 py-2.5 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                        >
                          Decline
                        </button>

                        <button
                          onClick={() => handleBookingAction(b.id, 'CONFIRMED')}
                          className="flex-1 lg:flex-none px-6 py-2.5 rounded-full bg-[#1E5A5B] hover:bg-[#154142] text-white text-xs font-semibold shadow flex items-center justify-center gap-1.5 transition hover:scale-105"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Accept Booking</span>
                        </button>
                      </div>
                    ) : b.status === 'CONFIRMED' ? (
                      <button
                        onClick={() => handleBookingAction(b.id, 'CHECK_IN')}
                        className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
                      >
                        Check-In Guest
                      </button>
                    ) : b.status === 'CHECKED_IN' ? (
                      <button
                        onClick={() => handleBookingAction(b.id, 'CHECK_OUT')}
                        className="px-5 py-2.5 rounded-full bg-[#B84A22] hover:bg-[#A03E1C] text-white text-xs font-bold shadow transition"
                      >
                        Check-Out Guest
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                        {b.status === 'STAYED' ? 'Stay Completed' : b.status === 'CANCELLED_REFUNDED' ? 'Declined & Refunded' : b.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY LISTED PROPERTIES */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="border-b border-stone-200/80 pb-3">
              <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1E5A5B]" /> Managed Heritage Listings
              </h2>
            </div>

            {properties.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-stone-200/80 shadow-sm text-center space-y-4 animate-fade-in">
                <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="font-serif font-bold text-lg text-stone-800">No properties added yet</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  List your heritage haveli or traditional Pol home to start welcoming guests from around the world.
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B84A22] text-white text-xs font-semibold hover:bg-[#A03E1C] transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Listing</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((p) => (
                  <div key={p.id} className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#1E5A5B] uppercase tracking-wider">{p.pol_name}</span>
                        <h3 className="font-serif font-bold text-lg text-stone-900 mt-1">{p.title}</h3>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
                        p.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{p.status === 'active' ? 'APPROVED & PUBLISHED' : 'PENDING Verification'}</span>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="font-serif font-bold text-[#B84A22] text-base">
                        ₹{p.price_per_night.toLocaleString('en-IN')} / night
                      </span>
                      <span className="text-stone-500 font-medium capitalize">
                        Pricing Mode: {p.pricing_mode.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ML SMART PRICING & DYNAMIC PARAMETERS */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b border-stone-200/80 pb-3">
              <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#B84A22]" /> Festival Surge & Pricing Parameters
              </h2>
            </div>

            {/* Requirement 2: Pricing Model Selector & Festival Toggles */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-md space-y-6">
              
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700">Base Pricing Model</label>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <button
                    onClick={() => setPricingMode('per_room')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition text-center ${
                      pricingMode === 'per_room'
                        ? 'border-[#1E5A5B] bg-[#1E5A5B]/10 text-[#1E5A5B]'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Per Room Rate (Whole Haveli)
                  </button>

                  <button
                    onClick={() => setPricingMode('per_person')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition text-center ${
                      pricingMode === 'per_person'
                        ? 'border-[#B84A22] bg-[#B84A22]/10 text-[#B84A22]'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Per Person Rate (Dormitory/Hostel)
                  </button>
                </div>
              </div>

              {/* Requirement 2: ML Smart Price Predictor API Trigger Widget */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-white border border-amber-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1E5A5B]">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>UPCOMING FESTIVAL PRICE PREDICTOR (ML ENGINE)</span>
                  </div>

                  <select
                    value={selectedFestival}
                    onChange={(e) => setSelectedFestival(e.target.value)}
                    className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 outline-none"
                  >
                    <option value="uttarayan">Uttarayan Kite Festival (Jan)</option>
                    <option value="navratri">Navratri Garba Nights (Oct)</option>
                    <option value="diwali">Diwali Lights Surge (Nov)</option>
                    <option value="none">Standard Season (No Festival)</option>
                  </select>
                </div>

                <div className="flex items-baseline justify-between pt-2">
                  <div>
                    <p className="text-xs text-stone-600">Recommended Nightly Rate:</p>
                    <span className="text-3xl font-serif font-bold text-[#B84A22]">
                      ₹{mlSuggestedPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-stone-500"> / night</span>
                  </div>

                  {isMlLoading && <Loader2 className="w-5 h-5 text-[#1E5A5B] animate-spin" />}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
