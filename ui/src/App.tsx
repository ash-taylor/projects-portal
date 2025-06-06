import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ApiExample } from './components/ApiExample';
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import { LoadingLayout } from './layouts/LoadingLayout';
import PrivateRoutes from './routing/PrivateRoutes';
import PublicRoutes from './routing/PublicRoutes';

function App() {
  return (
    <Suspense fallback={<LoadingLayout />}>
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<AuthenticatedLayout />}>
            <Route index element={<ApiExample />} />
          </Route>
        </Route>
        <Route element={<PublicRoutes />}>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
