// dashboard/src/config.js

const CONFIG = {
    // Vite requires the VITE_ prefix to expose variables to the client
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    
    // You can add other global settings here
    TIMEOUT: 5000,
    IS_PROD: import.meta.env.PROD, // Automatically true on Render
};

export default CONFIG;