import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Proactively clear any stale Service Worker (e.g., cached from prior localhost:5173 apps)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(async (registrations) => {
      if (registrations.length > 0) {
        await Promise.all(
          registrations.map(async (registration) => {
            try {
              await registration.update();
            } catch {
              // ignore update failure before unregister
            }
            return registration.unregister();
          })
        );
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }
        if (!sessionStorage.getItem('wv_sw_cleaned')) {
          sessionStorage.setItem('wv_sw_cleaned', '1');
          window.location.reload();
        }
      }
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
