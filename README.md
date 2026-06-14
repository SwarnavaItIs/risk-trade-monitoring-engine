# Risk Trade Monitoring Engine

A full-stack trade surveillance and pre-trade risk control platform that monitors trading activity, blocks risky trades before execution, generates explainable alerts, and provides admin-configurable risk rules with auditability and analyst workflows.

This project is designed like a simplified financial risk monitoring system inspired by real-world market access controls, trade surveillance systems, and compliance workflows.

---
# Deployed Links

Frontend https://risk-trade-monitoring-engine.vercel.app/

Backend https://risk-trade-monitoring-engine.onrender.com

---
## Project Overview

The Risk Trade Monitoring Engine allows users to submit trades manually or through CSV upload. Every trade passes through a multi-layer risk engine:

1. **Pre-trade risk controls** decide whether a trade should be blocked before saving.
2. **Behavioral surveillance rules** detect suspicious trading patterns after accepted trades.
3. **Risk events and audit logs** track blocked trades, triggered rules, alert actions, and admin changes.
4. **Admin dashboards** allow risk rule configuration, member management, and audit review.
5. **Analyst workflows** allow alert investigation, assignment, comments, and status updates.

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* Recharts

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Google OAuth
* Multer
* CSV Parser

### Risk / Performance Layer

* Redis for rolling-window risk checks
* C++17 behavioral risk engine
* JavaScript fallback risk engine

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas
* Redis: Local Docker / Render Key Value / Redis provider

---

## Core Features

### Authentication and Authorization

* Email/password authentication
* Google OAuth login/register
* JWT-based protected routes
* ADMIN and ANALYST roles
* Secure admin registration using admin secret
* Profile page with Google profile photo or fallback initials
* Forgot password and reset password flow

### Trade Management

* Add trades manually
* Upload trades using CSV
* Drag-and-drop CSV upload UI
* Validate trade fields before saving
* Show accepted trades and blocked trade feedback
* Display failed CSV rows with failed rule details

### Dynamic Risk Rule Engine

Risk rules are stored in MongoDB and can be updated by admins without changing source code.

Rules are divided into three tiers:

| Tier       | Purpose                                      |
| ---------- | -------------------------------------------- |
| PRE_TRADE  | Blocks invalid or risky trades before saving |
| BEHAVIORAL | Generates alerts after accepted trades       |
| POST_TRADE | Supports background audit-style analytics    |

### Pre-Trade Hard Block Rules

| Rule | Description               |
| ---- | ------------------------- |
| R1   | Single Order Value Cap    |
| R2   | Price Collar Check        |
| R3   | Daily Notional Limit      |
| R4   | Duplicate Order Detection |
| R5   | Single Order Quantity Cap |

These rules can block trades before database insertion.

### Behavioral Surveillance Rules

| Rule | Description                             |
| ---- | --------------------------------------- |
| R6   | High-Frequency Velocity                 |
| R7   | Wash Trade Detection                    |
| R8   | Momentum Ignition                       |
| R9   | Order-to-Trade Ratio placeholder        |
| R10  | After-Hours / Restricted Symbol Trading |

These rules generate explainable alerts.

### Redis Risk Checks

Redis is used for real-time rolling-window checks:

* Duplicate order detection
* High-frequency trade velocity
* Momentum ignition detection

If Redis is unavailable, the backend falls back to MongoDB-based checks.

### C++ Risk Engine

A C++17 engine performs low-latency behavioral risk checks for:

* High-frequency velocity
* Wash trade detection
* Momentum ignition

The Node.js backend calls the C++ executable through child processes. If the C++ engine is unavailable, the system safely falls back to JavaScript/Redis logic.

### Alert Management

* View generated alerts
* Filter alerts by severity, status, trader, symbol, priority, and assignment
* Alert details page
* Assign alerts to analysts
* Add review comments
* Maintain comment history
* Update alert status
* Update alert priority
* View “My Alerts” assigned to the logged-in user

