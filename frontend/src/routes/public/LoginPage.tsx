import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Phone, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState<string>('+919876543210');
  const [password, setPassword] = useState<string>('password123');
  const [fullName, setFullName] = useState<string>('Dhruv Prajapati');
  const [username, setUsername] = useState<string>('dhruv_user');
  const [role, setRole] = useState<'TRAVELER' | 'HOST' | 'ADMIN'>('TRAVELER');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  if (isAuthenticated && user) {
    let targetPath = '/traveler/dashboard';
    if (user.role === 'HOST') targetPath = '/host/dashboard';
    if (user.role === 'ADMIN') targetPath = '/admin/dashboard';
    navigate(targetPath, { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'login') {
        await login({ email: phone, password });
      } else {
        await register({ email: phone, phone, full_name: fullName, role, password });
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#B84A22] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-block">
          <span className="text-3xl font-bold font-serif text-[#1E5A5B]">
            Amdavad Heritage
          </span>
        </Link>
        <h2 className="text-2xl font-serif font-bold text-stone-900">
          {activeTab === 'login' ? 'Sign in to your account' : 'Create your heritage account'}
        </h2>
        <p className="text-xs text-stone-500">
          Exchange homestays, host authentic Pol havelis, or manage heritage approvals.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-stone-200/80 sm:px-10 space-y-6">
          
          {/* Tab Switcher */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 rounded-lg transition ${
                activeTab === 'login' ? 'bg-white text-[#1E5A5B] shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 rounded-lg transition ${
                activeTab === 'register' ? 'bg-white text-[#1E5A5B] shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Selection */}
            <div className="space-y-1">
              <label className="block text-[11px] uppercase font-bold text-stone-500">ACCOUNT ROLE</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('TRAVELER')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                    role === 'TRAVELER'
                      ? 'border-[#1E5A5B] bg-[#1E5A5B]/10 text-[#1E5A5B]'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Traveler
                </button>
                <button
                  type="button"
                  onClick={() => setRole('HOST')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                    role === 'HOST'
                      ? 'border-[#B84A22] bg-[#B84A22]/10 text-[#B84A22]'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Host
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                    role === 'ADMIN'
                      ? 'border-amber-600 bg-amber-50 text-amber-800'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {activeTab === 'register' && (
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">FULL NAME</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dhruv Prajapati"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] uppercase font-bold text-stone-500">PHONE OR EMAIL</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] uppercase font-bold text-stone-500">PASSWORD</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#B84A22] hover:bg-[#A03E1C] disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition hover:scale-105 pt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirecting to portal...</span>
                </>
              ) : (
                <>
                  <span>{activeTab === 'login' ? `Sign In as ${role}` : `Create ${role} Account`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
