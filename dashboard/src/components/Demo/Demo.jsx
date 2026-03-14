/**
 * Sentinel Suite — Interactive Demo Component
 * Simulates a phishing page interception and renders mock scan analytics.
 * Mounted from Login.jsx as an unauthenticated preview.
 */

import { useState, useEffect, useRef } from "react";

// ─── Mock Data (matches public.scan_logs schema) ─────────────────────────────
const MOCK_USER = { id: 999, email: "demo@sentinel.io" };

const MOCK_SCAN_LOGS = [
  {
    id: 12,
    user_id: 999,
    url: "https://secure-login.paypa1.com/verify-account",
    is_spoof: true,
    confidence_score: 0.94,
    threat_level: "Phishing",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: 11,
    user_id: 999,
    url: "https://amazon-prize-claim.net/winner?ref=email",
    is_spoof: true,
    confidence_score: 0.89,
    threat_level: "Phishing",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 10,
    user_id: 999,
    url: "https://github.com/torvalds/linux",
    is_spoof: false,
    confidence_score: 0.04,
    threat_level: "Safe",
    timestamp: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
  },
  {
    id: 9,
    user_id: 999,
    url: "https://netfIix-billing-update.com/account/payment",
    is_spoof: true,
    confidence_score: 0.97,
    threat_level: "Phishing",
    timestamp: new Date(Date.now() - 1000 * 60 * 61).toISOString(),
  },
  {
    id: 8,
    user_id: 999,
    url: "https://stackoverflow.com/questions/tagged/react",
    is_spoof: false,
    confidence_score: 0.02,
    threat_level: "Safe",
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: 7,
    user_id: 999,
    url: "https://secure.bankofamerica-verify.info/login",
    is_spoof: true,
    confidence_score: 0.91,
    threat_level: "Phishing",
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  {
    id: 6,
    user_id: 999,
    url: "https://discord.com/channels/@me",
    is_spoof: false,
    confidence_score: 0.06,
    threat_level: "Safe",
    timestamp: new Date(Date.now() - 1000 * 60 * 172).toISOString(),
  },
  {
    id: 5,
    user_id: 999,
    url: "https://apple-id-suspended.pw/restore",
    is_spoof: true,
    confidence_score: 0.96,
    threat_level: "Phishing",
    timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
];

const MOCK_STATS = {
  scanned: MOCK_SCAN_LOGS.length,
  threatsBlocked: MOCK_SCAN_LOGS.filter((l) => l.is_spoof).length,
  trustScore: parseFloat(
    (
      100 -
      (MOCK_SCAN_LOGS.filter((l) => l.is_spoof).length /
        MOCK_SCAN_LOGS.length) *
        100
    ).toFixed(1)
  ),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function shortenUrl(url, max = 48) {
  try {
    const { hostname, pathname } = new URL(url);
    const combined = hostname + pathname;
    return combined.length > max ? combined.slice(0, max) + "…" : combined;
  } catch {
    return url.slice(0, max);
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Mimics the Chrome Extension's blocking overlay */
function SentinelOverlay({ data, onDismiss }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(2, 6, 23, 0.97)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "sentinelFadeIn 0.35s ease",
        borderRadius: "0 0 10px 10px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 420,
          padding: "32px 28px",
          border: "2px solid #ef4444",
          borderRadius: 12,
          background: "#0f172a",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
          color: "#fff",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Icon */}
        <div style={{ marginBottom: 16 }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>

        <h1
          style={{
            color: "#ef4444",
            margin: "0 0 8px",
            fontSize: 20,
            letterSpacing: "0.04em",
            fontWeight: 700,
          }}
        >
          PHISHING ALERT DETECTED
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#94a3b8",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          Sentinel AI has detected high-probability visual spoofing on this
          page.
        </p>

        {/* Threat Details */}
        <div
          style={{
            textAlign: "left",
            background: "#1e293b",
            padding: "14px 16px",
            borderRadius: 8,
            marginBottom: 22,
            border: "1px solid #334155",
            fontSize: 13,
            lineHeight: 2,
          }}
        >
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>Threat Level: </strong>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>
              {data.threat_level.toUpperCase()}
            </span>
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>Confidence: </strong>
            <span style={{ color: "#fbbf24" }}>
              {(data.confidence_score * 100).toFixed(0)}%
            </span>
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>Anomalies: </strong>
            <span style={{ color: "#94a3b8" }}>
              Structural DNA Mismatch, Suspicious Form Action
            </span>
          </p>
        </div>

        <button
          onClick={onDismiss}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "11px 26px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.02em",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#dc2626")}
          onMouseLeave={(e) => (e.target.style.background = "#ef4444")}
        >
          I Understand the Risk (Proceed)
        </button>
      </div>
    </div>
  );
}

/** Fake phishing page rendered inside the simulated browser frame */
function FakePhishingPage() {
  return (
    <div
      style={{
        background: "#f3f4f6",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Fake PayPal-style header */}
      <div
        style={{
          background: "#003087",
          width: "100%",
          maxWidth: 400,
          padding: "12px 20px",
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
          <path d="M20 12V22H4V12" />
          <path d="M22 7H2v5h20V7z" />
          <path d="M12 22V7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
          PayPa1 — Secure Verify Portal
        </span>
      </div>

      {/* Fake login form */}
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 400,
          padding: "24px 20px",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <p
          style={{
            color: "#111",
            fontWeight: 700,
            fontSize: 16,
            marginBottom: 4,
            marginTop: 0,
          }}
        >
          Verify your account
        </p>
        <p
          style={{
            color: "#6b7280",
            fontSize: 12,
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          Your account has been temporarily limited. Please verify to restore
          access.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{ fontSize: 12, color: "#374151", display: "block", marginBottom: 4 }}
          >
            Email or mobile number
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              boxSizing: "border-box",
              outline: "none",
            }}
            readOnly
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ fontSize: 12, color: "#374151", display: "block", marginBottom: 4 }}
          >
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              boxSizing: "border-box",
            }}
            readOnly
          />
        </div>
        <button
          style={{
            width: "100%",
            background: "#003087",
            color: "#fff",
            border: "none",
            padding: "10px",
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 14,
            cursor: "default",
          }}
        >
          Log In
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 12 }}>
          © 2026 PayPa1, Inc. All rights reserved.{" "}
          <span style={{ color: "#6b7280" }}>Privacy</span> ·{" "}
          <span style={{ color: "#6b7280" }}>Legal</span>
        </p>
      </div>
    </div>
  );
}

