import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth/authContext';

export default function PrivateRoutes() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return;

  return isLoggedIn() ? <Outlet /> : <Navigate to="/landing" />;
}
