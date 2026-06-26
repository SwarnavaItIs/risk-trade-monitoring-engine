# Risk Trade Monitoring Engine

[![CI](https://github.com/SwarnavaItIs/risk-trade-monitoring-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/SwarnavaItIs/risk-trade-monitoring-engine/actions/workflows/ci.yml)

A full-stack risk and compliance monitoring platform for trade surveillance, pre-trade controls, order lifecycle monitoring, alert investigation, post-trade audits, and operational health visibility.

The app is built like a simplified market risk system: trades are checked before acceptance, suspicious behavior generates alerts, admins can tune risk rules, and analysts can investigate assigned alerts with comments, priorities, deadlines, and AI-assisted summaries.

## Deployed Links

- Frontend: https://risk-trade-monitoring-engine.vercel.app/
- Backend: https://risk-trade-monitoring-engine.onrender.com

## What The System Does

- Accepts manual trades and CSV trade uploads.
- Blocks risky trades before saving when pre-trade controls fail.
- Generates alerts from behavioral and order-lifecycle surveillance rules.
- Tracks submitted, cancelled, partially filled, and filled orders.
- Lets admins assign alerts to analysts, set priority, and define review deadlines.
- Lets analysts review alerts, add investigation comments, and update status.
- Stores audit logs for important admin, alert, trade, CSV, and order actions.
- Runs post-trade audit checks for concentration and burn-rate risk.
- Uses optional Redis, Finnhub, Gemini, and C++ integrations with safe fallbacks.
- Provides dashboard analytics, AI risk assistance, system health, and CI verification.

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Recharts
- React Markdown with GFM support
- Google OAuth client

### Backend

- Node.js
- Express
- MongoDB and Mongoose
- JWT authentication
- Google OAuth verification
- Multer and CSV Parser
- Node test runner

### Risk And Integration Layer

- Dynamic MongoDB-backed risk rules
- Optional Redis rolling-window/cache layer
- Optional C++17 behavioral risk engine
- JavaScript and MongoDB fallback risk logic
- Optional Finnhub market data provider
- Static reference-price fallback
- Optional Gemini AI integration
- Local fallback explanations for alert AI workflows

## Core Domains

### Authentication And Roles

- Email/password registration and login.
- Google OAuth login/register.
- JWT-protected backend routes.
- ADMIN and ANALYST roles.
- Admin registration protected by `ADMIN_REGISTRATION_SECRET`.
- Forgot/reset password flow.
- Profile page with Google photo or fallback initials.

### Trades

- Manual trade creation.
- CSV trade upload.
- Native date-time picker for trade execution time.
- Pre-trade validation and blocking.
- Blocked-trade feedback with failed rule details.
- Behavioral alert generation after accepted trades.
- RiskEvent logging for blocked trades and triggered rules.

### Orders

Orders are separate from trades. They do not replace the existing Trade model.

- Create orders.
- View and filter orders.
- Cancel orders.
- Fill orders fully or partially.
- Track `SUBMITTED`, `PARTIALLY_FILLED`, `FILLED`, and `CANCELLED`.
- Calculate order value automatically.
- Log order create/cancel/fill audit events.
- Activate R9 order-to-trade/cancel-to-fill surveillance.

### Alerts

- View all alerts.
- Filter by severity, status, symbol, trader, priority, and assignment.
- View "My Alerts" assigned to the logged-in user.
- Update alert status without breaking the original review workflow.
- Admins can assign alerts to analysts/admins.
- Admins can update priority and review deadline.
- Users can add review comments.
- Comment history is preserved.
- Latest comment is mirrored into `reviewComment` for compatibility.
- Alerts can reference either a trade or an order.

### Audit Logs

Audit logs are created for important workflow actions, including:

- Risk rule updates.
- Alert assignment.
- Alert comments.
- Alert status changes.
- Alert priority updates.
- CSV upload processing.
- Order creation.
- Order cancellation.
- Order fill actions.
- Member management actions.

### AI Assistance

The AI layer is optional and uses Gemini when configured.

- Alert explanation generation.
- Alert investigation summary generation.
- Daily risk report generation.
- Natural-language Risk Assistant page.
- Rule tuning suggestion endpoint.
- Markdown output rendering in the frontend.
- Local fallback explanations for alert explanation and investigation summary when Gemini is unavailable.

Daily reports, Risk Assistant responses, and rule tuning suggestions still require a configured AI provider.

### Toasts And UI Feedback

The frontend includes a shared toast system used across action-heavy workflows:

- Login/register/logout.
- Forgot/reset password.
- Manual trade submission.
- CSV upload.
- Order creation/fill/cancel.
- Alert status, assignment, priority, comments, and AI actions.
- Member management.
- Risk rule updates.
- Risk audit runs.
- System health refreshes.

## Risk Rules

Risk rules are stored in MongoDB and seeded with upsert behavior, so rerunning the seeder updates existing rules without creating duplicates.

| Rule | Name | Tier | Action |
| --- | --- | --- | --- |
| R1 | Single Order Value Cap | PRE_TRADE | BLOCK |
| R2 | Price Collar Check | PRE_TRADE | BLOCK |
| R3 | Daily Notional Limit | PRE_TRADE | BLOCK |
| R4 | Duplicate Order Detection | PRE_TRADE | BLOCK |
| R5 | Single Order Quantity Cap | PRE_TRADE | BLOCK |
| R6 | High-Frequency Velocity | BEHAVIORAL | ALERT |
| R7 | Wash Trade Detection | BEHAVIORAL | ALERT |
| R8 | Momentum Ignition | BEHAVIORAL | ALERT |
| R9 | Order-to-Trade Ratio | BEHAVIORAL | ALERT |
| R10 | After-Hours / Restricted Symbol Trading | BEHAVIORAL | ALERT |
| R11 | Cumulative Portfolio Concentration | POST_TRADE | AUDIT |
| R12 | Aggregate Capital Burn Rate | POST_TRADE | AUDIT |

### Pre-Trade Rules

Pre-trade rules run before a trade is saved.

- R1 blocks trades whose value exceeds the single-order cap.
- R2 blocks trades whose price is outside the configured collar around a reference market price.
- R3 blocks trades that would exceed the trader's daily notional limit.
- R4 blocks duplicate orders submitted inside a short window.
- R5 blocks oversized quantities.

### Behavioral Rules

Behavioral rules run after accepted trades or after order lifecycle updates.

- R6 detects excessive trade velocity.
- R7 detects same-trader opposite-side trades with similar symbol, quantity, and price inside a window.
- R8 detects rapid same-side trading with minimum trade count and notional thresholds.
- R9 detects excessive cancellations compared with filled or partially filled orders.
- R10 detects after-hours trading and restricted-symbol activity.

### Post-Trade Audit Rules

Admins run these from the Risk Audit page.

- R11 detects daily symbol concentration for a trader.
- R12 detects unusually fast capital usage in the last hour.

Findings are stored as `AUDIT_TRIGGERED` RiskEvents and shown in the Risk Audit results table.

## Fallback Architecture

MongoDB is required. Redis, C++, Finnhub, and Gemini are optional.

### Redis

Redis is used when `REDIS_URL` is configured and connected.

- Rolling-window checks for selected risk rules.
- Market-price cache keys such as `market:last-price:TCS`.
- 60-second TTL for cached market prices.
- System Health page reports enabled and connected status.

If Redis is missing or disconnected, supported logic falls back to MongoDB/JavaScript paths.

### C++ Risk Engine

The backend can call a C++17 executable for supported low-latency behavioral checks.

- Windows executable: `backend/cpp_risk_engine/risk_engine.exe`
- Linux/macOS executable: `backend/cpp_risk_engine/risk_engine`
- Status is available through the System Health page.
- Missing executable, timeout, crash, or invalid JSON returns to JavaScript fallback behavior.

### Market Data

R2 Price Collar Check uses this lookup chain:

```txt
Redis cache -> Finnhub quote API -> Static reference price -> Unavailable
```

Static fallback prices are available for common Indian-style symbols such as `RELIANCE`, `TCS`, `INFY`, `PAYTM`, `YESBANK`, `HDFCBANK`, and `ICICIBANK`.

### AI

Gemini is used when `GEMINI_API_KEY` is configured.

If Gemini is unavailable:

- Alert explanation returns a local fallback explanation.
- Investigation summary returns a local fallback summary.
- Other AI endpoints return provider errors instead of silently inventing results.

## System Architecture

```txt
React Frontend
    |
    | Axios API calls + JWT
    v
Express Backend
    |
    | Mongoose
    v
MongoDB Atlas / MongoDB

Trade Submission
    |
    v
Pre-Trade Risk Engine
    |
    |-- R1-R5/R10 block path -> RiskEvent + blocked response
    |
    |-- Pass path -> Save Trade
                    |
                    v
              Behavioral Risk Engine
                    |
                    |-- Redis rolling-window checks when connected
                    |-- C++ engine for supported fast checks when executable exists
                    |-- JavaScript/MongoDB fallback logic
                    |
                    v
              Alert + RiskEvent generation

Order Lifecycle
    |
    |-- Submit / Fill / Partial Fill / Cancel
    |
    v
R9 Order-to-Trade Ratio evaluation
    |
    v
Alert + RiskEvent + AuditLog where applicable

Admin Post-Trade Audit
    |
    |-- R11 concentration audit
    |-- R12 capital burn-rate audit
    |
    v
AUDIT_TRIGGERED RiskEvents

Admin / Analyst UI
    |
    |-- Dashboard
    |-- Trades and CSV Upload
    |-- Orders
    |-- Alerts and My Alerts
    |-- Alert Details workflow
    |-- Risk Rules
    |-- Audit Logs
    |-- Risk Audit
    |-- System Health
    |-- AI Risk Assistant
```

## Detailed Project Workflows

### 1. User Authentication Workflow

```txt
User opens app
    |
    v
Login / Register page
    |
    |-- Email + password
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

Protected API calls include:

```txt
Authorization: Bearer <token>
```

The backend auth middleware verifies the JWT and attaches the logged-in user to the request.

### 2. Role-Based Access Workflow

```txt
Logged-in user
    |
    v
Backend checks role
    |
    |-- ADMIN
    |     Can manage risk rules, members, alert assignment, audit logs,
    |     system health, and post-trade audits.
    |
    |-- ANALYST
          Can create/view trades and orders, view alerts,
          review assigned alerts, and add comments.
```

The frontend hides admin-only links for non-admin users, but backend middleware still enforces the real access control.

### 3. Manual Trade Creation Workflow

```txt
User submits trade form
    |
    v
Frontend converts optional tradeTime to ISO string
    |
    v
POST /api/trades
    |
    v
Backend validates input
    |
    v
Pre-trade risk engine loads enabled PRE_TRADE rules
    |
    v
R1-R5 checks run
```

If a blocking rule fails:

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
Frontend shows blocked-trade feedback + toast
```

If all pre-trade checks pass:

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
Each valid row passes through pre-trade checks
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

The frontend reports total rows, saved trades, generated alerts, blocked rows, failed rows, and upload toast feedback.

### 5. Pre-Trade Risk Workflow

Pre-trade rules run before trade insertion.

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
R5: Single Order Quantity Cap
    |
    v
If any blocking rule fails -> block trade
```

R2 uses the market data service, so its reason includes the data source used for the reference price.

Example blocked response shape:

```json
{
  "message": "Trade blocked by pre-trade risk controls",
  "blocked": true,
  "failedRules": [
    {
      "ruleCode": "R2_PRICE_COLLAR_CHECK",
      "ruleName": "Price Collar Check",
      "severity": "HIGH",
      "action": "BLOCK",
      "reason": "Order price 2500 deviates 66.67% from market price 1500 (STATIC_FALLBACK)"
    }
  ]
}
```

### 6. Market Data Workflow For R2

```txt
R2 needs latest market price
    |
    v
Check Redis cache: market:last-price:SYMBOL
    |
    |-- Hit -> use REDIS_CACHE
    |
    |-- Miss
          |
          v
      If Finnhub configured -> call quote API
          |
          |-- Success -> cache for 60 seconds + use FINNHUB
          |
          |-- Failure / missing key
                |
                v
            Use static fallback price when symbol is known
                |
                v
            Return UNAVAILABLE if no source can price the symbol
```

This keeps R2 useful even without Redis or an external market-data key.

### 7. Behavioral Risk Workflow

Behavioral rules run after a trade is accepted.

```txt
Accepted trade
    |
    v
Fetch recent trade context
    |
    v
Try C++ risk engine for supported checks
    |
    |-- If C++ works -> merge supported results
    |
    |-- If C++ unavailable -> continue with JS/Redis/MongoDB logic
    |
    v
Apply JavaScript behavioral rules
    |
    |-- R6 high-frequency velocity
    |-- R7 wash trade with quantity/price tolerance
    |-- R8 momentum ignition with count/notional window
    |-- R10 after-hours or restricted symbol checks
    |
    v
Calculate risk score and severity
    |
    v
Create Alert + RiskEvent if risky
```

### 8. Redis Workflow

```txt
Risk rule needs rolling-window state
    |
    v
Check Redis connection status
    |
    |-- Connected
    |     Use Redis keys/sorted sets for fast window checks
    |
    |-- Not connected
          Use MongoDB/JavaScript fallback where implemented
```

Redis is optional. Connection state is exposed through `/api/system/engine-health` and the System Health admin page.

### 9. C++ Risk Engine Workflow

```txt
Node.js behavioral engine
    |
    v
Build input payload for current trade + recent trades
    |
    v
Check executable path exists
    |
    |-- Missing -> return null and use fallback
    |
    v
Spawn C++ executable
    |
    v
C++ returns JSON
    |
    |-- Valid JSON -> merge result
    |-- Timeout / crash / invalid JSON -> use fallback
```

This makes the C++ engine useful when available without making the whole backend dependent on it.

### 10. Alert Assignment And Review Workflow

```txt
Alert generated
    |
    v
Admin opens Alert Details
    |
    v
Admin assigns alert to analyst/admin
    |
    |-- assignedTo
    |-- assignedToName
    |-- assignedToEmail
    |-- priority
    |-- reviewDeadline
    |
    v
Assigned user sees alert in My Alerts
    |
    v
Analyst/admin adds comments and updates status
    |
    v
Comment history, latest reviewComment, and audit logs are saved
```

Alert details also support AI explanation and investigation summary rendering in Markdown.

### 11. Order Lifecycle And R9 Workflow

```txt
User creates order
    |
    v
Order stored as SUBMITTED
    |
    |-- Fill -> FILLED or PARTIALLY_FILLED
    |-- Cancel -> CANCELLED
    |
    v
Audit log records lifecycle action
    |
    v
R9 evaluates recent order activity for the trader
    |
    v
If cancel-to-fill ratio exceeds threshold -> create alert + RiskEvent
```

Orders and trades coexist. Order lifecycle monitoring powers cancellation-to-fill surveillance without replacing the trade submission workflow.

### 12. Post-Trade Audit Workflow

```txt
Admin opens Risk Audit page
    |
    v
POST /api/risk-audit/run
    |
    |-- R11 calculates daily notional concentration by trader/symbol
    |-- R12 calculates last-hour capital burn rate
    |
    v
Findings saved as AUDIT_TRIGGERED RiskEvents
    |
    v
GET /api/risk-audit/results displays results table
```

This workflow is intentionally admin-triggered so post-trade audits stay explainable and easy to test.

### 13. Risk Rule Management Workflow

```txt
Admin opens Risk Rules page
    |
    v
Frontend fetches MongoDB-backed rules
    |
    v
Admin edits enabled flag, thresholds, severity, action, risk weight, or description
    |
    v
PUT /api/risk-rules/:id
    |
    v
Backend updates rule and writes audit log
    |
    v
New trades and audits use the updated configuration
```

The risk rule seeder uses upserts by `ruleCode`, so default descriptions and parameters can be refreshed safely.

### 14. Audit Log Workflow

```txt
Important action happens
    |
    v
Backend calls audit logger
    |
    v
AuditLog stores actor, action, entity, before/after values,
    metadata, IP/user-agent when available, and timestamp
    |
    v
Admin reviews entries in Audit Logs page
```

Tracked actions include risk rule updates, alert assignment/comments/status/priority, CSV upload, member actions, and order lifecycle events.

### 15. Dashboard Analytics Workflow

```txt
Trade, Alert, RiskEvent, and Order data
    |
    v
Dashboard APIs aggregate summaries
    |
    v
Frontend renders cards, charts, recent events, and ranked tables
```

Dashboard data includes total trades, alerts, blocked trades, risk events, severity distribution, alert types, rule trigger summaries, top blocked rules, risky traders, top traded stocks, and recent events.

### 16. AI Risk Workflow

```txt
User asks for AI output
    |
    |-- Alert explanation
    |-- Investigation summary
    |-- Daily risk report
    |-- Risk Assistant question
    |-- Rule tuning suggestions
    |
    v
Backend collects relevant risk context
    |
    v
Gemini provider is called when configured
    |
    |-- Success -> Markdown response returned
    |-- Provider unavailable
          |
          |-- Alert explanation/summary -> local fallback content
          |-- Other AI routes -> provider error response
    |
    v
Frontend renders Markdown safely with AIFormattedOutput
```

This keeps AI helpful while making provider failure visible instead of silent.

### 17. System Health Workflow

```txt
Admin opens System Health
    |
    v
GET /api/system/engine-health
    |
    v
Backend reports:
    - Redis enabled/connected/urlConfigured
    - C++ executable availability/path/platform
    - Market data provider/configuration
    - Fallback strategy descriptions
```

Admins can quickly see whether Redis, C++, and market data are active or whether fallback behavior is being used.

### 18. Toast Feedback Workflow

```txt
User clicks an action button
    |
    v
API request runs
    |
    |-- Success -> success toast with action result
    |-- Failure -> danger toast with backend/client error message
```

The shared ToastProvider keeps feedback consistent across auth, trades, CSV upload, orders, alerts, members, risk rules, risk audit, and system health.
## Frontend Pages

- `/dashboard` - Analytics dashboard and daily AI risk report.
- `/trades` - Manual trade creation and trade list.
- `/orders` - Order lifecycle creation, filters, fill, and cancel actions.
- `/alerts` - Alert list and filters.
- `/my-alerts` - Alerts assigned to the logged-in user.
- `/alerts/:id` - Alert details, review workflow, comments, AI explanation, and investigation summary.
- `/csv-upload` - CSV trade upload.
- `/risk-rules` - Admin risk rule management.
- `/risk-assistant` - Natural-language AI risk assistant.
- `/profile` - User profile.
- `/admin/members` - Admin member management.
- `/admin/audit-logs` - Admin audit logs.
- `/admin/system-health` - Redis, C++, market data, and fallback health.
- `/admin/risk-audit` - R11/R12 post-trade audit runner and results.

Admin-only links are hidden in the navbar for non-admin users and protected again by backend/admin route checks where applicable.

## Backend API Overview

All protected endpoints expect:

```txt
Authorization: Bearer <token>
```

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
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

### Orders

```txt
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
PUT  /api/orders/:id/cancel
PUT  /api/orders/:id/fill
```

### Alerts

```txt
GET  /api/alerts
GET  /api/alerts/assigned/me
GET  /api/alerts/:id
PUT  /api/alerts/:id/status
PUT  /api/alerts/:id/assign
POST /api/alerts/:id/comments
PUT  /api/alerts/:id/priority
```

### Dashboard

```txt
GET /api/dashboard/summary
GET /api/dashboard/alerts-by-severity
GET /api/dashboard/alerts-by-type
GET /api/dashboard/top-risky-traders
GET /api/dashboard/top-traded-stocks
GET /api/dashboard/risk-trend
GET /api/dashboard/rule-trigger-summary
GET /api/dashboard/blocked-trade-summary
GET /api/dashboard/recent-risk-events
```

### Risk Rules

```txt
GET /api/risk-rules
GET /api/risk-rules/:id
PUT /api/risk-rules/:id
```

### Admin

```txt
GET    /api/admin/members
PATCH  /api/admin/members/:id/role
DELETE /api/admin/members/:id
GET    /api/admin/audit-logs
```

### System

```txt
GET /api/system/engine-health
GET /api/system/market-price/:symbol
```

### Risk Audit

```txt
POST /api/risk-audit/run
GET  /api/risk-audit/results
```

### AI

```txt
GET  /api/ai/health
POST /api/ai/test
POST /api/ai/alerts/:alertId/explain
POST /api/ai/alerts/:alertId/investigation-summary
POST /api/ai/reports/daily-risk
POST /api/ai/risk-assistant/query
POST /api/ai/risk-rules/suggestions
```

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
MONGO_CONNECT_TIMEOUT_MS=10000

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ADMIN_REGISTRATION_SECRET=your_admin_registration_secret

GOOGLE_CLIENT_ID=your_google_client_id
FRONTEND_URL=http://localhost:5173

REDIS_URL=redis://localhost:6379

MARKET_DATA_PROVIDER=FINNHUB
FINNHUB_API_KEY=your_finnhub_api_key

CPP_RISK_ENGINE_ENABLED=true
CPP_RISK_ENGINE_PATH=
CPP_RISK_ENGINE_TIMEOUT_MS=2000
CPP_RISK_ENGINE_LOG_SUCCESS=false

AI_PROVIDER=GEMINI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

For basic local development, MongoDB and JWT values are required. Redis, Finnhub, C++, and Gemini can be left unconfigured if you are comfortable using the fallback behavior.

## Running Locally

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 3. Seed default risk rules

```bash
cd ../backend
npm run seed:risk-rules
```

The seeder uses `ruleCode` upserts, so it updates existing defaults without creating duplicate rules.

### 4. Optional: build the C++ engine

Windows:

```bash
npm run build:cpp:win
```

Linux/macOS:

```bash
npm run build:cpp:linux
```

Verify:

```bash
npm run check:cpp
```

### 5. Optional: start Redis locally

```bash
docker run --name risk-redis -p 6379:6379 -d redis
```

If the container already exists:

```bash
docker start risk-redis
```

### 6. Start backend

```bash
cd backend
npm run dev
```

Backend default URL:

```txt
http://localhost:5000
```

### 7. Start frontend

```bash
cd frontend
npm run dev
```

Frontend default URL:

```txt
http://localhost:5173
```

## Scripts

### Backend

```bash
npm run dev
npm start
npm test
npm run seed:risk-rules
npm run build:cpp:win
npm run build:cpp:linux
npm run check:cpp
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Example CSV Format

```csv
traderId,traderName,stockSymbol,tradeType,quantity,price,tradeTime
T1001,Aman Roy,INFY,BUY,10,1500,2026-05-20T10:00:00
T1002,Neha Roy,PAYTM,BUY,6000,450,2026-05-20T10:05:00
T1003,Rahul Mehta,RELIANCE,BUY,2000,2800,2026-05-20T10:10:00
```

## Testing And CI

Backend tests:

```bash
cd backend
npm test
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

CI runs on pushes and pull requests to `main`.

The GitHub Actions workflow:

- Uses Ubuntu.
- Sets up Node.js 20.
- Installs backend and frontend dependencies.
- Builds the Linux C++ risk engine.
- Runs the C++ health check.
- Runs backend tests.
- Builds the frontend.
- Uses safe CI-only environment values.
- Does not require Redis or Finnhub.

## Deployment Notes

### Backend On Render

Root directory:

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

Important environment variables:

```env
MONGO_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
ADMIN_REGISTRATION_SECRET=...
GOOGLE_CLIENT_ID=...
FRONTEND_URL=https://your-frontend-domain
REDIS_URL=...
MARKET_DATA_PROVIDER=FINNHUB
FINNHUB_API_KEY=...
CPP_RISK_ENGINE_ENABLED=true
CPP_RISK_ENGINE_PATH=cpp_risk_engine/risk_engine
AI_PROVIDER=GEMINI
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
```

### Frontend On Vercel

Root directory:

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

Important environment variables:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
VITE_GOOGLE_CLIENT_ID=...
```

For React Router refresh support, keep `frontend/vercel.json`:

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

## Troubleshooting

### MongoDB buffering timeout or startup failure

The backend now requires MongoDB before it starts listening. Check:

- `MONGO_URI` is set.
- MongoDB Atlas allows your current IP address.
- Your username/password and database permissions are valid.
- `MONGO_CONNECT_TIMEOUT_MS` is high enough for your network.

### Redis connection errors

Redis is optional. If `REDIS_URL` is set but unreachable, the backend logs Redis errors and uses fallback logic where supported. Remove `REDIS_URL` locally if you do not want Redis attempts.

### C++ engine unavailable

Run the correct build command for your OS, then check `/api/system/engine-health` as an admin. If the executable is missing or crashes, the backend continues with JavaScript/Redis fallback logic.

### Finnhub unavailable or API key missing

R2 Price Collar Check falls back to static reference prices. The reason text includes the source used, such as `FINNHUB` or `STATIC_FALLBACK`.

### Gemini AI errors

Check `GEMINI_API_KEY`, `GEMINI_MODEL`, backend internet access, and provider permissions. Alert explanations and investigation summaries can still return local fallback content.

