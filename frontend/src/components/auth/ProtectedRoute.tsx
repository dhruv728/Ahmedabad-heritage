import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('TRAVELER' | 'HOST' | 'ADMIN')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect user to their own role's home dashboard
    let targetPath = '/traveler/dashboard';
    if (user.role === 'HOST') targetPath = '/host/dashboard';
    if (user.role === 'ADMIN') targetPath = '/admin/dashboard';

    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
}
