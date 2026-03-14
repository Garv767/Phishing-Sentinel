# 🛡️ Phishing Sentinel

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-phishing--sentinel.netlify.app-38bdf8?style=for-the-badge&logo=netlify&logoColor=white)](https://phishing-sentinel.netlify.app/)
[![ML Service](https://img.shields.io/badge/ML%20Service-Render-22c55e?style=for-the-badge&logo=render&logoColor=white)](https://phishing-sentinel-ml-service.onrender.com)
[![Go API](https://img.shields.io/badge/Go%20API-Deploy%20Pending-f59e0b?style=for-the-badge&logo=go&logoColor=white)](#)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Web%20Store%20Pending-ef4444?style=for-the-badge&logo=googlechrome&logoColor=white)](#)

</div>

> Real-time, intent-based zero-day phishing detection powered by a hybrid ML ensemble and a distributed microservices architecture.

Phishing Sentinel protects users from sophisticated phishing attacks by analyzing the **structural DNA** of a webpage (DOM) and its **lexical identity** (URL) simultaneously — catching malicious pages before they're ever reported to a blocklist.

---

## ✨ Features

- **Hybrid Detection Engine** — Two specialized models analyze both URL lexical patterns (41 features) and DOM structural intent in parallel, delivering a fused confidence score.
- **Zero-Day Readiness** — Detects malicious intent from page structure and URL entropy alone, even for freshly registered domains with no prior threat history.
- **Tiered Threat Levels** — Rather than binary block/allow decisions, the system returns a probabilistic confidence score mapped to Green / Yellow / Red alert tiers.
- **Real-Time Observation Log** — A live React dashboard polls the Go backend to surface active threats, scan history, and per-user security statistics.
- **Context-Isolated Sessions** — JWT-authenticated API ensures every user sees only their own scan history and statistics.
- **Cross-Context Token Sync** — The dashboard pushes auth tokens to the Chrome Extension via `externally_connectable`, enabling seamless single-login across both surfaces.
- **Edge-First Privacy** — DOM extraction happens locally in the browser extension before being forwarded; raw page content never persists beyond the analysis request.
- **Interactive Demo** — Unauthenticated visitors can simulate a full phishing interception and view mock analytics without creating an account.

---

## 🏗️ Architecture

Phishing Sentinel is structured as a monorepo of four decoupled layers:

```
phishing-sentinel/
├── api/                    # Go/Gin API Gateway
│   ├── cmd/
│   │   ├── main.go         # Server entry point, routing, middleware
│   │   └── types.go        # Request/response structs & ML service client
│   └── internal/
│       ├── db.go           # GORM + Supabase PostgreSQL initialization
│       └── model.go        # User and ScanLog data models
├── dashboard/              # React/Vite Web Dashboard
│   └── src/
│       ├── components/
│       │   └── Demo/       # Interactive demo (no login required)
│       ├── pages/
│       │   ├── Dashboard/  # Threat log & statistics view
│       │   └── Login/      # Auth + token sync to extension
├── extension/              # Manifest V3 Chrome Extension
│   └── src/
│       ├── background/     # Service worker (PNA/CORS-safe request handling)
│       ├── content/        # DOM scraping & metadata extraction
│       └── popup/          # Extension UI
└── ml-service/             # Python/FastAPI Inference Engine
    ├── src/
    │   ├── main.py         # FastAPI server & /analyze endpoint
    │   ├── preprocess.py   # 16-feature extraction pipeline
    │   └── train.py        # Model training script
    ├── models/             # Serialized .pkl model & scaler artifacts
    └── datasets/           # Training data sources
```

### Request Flow

```
Browser Tab
    │
    ▼
Chrome Extension (Content Script)
  → Extracts URL + DOM metadata locally
    │
    ▼
Go API Gateway :8080  (/api/analyze)
  → Validates JWT
  → Forwards payload to ML service
  → Persists result to Supabase
  → Returns verdict to extension
    │
    ▼
Python FastAPI ML Service :8000  (/analyze)
  → Runs preprocess.py (feature extraction)
  → Inference via Balanced Random Forest
  → Returns { verdict, phishing_probability, analyzed_features }
    │
    ▼
React Dashboard
  → Polls /api/logs & /api/stats
  → Renders live threat feed and trust score
```

---

## 🧠 ML Pipeline

### Model

A **Balanced Random Forest Classifier** (`n_estimators=100`, `class_weight='balanced'`) trained on a labeled dataset of 79,760 websites.

```
Accuracy : 94.58%
Precision: 0.94 (phishing) / 0.95 (legitimate)
Recall   : 0.92 (phishing) / 0.96 (legitimate)
F1-Score : 0.93 (phishing) / 0.96 (legitimate)
```

`class_weight='balanced'` ensures the minority phishing class receives proportionally higher loss weighting, reducing false negatives — the more dangerous failure mode for a security tool.

### Feature Set (16 Features via `preprocess.py`)

**Lexical / URL Features**
| Feature | Description |
|---|---|
| `url_entropy` | Shannon entropy of the URL string |
| `has_ip_address` | Flags raw IP addresses used in place of a hostname |
| `subdomain_count` | Number of subdomain levels |
| `url_length` | Total character length of the URL |
| `param_count` | Number of query string parameters |
| `sensitive_keywords` | Presence of terms like `login`, `verify`, `secure`, `account` |

**Structural / DOM Intent Features**
| Feature | Description |
|---|---|
| `external_link_ratio` | Ratio of links pointing outside the page's own domain |
| `empty_links_ratio` | Ratio of `href="#"` or `javascript:void(0)` anchors |
| `suspicious_form_action` | Form `action` attribute submitting to a third-party host |
| `hidden_iframe_count` | Number of zero-dimension or hidden iframe elements |
| `script_to_content_ratio` | Ratio of `<script>` tags to visible content nodes |
| `password_field_count` | Number of `<input type="password">` fields |
| `input_field_count` | Total number of form input fields |
| `meta_refresh_present` | Presence of automatic page redirect via `<meta http-equiv="refresh">` |
| `external_resource_ratio` | Ratio of externally hosted CSS/JS/image resources |
| `dom_nesting_depth` | Maximum depth of the DOM tree |

---

## 🎬 Interactive Demo

The dashboard includes a no-login demo mode accessible directly from the Login page. It walks visitors through a complete phishing interception simulation.

**Demo flow:**
1. Visitor clicks **"Try the Demo"** on the Login page.
2. A simulated browser viewport renders a fake phishing page (spoofed PayPal login).
3. After a 2-second scan animation, the **Sentinel blocking overlay** appears — identical to what the Chrome Extension renders in a real browser.
4. Dismissing the overlay reveals a mock analytics dashboard populated with realistic scan history and threat statistics.
5. A CTA at the bottom prompts the visitor to create an account.

**Mounting the demo in `Login.jsx`:**

```jsx
import { useState } from "react";
import Demo from "../../components/Demo/Demo";

export default function Login() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      {showDemo && <Demo onClose={() => setShowDemo(false)} />}

      {/* your existing login form ... */}

      <button onClick={() => setShowDemo(true)}>
        Try the Demo — no account needed
      </button>
    </>
  );
}
```

The `Demo` component is self-contained and manages its own state. It renders as a fixed full-screen modal and accepts a single `onClose` prop.

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Create a new user account |
| `POST` | `/login` | No | Authenticate and receive a JWT |
| `GET` | `/health` | No | Service health check |
| `POST` | `/api/analyze` | JWT | Submit URL + DOM for ML analysis |
| `GET` | `/api/stats` | JWT | Fetch per-user scan statistics |
| `GET` | `/api/logs` | JWT | Fetch paginated scan history (newest first) |

### Example: `POST /api/analyze`

**Request**
```json
{
  "url": "https://secure-login.paypa1.com/verify",
  "dom_content": "<html>...</html>",
  "metadata": {}
}
```

**Response**
```json
{
  "is_spoof": true,
  "confidence_score": 0.94,
  "threat_level": "Phishing",
  "detected_anomalies": []
}
```

---

## 🚀 Local Setup

### Prerequisites

| Tool | Version |
|---|---|
| Go | 1.21+ |
| Python | 3.10+ |
| Node.js | 18+ |
| Supabase project | (for PostgreSQL) |

---

### 1. ML Service

```bash
cd ml-service
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
# Listening on http://localhost:8000
```

---

### 2. API Gateway

Create `api/.env`:
```env
DATABASE_URI="host=<supabase-host> user=postgres.<project-id> password=<password> dbname=postgres port=5432 sslmode=require"
JWT_SECRET="your-secure-secret"
```

```bash
cd api
go mod tidy
go run cmd/main.go
# Listening on http://localhost:8080
```

---

### 3. Dashboard

Create `dashboard/.env`:
```env
VITE_API_URL="http://localhost:8080"
```

```bash
cd dashboard
npm install
npm run dev
```

---

### 4. Chrome Extension

1. Navigate to `chrome://extensions/` in Chrome.
2. Enable **Developer Mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` directory.
4. Copy the generated **Extension ID** and paste it into `Login.jsx` to enable cross-context token sync.

---

### Retraining the Model

Place your dataset CSV in `ml-service/datasets/`, then:

```bash
cd ml-service
python src/train.py
```

Output artifacts saved to `ml-service/models/`:
- `phishing_sentinel_model_v2.pkl` — Serialized classifier
- `scaler.pkl` — Feature scaler

---

## 🔒 Security Notes

- Passwords are currently stored as plain text in this build. **Hash with `bcrypt` before any production deployment.**
- The CORS policy is set to `*` for local development. Restrict `Access-Control-Allow-Origin` to specific origins in production.
- The ML service is not directly exposed; all external traffic routes through the authenticated Go gateway.
- JWT tokens expire after 24 hours and are validated on every protected route.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| API Gateway | Go, Gin, GORM, golang-jwt |
| Database | Supabase (PostgreSQL) |
| ML Service | Python, FastAPI, scikit-learn, pandas |
| Dashboard | React, Vite, Tailwind CSS |
| Extension | Vanilla JS, Manifest V3 |

---

## 📜 License

MIT License. See `LICENSE` for details.