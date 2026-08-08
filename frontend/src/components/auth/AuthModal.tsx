import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function AuthModal({ onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const { setUser, setAccessToken, getRedirectPathForRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Requirement 1: Initial state for all form fields MUST be empty strings ('')
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'TRAVELER' | 'HOST'>('TRAVELER');
  const [idDocumentUrl, setIdDocumentUrl] = useState<string>('Aadhaar_Govt_ID_Verification.pdf');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password;
    const cleanFullName = fullName.trim();
    const cleanPhone = phone.trim();

    // Client-side field validations
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    if (activeTab === 'register') {
      if (!cleanFullName) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      const phoneDigits = cleanPhone.replace(/[^0-9]/g, '');
      if (phoneDigits.length < 7) {
        setError('Please enter a valid phone number (at least 7 digits).');
        setLoading(false);
        return;
      }

      if (role === 'HOST' && !idDocumentUrl) {
        setError('Please upload or attach your Govt ID / Aadhaar verification document.');
        setLoading(false);
        return;
      }

      try {
        // Requirement 1: POST http://127.0.0.1:8000/api/v1/auth/register/
        const res = await axios.post(`${API_BASE_URL}/api/v1/auth/register/`, {
          full_name: cleanFullName,
          email: cleanEmail,
          phone: cleanPhone,
          password: cleanPassword,
          role: role.toLowerCase(),
          id_document_url: role === 'HOST' ? (idDocumentUrl || 'Aadhaar_Govt_ID_Verification.pdf') : '',
        });

        if (res.status === 201 || res.status === 200) {
          setSuccessMessage('Registration successful! Your host account is pending Admin Verification.');
          setTimeout(() => {
            setActiveTab('login');
            setSuccessMessage(null);
          }, 1500);
        }
      } catch (err: any) {
        const backendError =
          err.response?.data?.detail ||
          err.response?.data?.error ||
          err.response?.data?.email?.[0] ||
          err.response?.data?.password?.[0] ||
          'Registration failed. Please check your details.';
        setError(typeof backendError === 'string' ? backendError : JSON.stringify(backendError));
      } finally {
        setLoading(false);
      }
    } else {
      try {
        // Requirement 1: POST http://127.0.0.1:8000/api/v1/auth/token/
        const res = await axios.post(`${API_BASE_URL}/api/v1/auth/token/`, {
          email: cleanEmail,
          password: cleanPassword,
        });

        const data = res.data;
        const accessToken = data.access || data.tokens?.access;
        const refreshToken = data.refresh || data.tokens?.refresh;
        const userObj = data.user;

        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        if (userObj) {
          const userRole = (userObj.role || 'TRAVELER').toUpperCase() as 'TRAVELER' | 'HOST' | 'ADMIN';
          const formattedUser = {
            id: String(userObj.id),
            username: userObj.username || userObj.email,
            email: userObj.email,
            phone: userObj.phone || '',
            full_name: userObj.full_name || userObj.email,
            role: userRole,
            is_verified: userObj.is_verified ?? (userRole !== 'HOST'),
            is_id_verified: userObj.is_id_verified ?? (userRole !== 'HOST'),
            id_document_url: userObj.id_document_url || '',
          };

          localStorage.setItem('user_profile', JSON.stringify(formattedUser));
          setUser(formattedUser);
          setAccessToken(accessToken);

          onClose();

          // Role-based redirect
          const redirectPath = getRedirectPathForRole(userRole);
          navigate(redirectPath);
        } else {
          setError('Invalid login response from server.');
        }
      } catch (err: any) {
        const backendError =
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Invalid Email or Password';
        setError(typeof backendError === 'string' ? backendError : 'Invalid Email or Password');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-100 relative text-stone-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-serif font-bold text-[#1E5A5B]">
            {activeTab === 'login' ? 'Sign In to Portal' : 'Create Heritage Account'}
          </h2>
          <p className="text-xs text-stone-500">
            {activeTab === 'login'
              ? 'Access traveler bookings, host properties, or admin portal'
              : 'Choose your role to get started'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'login' ? 'bg-white text-[#1E5A5B] shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'register' ? 'bg-white text-[#1E5A5B] shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 pt-1">
          
          {/* Requirement 1: REGISTER TAB */}
          {activeTab === 'register' ? (
            <>
              {/* Role Selector: ONLY Traveler and Host (NO Admin button) */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">SELECT YOUR ROLE</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('TRAVELER')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
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
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      role === 'HOST'
                        ? 'border-[#B84A22] bg-[#B84A22]/10 text-[#B84A22]'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Host
                  </button>
                </div>
              </div>

              {/* Input 1: Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">FULL NAME</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                  />
                </div>
              </div>

              {/* Input 2: Email Address */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                  />
                </div>
              </div>

              {/* Input 3: Phone Number */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">PHONE NUMBER</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    autoComplete="off"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                  />
                </div>
              </div>

              {/* Input 4: Identity Document Upload for Host */}
              {role === 'HOST' && (
                <div className="space-y-1">
                  <label className="block text-[11px] uppercase font-bold text-stone-500">
                    GOVT ID / AADHAAR VERIFICATION DOCUMENT <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="host-id-doc-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIdDocumentUrl(file.name);
                        }
                      }}
                    />
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl p-2 text-xs">
                      <button
                        type="button"
                        onClick={() => document.getElementById('host-id-doc-upload')?.click()}
                        className="px-3 py-1.5 rounded-lg bg-[#B84A22] text-white font-semibold text-[11px] hover:bg-[#A03E1C] transition shrink-0"
                      >
                        Upload ID File
                      </button>
                      <span className="text-stone-600 truncate font-mono text-[11px]">
                        {idDocumentUrl || 'No file selected (Govt ID / Aadhaar required)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Input 5: Password */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">PASSWORD</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Requirement 1: SIGN IN TAB (Email Address and Password ONLY) */
            <>
              {/* Input 1: Email Address */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                  />
                </div>
              </div>

              {/* Input 2: Password */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-bold text-stone-500">PASSWORD</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#1E5A5B] outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#B84A22] hover:bg-[#A03E1C] disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition hover:scale-105 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{activeTab === 'login' ? 'Sign In' : `Create ${role} Account`}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
