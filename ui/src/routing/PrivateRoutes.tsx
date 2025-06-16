import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';

export default function PrivateRoutes() {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) return;

  return isLoggedIn() ? <Outlet /> : <Navigate to="/landing" state={{ from: location }} replace />;
}
