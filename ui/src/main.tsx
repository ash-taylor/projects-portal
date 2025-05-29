import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { api } from './api';
import { AuthProvider } from './context/auth/authContext.tsx';

import '@cloudscape-design/global-styles/index.css';
import './index.css';

// Initialize the API client
api.initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
