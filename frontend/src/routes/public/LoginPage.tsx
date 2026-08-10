import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, openAuthModal, getRedirectPathForRole } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRedirectPathForRole(user.role), { replace: true });
    } else {
      navigate('/', { replace: true });
      // Use setTimeout to ensure the modal opens after the navigation completes
      setTimeout(() => openAuthModal(), 100);
    }
  }, [isAuthenticated, user, navigate, openAuthModal, getRedirectPathForRole]);

  return null;
}
