import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore();
  return { user, isAuthenticated, logout };
}