### Admin Features

* Admin-only risk rule management page
* Enable/disable risk rules
* Update thresholds and parameters
* Edit severity, risk weight, and action
* Reset/customize risk rules
* Admin member management
* Promote/demote users
* Remove users
* Audit log review

### Analytics Dashboard

The dashboard includes:

* Total trades
* Total alerts
* Total trade value
* Average risk score
* Blocked trades
* Total risk events
* Alerts by severity
* Alerts by type
* Risk trend over time
* Rule trigger frequency
* Top blocked rules
* Recent risk events
* Top risky traders
* Top traded stocks

### UI / UX Features

* Responsive floating navbar
* Mobile hamburger menu
* Dark mode toggle
* Persistent theme preference
* Loading states
* Skeleton loaders
* Smooth chart tooltips
* Transparent/glass tooltip styling
* Logout overlay with blurred background
* Scroll-to-top route behavior
* Clean admin and analyst workflows

---

## System Architecture

```txt
React Frontend
    |
    | Axios API Calls + JWT
    v
Express Backend
    |
    | Mongoose
    v
MongoDB Atlas

Trade Submission
    |
    v
Pre-Trade Risk Engine
    |
    |-- R1-R5 pass  --> Save Trade
    |
    |-- R1-R5 fail  --> Block Trade + Save RiskEvent

Saved Trade
    |
    v
Behavioral Risk Engine
    |
    |-- Redis rolling-window checks
    |-- C++ risk engine
    |-- JavaScript fallback
    |
    v
Alert Generation + RiskEvent Logging

Admin / Analyst UI
    |
    |-- Risk Rules
    |-- Alerts
    |-- Assignments
    |-- Audit Logs
    |-- Analytics
```

---

## Detailed Project Workflow

### 1. User Authentication Workflow

```txt
User opens app
    |
    v
Login/Register Page
    |
    |-- Email + Password
    |-- Google OAuth
    |
    v
Backend verifies credentials
    |
    v
Backend returns JWT + user profile
    |
    v
Frontend stores token and user in localStorage
    |
    v
Protected dashboard opens
```

The frontend sends the JWT token with every protected request:

```txt
Authorization: Bearer <token>
```

The backend middleware verifies the token and attaches the logged-in user to the request.

---

### 2. Role-Based Access Workflow

```txt
Logged-in user
    |
    v
Backend checks role
    |
    |-- ADMIN
    |     Can manage risk rules, members, assignments, audit logs
    |
    |-- ANALYST
          Can view alerts, review assigned alerts, add comments
```

Admin access is never decided by the frontend. The backend controls role assignment.

---

### 3. Manual Trade Creation Workflow

```txt
User submits trade form
    |
    v
Frontend sends POST /api/trades
    |
    v
Backend validates trade input
    |
    v
Pre-trade risk engine loads enabled PRE_TRADE rules from MongoDB
    |
    v
R1-R5 checks run
```

If a pre-trade rule fails:

```txt
Trade rejected
    |
    v
Trade is not saved
    |
    v
RiskEvent is stored
    |
    v
Frontend shows "Trade Blocked" card with failed rules
```

If all pre-trade rules pass:

```txt
Trade saved in MongoDB
    |
    v
Behavioral risk engine runs
    |
    v
Alert generated if R6-R10 rules trigger
    |
    v
RiskEvent stored for analytics
```

---

### 4. CSV Upload Workflow

```txt
User uploads CSV
    |
    v
Frontend sends multipart/form-data
    |
    v
Backend parses CSV rows
    |
    v
Each row is validated
    |
    v
Each row passes through pre-trade checks
```

For each row:

```txt
Valid + passes risk checks
    -> Save trade
    -> Run behavioral rules
    -> Generate alert if risky

Invalid row
    -> Add to failedRows

Blocked row
    -> Add to failedRows with failed risk rules
    -> Save RiskEvent
```

The frontend displays:

