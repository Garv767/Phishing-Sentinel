/**
 * Sentinel Security SDK
 * Client-side telemetry tracking for behavioral analysis.
 */
class SentinelSDK {
  constructor(config = {}) {
    this.endpoint = config.endpoint || 'http://localhost:3001/evaluate';
    this.apiKey = config.apiKey || null;
    this.userId = config.userId || 'anonymous';
    this.sessionId = config.sessionId || this._generateSessionId();
    
    // Telemetry storage
    this.keystrokes = 0;
    this.typingStartTime = null;
    this.mouseDistance = 0;
    this.lastMousePos = null;
    this.pageLoadTime = Date.now();
    this.mouseMovements = [];
    this.typingSpeeds = [];
    
    this._initListeners();
  }

  /**
   * Set the active user ID.
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Set the active session ID.
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  /**
   * Compile and get the current behavioral telemetry object.
   */
  getTelemetry() {
    const timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000);
    
    // Average typing speed calculation (chars per minute)
    let avgTypingSpeed = 0;
    if (this.keystrokes > 1 && this.typingStartTime) {
      const activeTypingTimeMins = (Date.now() - this.typingStartTime) / 60000;
      if (activeTypingTimeMins > 0) {
        avgTypingSpeed = Math.round(this.keystrokes / activeTypingTimeMins);
      }
    }
    
    // Average mouse velocity (pixels per second)
    let avgMouseVelocity = 0;
    if (timeOnPage > 0) {
      avgMouseVelocity = Math.round(this.mouseDistance / timeOnPage);
    }

    return {
      user_id: this.userId,
      session_id: this.sessionId,
      action: {
        type: 'page_view'
      },
      network: {
        user_agent: navigator.userAgent
      },
      behavioral: {
        typing_speed: avgTypingSpeed,
        mouse_velocity: avgMouseVelocity,
        time_on_page: timeOnPage
      }
    };
  }

  /**
   * Send the current telemetry to the Sentinel evaluation endpoint.
   */
  async evaluate(actionType = 'page_view') {
    const telemetry = this.getTelemetry();
    telemetry.action.type = actionType;
    telemetry.timestamp = new Date().toISOString();

    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['X-Sentinel-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(telemetry)
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('[SentinelSDK] Evaluation request failed:', err.message);
      // Return a clearly distinguishable error — NOT a fake "allow" response.
      // Callers should check result._error before trusting the risk assessment.
      return {
        _error: true,
        error: err.message,
        risk_score: null,
        risk_level: null,
        action: 'error',
      };
    }
  }

  // ── Private Helpers ──────────────────────────────────────────

  _generateSessionId() {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  _initListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Track mouse movements
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      const currentPos = { x: e.clientX, y: e.clientY };
      
      if (this.lastMousePos) {
        const dx = currentPos.x - this.lastMousePos.x;
        const dy = currentPos.y - this.lastMousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.mouseDistance += dist;
      }
      
      this.lastMousePos = currentPos;
    });

    // Track keyboard activities
    document.addEventListener('keydown', () => {
      if (!this.typingStartTime) {
        this.typingStartTime = Date.now();
      }
      this.keystrokes += 1;
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SentinelSDK;
} else if (typeof window !== 'undefined') {
  window.SentinelSDK = SentinelSDK;
}

export default SentinelSDK;
