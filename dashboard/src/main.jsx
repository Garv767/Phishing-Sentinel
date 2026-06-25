import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import SentinelSDK from './sentinel-sdk/sentinel-sdk.js'

// Bind SentinelSDK globally for legacy compatibility
window.SentinelSDK = SentinelSDK;

// Override window.fetch to auto-inject behavioral telemetry
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  if (window.sentinel && (url.toString().includes('/api/') || url.toString().includes('/login') || url.toString().includes('/register'))) {
    try {
      const telemetry = window.sentinel.getTelemetry();
      const telemetryHeader = btoa(JSON.stringify(telemetry));

      let headers = options.headers || {};
      if (headers instanceof Headers) {
        headers.set('X-Sentinel-Telemetry', telemetryHeader);
      } else if (Array.isArray(headers)) {
        headers.push(['X-Sentinel-Telemetry', telemetryHeader]);
      } else {
        headers = {
          ...headers,
          'X-Sentinel-Telemetry': telemetryHeader
        };
      }
      options.headers = headers;
    } catch (e) {
      console.error("[Sentinel] Failed to auto-inject telemetry:", e);
    }
  }
  return originalFetch(url, options);
};

// Auto-initialize Sentinel SDK if already authenticated
const token = localStorage.getItem('sentinel_token');
if (token && !window.sentinel) {
  const userId = localStorage.getItem('sentinel_user_id') || 'authenticated_user';
  window.sentinel = new SentinelSDK({
    endpoint: import.meta.env.VITE_SENTINEL_ENDPOINT || 'https://api.sentinellayer.in/evaluate',
    apiKey: import.meta.env.VITE_SENTINEL_API_KEY || '',
    userId: userId,
    sessionId: token
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