/** Simulated browser chrome (URL bar + viewport) */
function BrowserMockup({ url, children, scanPhase }) {
  const indicatorColor =
    scanPhase === "idle"
      ? "#6b7280"
      : scanPhase === "scanning"
      ? "#f59e0b"
      : "#ef4444";

  const indicatorLabel =
    scanPhase === "idle"
      ? "Sentinel Active"
      : scanPhase === "scanning"
      ? "Scanning…"
      : "⚠ Threat Detected";

  return (
    <div
      style={{
        border: "1px solid #334155",
        borderRadius: 10,
        overflow: "hidden",
        background: "#0f172a",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: "#1e293b",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid #334155",
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 5 }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <div
              key={c}
              style={{ width: 10, height: 10, borderRadius: "50%", background: c }}
            />
          ))}
        </div>

        {/* URL bar */}
        <div
          style={{
            flex: 1,
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 6,
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke={scanPhase === "threat" ? "#ef4444" : "#6b7280"}
            strokeWidth="2"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
            {url}
          </span>
        </div>

        {/* Sentinel status pill */}
        <div
          style={{
            background: "#0f172a",
            border: `1px solid ${indicatorColor}`,
            borderRadius: 20,
            padding: "3px 8px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "border-color 0.3s",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: indicatorColor,
              boxShadow:
                scanPhase === "scanning"
                  ? "0 0 6px #f59e0b"
                  : scanPhase === "threat"
                  ? "0 0 6px #ef4444"
                  : "none",
              animation: scanPhase === "scanning" ? "pulse 1s infinite" : "none",
            }}
          />
          <span style={{ fontSize: 10, color: indicatorColor, fontWeight: 600 }}>
            {indicatorLabel}
          </span>
        </div>
      </div>

      {/* Viewport */}
      <div style={{ position: "relative", height: 340 }}>{children}</div>
    </div>
  );
}

