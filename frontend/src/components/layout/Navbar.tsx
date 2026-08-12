import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, openAuthModal, logout, getRedirectPathForRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Pol Areas', path: '/pols' },
    { name: 'Experiences', path: '/experiences' },
    { name: 'Heritage Map', path: '/map' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-[#1E5A5B] group-hover:text-[#B84A22] transition-colors">
            Amdavad Heritage
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-700">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`transition-colors ${
                  isActive
                    ? 'text-[#B84A22] font-semibold underline underline-offset-8 decoration-2'
                    : 'hover:text-[#1E5A5B]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button
            className="p-2 text-stone-600 hover:text-[#1E5A5B] hover:bg-stone-100 rounded-full transition"
            title="Language Picker"
          >
            <Globe className="w-5 h-5" />
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="text-xs font-bold uppercase tracking-wider text-[#B84A22] bg-[#B84A22]/10 hover:bg-[#B84A22]/20 px-3 py-1.5 rounded-full transition"
                >
                  Admin Tower
                </Link>
              )}

              {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
                <Link
                  to="/host/dashboard"
                  className="hidden sm:inline-flex text-xs font-semibold uppercase tracking-wider text-stone-700 hover:text-[#B84A22] transition px-2 py-2"
                >
                  Host Portal
                </Link>
              )}

              <div
                onClick={() => navigate(getRedirectPathForRole(user?.role || 'TRAVELER'))}
                className="flex items-center gap-2 bg-white border border-stone-200/80 px-3 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-stone-50 transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#1E5A5B] text-white flex items-center justify-center text-xs font-bold font-serif">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-bold text-stone-800">
                  {user?.full_name || user?.username}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                  }}
                  title="Sign Out"
                  className="ml-1 text-stone-400 hover:text-[#B84A22] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="bg-[#B84A22] hover:bg-[#A03E1C] text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-sm hover:shadow transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
