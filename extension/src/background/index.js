// Use HTTPS for Render.com to avoid Mixed Content or connection errors
const API_ENDPOINT = 'https://phishing-sentinel.onrender.com/api/analyze'; // Change to your Render URL or localhost for testing

// 1. Listen for Token Sync from Dashboard (External)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.type === "SYNC_TOKEN") {
        chrome.storage.local.set({ sentinel_token: request.token }, () => {
            console.log("[Sentinel] Token synced from Dashboard");
            sendResponse({ success: true });
        });
        return true; // Keep channel open for the async storage callback
    }

    // Handle logout from dashboard
    if (request.type === "LOGOUT") {
        chrome.storage.local.remove('sentinel_token', () => {
            console.log("[Sentinel] Token cleared from extension storage");
            sendResponse({ success: true });
        });
        return true; // Keep channel open for the async storage callback
    }
    
});

// 2. Listen for Scan Requests from Content Scripts (Internal)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PERFORM_SCAN") {
        // We call an async function but return true IMMEDIATELY to keep the port open
        handleScan(message.data, sendResponse);
        return true; 
    }
});

/**
 * Logic abstracted to an async function to handle the fetch lifecycle
 */
async function handleScan(domData, sendResponse) {
    try {
        // 1. Retrieve token
        const result = await chrome.storage.local.get(['sentinel_token']);
        const token = result.sentinel_token;

        if (!token) {
            console.warn("[Sentinel] No JWT token found.");
            sendResponse({ error: "Unauthorized: Please log in to the Sentinel Hub." });
            return;
        }

        // 2. Execute Fetch with a timeout (Render free tier can be slow to wake up)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(domData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        sendResponse(data);

    } catch (error) {
        console.error("[Sentinel Background] Scan Error:", error);
        
        // Provide specific feedback for Render cold starts or CORS/Network issues
        const errorMessage = error.name === 'AbortError' 
            ? "API Timeout: Server is waking up. Please refresh in 30 seconds."
            : "API unreachable. Ensure the Go server is live.";
            
        sendResponse({ error: errorMessage });
    }
}
    