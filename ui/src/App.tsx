import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ApiExample } from './components/ApiExample';
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import AddCustomerPage from './components/customer/AddCustomerPage';
import ViewCustomersPage from './components/customer/ViewCustomersPage';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import { LoadingLayout } from './layouts/LoadingLayout';
import PrivateAdminRoutes from './routing/PrivateAdminRoutes';
import PrivateRoutes from './routing/PrivateRoutes';
import PublicRoutes from './routing/PublicRoutes';

function App() {
  return (
    <Suspense fallback={<LoadingLayout />}>
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<AuthenticatedLayout />}>
            <Route index element={<ApiExample />} />
            <Route path="/customers" element={<ViewCustomersPage />} />
            <Route element={<PrivateAdminRoutes />}>
              <Route path="/customers/create" element={<AddCustomerPage />} />
            </Route>
            {/* TO DO: Create a not found page */}
            <Route path="*" element={<ApiExample />} />
          </Route>
        </Route>
        <Route element={<PublicRoutes />}>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* TO DO: Create a not found page */}
          <Route path="*" element={<LandingPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
