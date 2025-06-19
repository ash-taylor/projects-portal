import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth/authContext';

export default function PublicRoutes() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return;

  return isLoggedIn() ? <Navigate to="/" /> : <Outlet />;
}
