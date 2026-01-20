import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './app/App';
import './styles/index.css';
import { I18nProvider } from './lib/i18n';
import { ToastProvider } from './components/ToastProvider';
import { FeatureFlagsProvider } from './lib/featureFlags';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ToastProvider>
          <FeatureFlagsProvider>
            <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
              <App />
            </BrowserRouter>
          </FeatureFlagsProvider>
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
