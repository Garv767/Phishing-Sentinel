const API_BASE = "https://phishing-sentinel-api-service.onrender.com";
const DASHBOARD_URL = "https://phishing-sentinel.netlify.app";

async function updatePopupStats() {
  const tokenObj = await chrome.storage.local.get(['sentinel_token']);
  const token = tokenObj.sentinel_token;

  const statusEl = document.getElementById('conn-status');
  const scannedEl = document.getElementById('scanned-count');
  const trustEl = document.getElementById('trust-score');

  try {
    const response = await fetch(`${API_BASE}/api/stats`, {
        headers: {  
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error();

    const data = await response.json();
    
    scannedEl.textContent = data.scanned.toLocaleString();
    trustEl.textContent = `${data.trustScore.toFixed(0)}%`;
    statusEl.textContent = "ONLINE";
    statusEl.style.background = "#052e16";
    statusEl.style.color = "#4ade80";
    statusEl.style.borderColor = "#15803d";
  } catch (err) {
    statusEl.innerHTML = `<a href="https://github.com/Garv767/Phishing-Sentinel/blob/main/ERRORS.md#ERR_NET_001" target="_blank" style="color: inherit; text-decoration: none;" title="View Diagnostic Data">[ERR_NET_001] OFFLINE</a>`;
    statusEl.style.background = "#450a0a";
    statusEl.style.color = "#f87171";
    statusEl.style.borderColor = "#991b1b";
  }
}

document.getElementById('launch-dashboard').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: DASHBOARD_URL });
});

// Initial fetch and refresh every 5 seconds while popup is open
updatePopupStats();
setInterval(updatePopupStats, 5000);