/** Stat card for the analytics panel */
function StatCard({ label, value, color = "#38bdf8", sub }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 10,
        padding: "14px 18px",
        flex: 1,
      }}
    >
      <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569" }}>{sub}</p>
      )}
    </div>
  );
}

// ─── Main Demo Component ──────────────────────────────────────────────────────
export default function Demo({ onClose }) {
  // "intro" → "scanning" → "threat" → "dismissed" → "dashboard"
  const [phase, setPhase] = useState("intro");
  const timerRef = useRef(null);

  const PHISHING_LOG = MOCK_SCAN_LOGS[0];

  function startDemo() {
    setPhase("scanning");
    timerRef.current = setTimeout(() => setPhase("threat"), 2200);
  }

  function dismissOverlay() {
    setPhase("dashboard");
  }

  function resetDemo() {
    clearTimeout(timerRef.current);
    setPhase("intro");
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const trustColor =
    MOCK_STATS.trustScore >= 70
      ? "#22c55e"
      : MOCK_STATS.trustScore >= 40
      ? "#f59e0b"
      : "#ef4444";

  return (
    <>
      {/* Keyframe injector */}
      <style>{`
        @keyframes sentinelFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Modal backdrop */}
      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2, 6, 23, 0.85)",
          backdropFilter: "blur(6px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        {/* Modal card */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 16,
            width: "100%",
            maxWidth: 860,
            maxHeight: "92vh",
            overflowY: "auto",
            color: "#e2e8f0",
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            animation: "slideUp 0.3s ease",
          }}
        >
          {/* Modal header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #1e293b",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>
                Phishing Sentinel — Interactive Demo
              </span>
              <span
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 20,
                  padding: "2px 10px",
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                Demo Mode · No login required
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 20,
                lineHeight: 1,
                padding: 4,
              }}
              aria-label="Close demo"
            >
              ×
            </button>
          </div>

          {/* Modal body */}
          <div style={{ padding: 24 }}>
            {/* ── INTRO ── */}
            {phase === "intro" && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    background: "#0f172a",
                    border: "2px solid #38bdf8",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    boxShadow: "0 0 32px rgba(56,189,248,0.15)",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h2
                  style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700 }}
                >
                  See Sentinel in Action
                </h2>
                <p
                  style={{
                    color: "#94a3b8",
                    maxWidth: 440,
                    margin: "0 auto 32px",
                    lineHeight: 1.7,
                    fontSize: 14,
                  }}
                >
                  This demo simulates what happens when you navigate to a
                  phishing page with the Sentinel extension installed. The
                  extension scans the URL and DOM, then intercepts the page
                  before you can interact with it.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginBottom: 32,
                  }}
                >
                  {[
                    { icon: "🔍", label: "DOM Analysis" },
                    { icon: "🧬", label: "Structural DNA" },
                    { icon: "🚨", label: "Real-time Block" },
                    { icon: "📊", label: "Scan Analytics" },
                  ].map((f) => (
                    <div
                      key={f.label}
                      style={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        padding: "8px 14px",
                        fontSize: 12,
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>{f.icon}</span>
                      {f.label}
                    </div>
                  ))}
                </div>
                <button
                  onClick={startDemo}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    padding: "13px 32px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    letterSpacing: "0.03em",
                    boxShadow: "0 4px 20px rgba(239,68,68,0.3)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 6px 24px rgba(239,68,68,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 20px rgba(239,68,68,0.3)";
                  }}
                >
                  Simulate Phishing Page Visit
                </button>
              </div>
            )}

            {/* ── SCANNING / THREAT ── */}
            {(phase === "scanning" || phase === "threat") && (
              <div>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    marginBottom: 12,
                    letterSpacing: "0.05em",
                  }}
                >
                  SIMULATED BROWSER ENVIRONMENT
                </p>
                <BrowserMockup
                  url="secure-login.paypa1.com/verify-account"
                  scanPhase={phase}
                >
                  <FakePhishingPage />
                  {phase === "threat" && (
                    <SentinelOverlay
                      data={PHISHING_LOG}
                      onDismiss={dismissOverlay}
                    />
                  )}
                </BrowserMockup>

                {phase === "scanning" && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px 16px",
                      background: "#1e293b",
                      borderRadius: 8,
                      border: "1px solid #f59e0b44",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: "#f59e0b",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      style={{ animation: "pulse 1s infinite" }}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    Sentinel is extracting DOM metadata and running ML
                    inference on 16 structural features…
                  </div>
                )}

                {phase === "threat" && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px 16px",
                      background: "#1e293b",
                      borderRadius: 8,
                      border: "1px solid #ef444444",
                      fontSize: 13,
                      color: "#94a3b8",
                    }}
                  >
                    The overlay above is{" "}
                    <strong style={{ color: "#fff" }}>
                      exactly what your browser renders
                    </strong>{" "}
                    when the extension detects a high-confidence threat. Click
                    the button inside it to proceed to the analytics dashboard.
                  </div>
                )}
              </div>
            )}

            {/* ── DASHBOARD ── */}
            {phase === "dashboard" && (
              <div style={{ animation: "slideUp 0.4s ease" }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}
                    >
                      Sentinel Hub
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                      Operative: {MOCK_USER.email} &nbsp;·&nbsp; Demo Session
                    </p>
                  </div>
                  <button
                    onClick={resetDemo}
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#94a3b8",
                      padding: "7px 14px",
                      borderRadius: 7,
                      cursor: "pointer",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ↩ Replay Demo
                  </button>
                </div>

                {/* Stat cards */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <StatCard
                    label="TOTAL SCANNED"
                    value={MOCK_STATS.scanned}
                    color="#38bdf8"
                    sub="URLs analyzed this session"
                  />
                  <StatCard
                    label="THREATS BLOCKED"
                    value={MOCK_STATS.threatsBlocked}
                    color="#ef4444"
                    sub="High-confidence intercepts"
                  />
                  <StatCard
                    label="TRUST SCORE"
                    value={`${MOCK_STATS.trustScore}%`}
                    color={trustColor}
                    sub="% of scans deemed safe"
                  />
                </div>

                {/* Scan log table */}
                <div
                  style={{
                    background: "#0a0f1e",
                    border: "1px solid #1e293b",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #1e293b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      Observation Log
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#22c55e",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#22c55e",
                          display: "inline-block",
                          animation: "pulse 2s infinite",
                        }}
                      />
                      Live
                    </span>
                  </div>

                  {/* Table header */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px 90px 70px",
                      padding: "8px 16px",
                      borderBottom: "1px solid #1e293b",
                      fontSize: 11,
                      color: "#475569",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <span>URL</span>
                    <span>VERDICT</span>
                    <span>CONFIDENCE</span>
                    <span>TIME</span>
                  </div>

                  {/* Rows */}
                  {MOCK_SCAN_LOGS.map((log, i) => (
                    <div
                      key={log.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 90px 90px 70px",
                        padding: "10px 16px",
                        borderBottom:
                          i < MOCK_SCAN_LOGS.length - 1
                            ? "1px solid #0f172a"
                            : "none",
                        alignItems: "center",
                        background: log.is_spoof
                          ? "rgba(239,68,68,0.04)"
                          : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#1e293b")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = log.is_spoof
                          ? "rgba(239,68,68,0.04)"
                          : "transparent")
                      }
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          fontFamily: "monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {shortenUrl(log.url)}
                      </span>
                      <span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: log.is_spoof
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(34,197,94,0.12)",
                            color: log.is_spoof ? "#ef4444" : "#22c55e",
                            border: `1px solid ${log.is_spoof ? "#ef444444" : "#22c55e44"}`,
                          }}
                        >
                          {log.is_spoof ? "Phishing" : "Safe"}
                        </span>
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: log.is_spoof ? "#fbbf24" : "#64748b",
                          fontFamily: "monospace",
                        }}
                      >
                        {(log.confidence_score * 100).toFixed(0)}%
                      </span>
                      <span style={{ fontSize: 11, color: "#475569" }}>
                        {timeAgo(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div
                  style={{
                    marginTop: 20,
                    padding: "16px 20px",
                    background: "#0a0f1e",
                    border: "1px solid #1e293b",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 3px",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Want your own threat dashboard?
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                      Create a free account to start monitoring your browsing
                      in real-time.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      background: "#38bdf8",
                      color: "#0f172a",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: 7,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Create Account →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}