* Total rows
* Trades saved
* Alerts generated
* Blocked rows
* Failed rows with reasons

---

### 5. Pre-Trade Risk Workflow

Pre-trade rules run synchronously before trade insertion.

```txt
Incoming trade
    |
    v
Load enabled PRE_TRADE rules
    |
    v
R1: Single Order Value Cap
R2: Price Collar Check
R3: Daily Notional Limit
R4: Duplicate Order Detection
R5: Quantity Cap
    |
    v
If any rule fails -> block trade
```

Example blocked response:

```json
{
  "message": "Trade blocked by pre-trade risk controls",
  "blocked": true,
  "failedRules": [
    {
      "ruleCode": "R1_SINGLE_ORDER_VALUE_CAP",
      "ruleName": "Single Order Value Cap",
      "severity": "HIGH",
      "action": "BLOCK",
      "reason": "Trade value exceeds max single order value"
    }
  ]
}
```

---

### 6. Behavioral Risk Workflow

Behavioral rules run after a trade is accepted.

```txt
Accepted trade
    |
    v
Fetch recent trades
    |
    v
Try C++ risk engine
    |
    |-- If C++ works:
    |       Use C++ result for R6/R7/R8
    |
    |-- If C++ fails:
    |       Use Redis / JavaScript fallback
    |
    v
Run JS-only rules like R10
    |
    v
Calculate risk score and severity
    |
    v
Generate alert if risky
```

Alert severity is based on risk score:

| Risk Score | Severity |
| ---------- | -------- |
| 0-29       | LOW      |
| 30-69      | MEDIUM   |
| 70+        | HIGH     |

---

### 7. Redis Workflow

Redis handles fast rolling-window checks.

```txt
Trade accepted
    |
    v
Redis sorted set / TTL key updated
    |
    v
Window count calculated
    |
    v
If threshold exceeded -> trigger rule
```

Used for:

* R4 duplicate order detection
* R6 high-frequency velocity
* R8 momentum ignition

If Redis is unavailable:

```txt
Redis error
    |
    v
MongoDB fallback logic runs
```

---

### 8. C++ Risk Engine Workflow

```txt
Node.js behavioral engine
    |
    v
Builds input payload
    |
    v
Spawns C++ executable
    |
    v
C++ calculates R6/R7/R8
    |
    v
C++ returns JSON result
    |
    v
Node.js merges result with remaining JS rules
```

If C++ fails:

```txt
Executable missing / timeout / parse error
    |
    v
Backend continues with Redis/JS fallback
```

This keeps the app reliable while still supporting a high-performance engine.

---

### 9. Alert Assignment Workflow

```txt
Alert generated
    |
    v
Admin opens alert details
    |
    v
Admin assigns alert to analyst
    |
    v
Assigned analyst sees alert in My Alerts
    |
    v
Analyst adds comments and updates review status
    |
    v
Comment history and audit logs are saved
```

Alert workflow supports:

* Assigned analyst
* Priority
* Review deadline
* Comment history
* Status updates
* Audit logging

---

### 10. Risk Rule Management Workflow

```txt
Admin opens Risk Rules page
    |
    v
Frontend fetches rules from backend
    |
    v
Admin edits enabled/status/thresholds/weights/action
    |
    v
Backend updates RiskRules collection
    |
    v
Audit log records old and new values
    |
    v
New trades immediately use updated rules
```

This makes the risk engine dynamic and configurable.

---

### 11. Audit Log Workflow

```txt
Important action happens
    |
    v
Backend calls audit logger
    |
    v
AuditLog stores:
    - action
    - entity type
    - entity id
    - performed by
    - old value
    - new value
    - metadata
    - timestamp
```

Tracked actions include:

* Risk rule updates
* Alert assignment
* Alert comments
* Alert status updates
* Alert priority updates
* Admin/member actions

---

### 12. Dashboard Analytics Workflow

```txt
RiskEvent and Alert data
    |
    v
Dashboard APIs aggregate data
    |
    v
Frontend displays charts/cards/tables
```

