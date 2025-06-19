import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { apiClient } from './api/ApiClient.ts';
import { websiteBaseName } from './config/config.ts';
import { AuthProvider } from './context/auth/authContext.tsx';

import '@cloudscape-design/global-styles/index.css';
import './index.css';

// Initialize the API client
apiClient.initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={websiteBaseName}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
