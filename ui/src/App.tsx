import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ApiExample } from './components/ApiExample';
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import AddCustomerPage from './components/customers/AddCustomerPage';
import ViewCustomersPage from './components/customers/ViewCustomersPage';
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
              <Route index element={<ApiExample />} />
              <Route path="/customers" element={<ViewCustomersPage />} />
              <Route path="/projects" element={<ViewProjectsPage />} />
              <Route path="/users" element={<ViewUsersPage />} />
              <Route element={<PrivateAdminRoutes />}>
                <Route path="/customers/create" element={<AddCustomerPage />} />
                <Route path="/projects/create" element={<AddProjectPage />} />
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
      </SplitPanelProvider>
    </Suspense>
  );
}

export default App;
