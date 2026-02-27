const API_ENDPOINT = 'http://phishing-sentinel.onrender.com/api/analyze';

// 1. Listen for Token Sync from Dashboard (External)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.type === "SYNC_TOKEN") {
        chrome.storage.local.set({ sentinel_token: request.token }, () => {
            console.log("[Sentinel] Token synced from Dashboard");
            sendResponse({ success: true });
        });
        return true; 
    }
});

// 2. Listen for Scan Requests from Content Scripts (Internal)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PERFORM_SCAN") {
        chrome.storage.local.get(['sentinel_token'], (result) => {
            const token = result.sentinel_token;

            if (!token) {
                console.warn("[Sentinel] No JWT token found. Analysis skipped.");
                sendResponse({ error: "Unauthorized: Please log in to the Sentinel Hub." });
                return;
            }

            fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(message.data)
            })
            .then(response => {
                if (!response.ok) throw new Error("Auth failed or Server error");
                return response.json();
            })
            .then(data => sendResponse(data))
            .catch(error => {
                console.error("[Sentinel Background] Fetch Error:", error);
                sendResponse({ error: "API unreachable. Ensure Go server is running." });
            });
        });

        return true;
    }
});
