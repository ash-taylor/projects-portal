import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import AddCustomerPage from './components/customers/AddCustomerPage';
import ViewCustomersPage from './components/customers/ViewCustomersPage';
import DashboardPage from './components/dashboard/DashboardPage';
import AddProjectPage from './components/projects/AddProjectPage';
import ViewProjectsPage from './components/projects/ViewProjectsPage';
import ViewUsersPage from './components/users/ViewUsersPage';
import { SplitPanelProvider } from './context/split-panel/SplitPanelContext';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import { LoadingLayout } from './layouts/LoadingLayout';
import PrivateAdminRoutes from './routing/PrivateAdminRoutes';
import PrivateRoutes from './routing/PrivateRoutes';
import PublicRoutes from './routing/PublicRoutes';

function App() {
  return (
    <Suspense fallback={<LoadingLayout />}>
      <SplitPanelProvider>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route path="/" element={<AuthenticatedLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/customers" element={<ViewCustomersPage />} />
              <Route path="/projects" element={<ViewProjectsPage />} />
              <Route path="/users" element={<ViewUsersPage />} />
              <Route element={<PrivateAdminRoutes />}>
                <Route path="/customers/create" element={<AddCustomerPage />} />
                <Route path="/projects/create" element={<AddProjectPage />} />
              </Route>
              <Route path="*" element={<DashboardPage />} />
            </Route>
          </Route>
          <Route element={<PublicRoutes />}>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<LandingPage />} />
          </Route>
        </Routes>
      </SplitPanelProvider>
    </Suspense>
  );
}

export default App;
