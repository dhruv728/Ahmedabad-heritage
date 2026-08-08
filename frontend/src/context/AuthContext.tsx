import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/auth/AuthModal';

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  email?: string;
  full_name: string;
  role: 'TRAVELER' | 'HOST' | 'ADMIN';
  is_id_verified?: boolean;
  is_verified?: boolean;
  verification_status?: string;
  id_document_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setUser: (user: UserProfile | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (credentials: { email?: string; password?: string }) => Promise<boolean>;
  register: (data: { email: string; full_name: string; phone?: string; role: string; password?: string; id_document_url?: string }) => Promise<boolean>;
  logout: () => void;
  getRedirectPathForRole: (role: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getRedirectPathForRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'HOST':
      return '/host/dashboard';
    case 'TRAVELER':
    default:
      return '/traveler/dashboard';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Restore stored auth session on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_profile');
    if (savedToken && savedUser) {
      try {
        setAccessToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.warn('Failed to parse saved user profile:', e);
      }
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Submit login credentials, store JWT tokens, and perform role-based redirect
  const login = async (credentials: { email?: string; password?: string }): Promise<boolean> => {
    const res = await fetch('/api/v1/auth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.detail || errData.error || 'Invalid Email or Password';
      throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Invalid Email or Password');
    }

    const data = await res.json();
    const token = data.access || data.tokens?.access || data.token;
    const refreshToken = data.refresh || data.tokens?.refresh || '';
    const userRole = (data.user?.role || 'TRAVELER').toUpperCase();

    const profile: UserProfile = {
      id: data.user?.id || 'user_id',
      username: data.user?.username || credentials.email || '',
      email: data.user?.email || credentials.email,
      phone: data.user?.phone || '',
      full_name: data.user?.full_name || 'User',
      role: userRole as any,
      is_id_verified: data.user?.is_id_verified ?? (userRole !== 'HOST'),
      is_verified: data.user?.is_verified ?? (userRole !== 'HOST'),
      verification_status: data.user?.verification_status || (data.user?.is_verified ? 'VERIFIED' : 'PENDING_VERIFICATION'),
      id_document_url: data.user?.id_document_url || '',
    };

    setAccessToken(token);
    setUser(profile);
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_profile', JSON.stringify(profile));
    closeAuthModal();

    // Role-Based Redirects
    const targetPath = getRedirectPathForRole(profile.role);
    navigate(targetPath);
    return true;
  };

  const register = async (data: { email: string; full_name: string; phone?: string; role: string; password?: string; id_document_url?: string }): Promise<boolean> => {
    const res = await fetch('/api/v1/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || '',
        role: data.role.toLowerCase(),
        password: data.password,
        id_document_url: data.id_document_url || '',
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let errorMsg = errData.detail || errData.error || 'Registration failed.';
      if (typeof errorMsg === 'object') {
        errorMsg = JSON.stringify(errorMsg);
      }
      if (errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('email')) {
        errorMsg = 'An account with this email already exists.';
      }
      throw new Error(errorMsg);
    }

    return await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        setUser,
        setAccessToken,
        login,
        register,
        logout,
        getRedirectPathForRole,
      }}
    >
      {children}
      {isAuthModalOpen && <AuthModal onClose={closeAuthModal} />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