Dashboard shows:

* Blocked trade count
* Rule trigger frequency
* Recent risk events
* Top blocked rules
* Alerts by severity/type
* Risk trend
* Top risky traders

---

## Environment Variables

Create a `.env` file inside `backend`.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

ADMIN_REGISTRATION_SECRET=your_admin_secret

GOOGLE_CLIENT_ID=your_google_client_id

FRONTEND_URL=http://localhost:5173

REDIS_URL=redis://localhost:6379

MARKET_DATA_PROVIDER=FINNHUB
FINNHUB_API_KEY=your_finnhub_api_key
```

Create a `.env` file inside `frontend`.

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Running Locally

### 1. Clone repository

```bash
git clone <your-repo-url>
cd risk-trade-monitoring-engine
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Start Redis locally

Using Docker:

```bash
docker run --name risk-redis -p 6379:6379 -d redis
```

If container already exists:

```bash
docker start risk-redis
```

### 5. Seed default risk rules

```bash
cd backend
npm run seed:risk-rules
```

### 6. Build C++ engine locally

On Windows:

```bash
npm run build:cpp:win
```

On Linux/macOS:

```bash
npm run build:cpp:linux
```

### 7. Start backend

```bash
npm run dev
```

### 8. Start frontend

```bash
cd ../frontend
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

Backend runs on:

```txt
http://localhost:5000
```

---

## Important Scripts

### Backend

```bash
npm run dev
npm start
npm run seed:risk-rules
npm run build:cpp:win
npm run build:cpp:linux
```

### Frontend

```bash
npm run dev
npm run build
```

---

## Example CSV Format

```csv
traderId,traderName,stockSymbol,tradeType,quantity,price,tradeTime
T1001,Aman Roy,INFY,BUY,10,1500,2026-05-20T10:00:00
T1002,Neha Roy,PAYTM,BUY,6000,450,2026-05-20T10:05:00
T1003,Rahul Mehta,RELIANCE,BUY,2000,2800,2026-05-20T10:10:00
```

---

## Key API Areas

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
GET  /api/auth/me
POST /api/auth/forgot-password
PUT  /api/auth/reset-password/:token
```

### Trades

```txt
GET    /api/trades
POST   /api/trades
POST   /api/trades/upload
GET    /api/trades/:id
PUT    /api/trades/:id
DELETE /api/trades/:id
```

### Alerts

```txt
GET /api/alerts
GET /api/alerts/:id
PUT /api/alerts/:id/status
PUT /api/alerts/:id/assign
POST /api/alerts/:id/comments
PUT /api/alerts/:id/priority
GET /api/alerts/assigned/me
```

### Risk Rules

```txt
GET /api/risk-rules
GET /api/risk-rules/:id
PUT /api/risk-rules/:id
```

### Dashboard

```txt
GET /api/dashboard/summary
GET /api/dashboard/alerts-by-severity
GET /api/dashboard/alerts-by-type
GET /api/dashboard/risk-trend
GET /api/dashboard/rule-trigger-summary
GET /api/dashboard/blocked-trade-summary
GET /api/dashboard/recent-risk-events
```

### Audit Logs

```txt
GET /api/audit-logs
```

---

## Deployment Notes

### Backend on Render

Set root directory:

```txt
backend
```

Build command:

```bash
npm install && npm run build:cpp:linux
```

Start command:

```bash
npm start
```

Add environment variables in Render:

```env
MONGO_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-vercel-url.vercel.app
GOOGLE_CLIENT_ID=...
ADMIN_REGISTRATION_SECRET=...
REDIS_URL=...
```

### Frontend on Vercel

Set root directory:

```txt
frontend
```

Build command:

```bash
npm run build
```

Output directory:

```txt
dist
```

Add environment variables in Vercel:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com/api
VITE_GOOGLE_CLIENT_ID=...
```

For React Router refresh support, keep `vercel.json` inside the frontend folder:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```