import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isUserAuthorized } from '../components/auth/helpers/helpers';
import { useAuth } from '../context/auth/authContext';
import { Roles } from '../models/Roles';

export default function PrivateAdminRoutes() {
  const { user, isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) return;

  return isLoggedIn() && isUserAuthorized(user, [Roles.ADMIN]) ? (
    <Outlet />
  ) : (
    <Navigate to="/landing" state={{ from: location }} replace />
  );
}
