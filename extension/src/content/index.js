/**
 * Sentinel Suite: Content Script (Sensor)
 * Responsibility: DOM Scraping and UI Interception.
 * Delegating network requests to Background Worker to bypass PNA/CORS restrictions.
 */

async function performSecurityScan() {
    console.log("[Sentinel] Initiating DOM Security Scan...");

    // 1. Extract Structural Metadata (DNA)
    const domData = {
        url: window.location.href,
        dom_content: document.documentElement.innerHTML,
        metadata: {
            title: document.title,
            scripts: document.getElementsByTagName('script').length,
            iframes: document.getElementsByTagName('iframe').length,
            forms: document.getElementsByTagName('form').length,
            inputs: document.getElementsByTagName('input').length,
            timestamp: new Date().toISOString()
        }
    };

    // 2. Send Message to Background Script
    // Background scripts have elevated privileges and can fetch from localhost without prompts.
    chrome.runtime.sendMessage({ type: "PERFORM_SCAN", data: domData }, (result) => {
        if (chrome.runtime.lastError) {
            console.error("[Sentinel] Messaging error:", chrome.runtime.lastError);
            return;
        }

        if (result && result.error) {
            console.warn("[Sentinel] Scan could not be completed:", result.error);
            return;
        }

        // 3. Handle Threat Detection
        if (result && result.is_spoof && result.confidence_score > 0.7) {
            showAlertOverlay(result);
        }
    });
}

function showAlertOverlay(data) {
    // Prevent duplicate overlays
    if (document.getElementById("sentinel-threat-overlay")) return;

    const overlay = document.createElement('div');
    overlay.id = "sentinel-threat-overlay";
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(2, 6, 23, 0.98); z-index: 2147483647;
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; color: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="text-align: center; max-width: 600px; padding: 40px; border: 2px solid #ef4444; border-radius: 12px; background: #0f172a; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
            <div style="margin-bottom: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h1 style="color: #ef4444; margin: 0 0 10px 0; font-size: 28px;">PHISHING ALERT DETECTED</h1>
            <p style="font-size: 18px; color: #94a3b8; margin-bottom: 25px;">Sentinel AI has detected high-probability visual spoofing on this page.</p>
            
            <div style="text-align: left; background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #334155;">
                <p style="margin: 0 0 8px 0;"><strong style="color: #fff;">Threat Level:</strong> <span style="color: #ef4444;">${data.threat_level.toUpperCase()}</span></p>
                <p style="margin: 0 0 8px 0;"><strong style="color: #fff;">Confidence:</strong> ${(data.confidence_score).toFixed(2)}%</p>
                <p style="margin: 0;"><strong style="color: #fff;">Anomalies:</strong> ${data.detected_anomalies?.join(', ') || 'Structural DNA Mismatch'}</p>
            </div>
            
            <button id="close-sentinel" style="background: #ef4444; color: white; border: none; padding: 14px 32px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; transition: background 0.2s;">
                I Understand the Risk (Proceed)
            </button>
        </div>
    `;

    document.body.appendChild(overlay);
    
    document.getElementById('close-sentinel').addEventListener('click', () => {
        overlay.style.transition = 'opacity 0.2s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    });
}

// Run scan when page is idle to ensure DOM is fully available
if (document.readyState === 'complete') {
    performSecurityScan();
} else {
    window.addEventListener('load', performSecurityScan);
}