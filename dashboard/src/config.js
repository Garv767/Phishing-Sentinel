// dashboard/src/config.js

const CONFIG = {
    // Vite requires the VITE_ prefix to expose variables to the client
    API_BASE_URL: import.meta.env.VITE_API_URL || 'https://phishing-sentinel-api-service.onrender.com',
    
    // You can add other global settings here
    TIMEOUT: 5000,
    IS_PROD: import.meta.env.PROD, // Automatically true on Render
    SENTINEL_ENDPOINT: import.meta.env.VITE_SENTINEL_ENDPOINT || 'http://localhost:3001/evaluate',
    SENTINEL_API_KEY: import.meta.env.VITE_SENTINEL_API_KEY || '',
};

export default CONFIG;