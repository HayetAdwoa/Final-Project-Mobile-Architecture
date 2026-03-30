# 🚨 NERDCP — National Emergency Response & Dispatch Coordination Platform

> **CPEN 421 Final Project** · University of Ghana  
> A full-stack, microservices-based emergency dispatch and coordination system for Hospital, Police, and Fire Service administrators.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NERDCP Platform                             │
├─────────────────┬───────────────────────────────────────────────────┤
│  FRONTEND       │  React + Vite (Port 3000)                         │
│  (Phase 3)      │  Login · Incidents · Dispatch · Tracking · Analytics │
├─────────────────┼───────────────────────────────────────────────────┤
│  Auth Service   │  Port 4001 · PostgreSQL · JWT                     │
│  Incident Svc   │  Port 4002 · RabbitMQ publisher                   │
│  Dispatch Svc   │  Port 4003 · MongoDB · WebSocket                  │
│  Analytics Svc  │  Port 4004 · PostgreSQL · RabbitMQ consumer       │
│  Responder Svc  │  Port 4005 · Nearest responder finder             │
├─────────────────┼───────────────────────────────────────────────────┤
│  Infrastructure │  RabbitMQ · PostgreSQL · MongoDB · Docker Compose  │
└─────────────────┴───────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
Final-Project-Mobile-Architecture/
├── auth-service/           # Phase 2 — Authentication microservice
├── incident-service/       # Phase 2 — Incident creation & dispatch
├── dispatch-service/       # Phase 2 — GPS tracking & WebSockets
├── analytics-service/      # Phase 2 — Stats & reporting
├── responder-service/      # Phase 2 — Responder registry
├── docker-compose.yml      # Orchestrates all backend services
├── frontend/               # Phase 3 — React web frontend
│   ├── public/
│   ├── src/
│   │   ├── api/            # Axios API modules per service
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Common/     # ProtectedRoute, StatusBadge, Feedback
│   │   │   ├── Layout/     # Sidebar, Header, AppLayout
│   │   │   └── Map/        # IncidentMap, TrackingMap (Leaflet)
│   │   ├── context/        # AuthContext (JWT + roles)
│   │   ├── hooks/          # useWebSocket (live tracking)
│   │   ├── pages/          # All 6 app pages
│   │   └── styles/         # Global CSS design system
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── docs/
    ├── api-collection.json # Postman collection
    └── demo-outline.md     # 5-minute demo script
```

---

## ⚡ Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Node.js 18+](https://nodejs.org/) (for running frontend locally)
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/HayetAdwoa/Final-Project-Mobile-Architecture.git
cd Final-Project-Mobile-Architecture
```

---

### 2. Start the Backend (Microservices)

```bash
# Start all 5 microservices + infrastructure (RabbitMQ, PostgreSQL, MongoDB)
docker compose up -d

# Verify all containers are running
docker compose ps

# View logs from all services
docker compose logs -f

# View logs from a specific service
docker compose logs -f auth-service
```

Expected output — all services should show `healthy` or `running`:

| Service | Port | Status |
|---|---|---|
| auth-service | 4001 | ✅ Running |
| incident-service | 4002 | ✅ Running |
| dispatch-service | 4003 | ✅ Running |
| analytics-service | 4004 | ✅ Running |
| responder-service | 4005 | ✅ Running |
| rabbitmq | 5672 / 15672 | ✅ Running |
| postgres | 5432 | ✅ Running |
| mongodb | 27017 | ✅ Running |

> 💡 **First run:** Docker will pull base images and build containers. This can take 2–5 minutes.

---

### 3. Run the Frontend

```bash
cd frontend

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at: **http://localhost:3000**

---

### 4. Login Credentials

Use the demo accounts for testing:

| Role | Email | Password |
|---|---|---|
| System Admin | admin@nerdcp.gh | admin123 |
| Police Admin | police@nerdcp.gh | police123 |
| Fire Service | fire@nerdcp.gh | fire123 |
| Hospital Admin | hospital@nerdcp.gh | hospital123 |

> ℹ️ These are seeded in the auth-service database. Check `auth-service/seeds/` if not present.

---

## 🧭 Feature Walkthrough

### Login Page (`/login`)
- JWT authentication via `POST /auth/login`
- Role-based demo quick-login buttons
- Token stored in `localStorage`, auto-parsed for role

### Incident Reporting (`/incidents`)
- Click map to pick GPS coordinates (Leaflet/OpenStreetMap)
- Selects incident type (role-filtered: police only sees police/accident, etc.)
- 4-level severity picker (Low → Critical)
- Fetches nearest responders via `GET /responders/nearest?lat=&lng=&type=`
- Submits via `POST /incidents`

### Dispatch Status (`/dispatch`)
- Lists all incidents sorted by severity
- Filter by status: All / Active / Pending / Dispatched / Resolved
- Dispatch action: `POST /incidents/:id/dispatch`
- Resolve action: `PATCH /incidents/:id/status`
- Auto-refreshes every 20 seconds

### Live Tracking (`/tracking`)
- Enter an Incident ID → connects to `ws://localhost:4003/ws/track?incidentId=...`
- Displays vehicle markers on dark Leaflet map with animated pulses
- Polyline trails showing vehicle movement history
- Live event stream log with timestamps
- Auto-reconnects on disconnect

### Analytics (`/analytics`)
- Bar chart: Incidents by type (from `/analytics/incidents-by-type`)
- Pie chart: Distribution
- Area chart: Response times over time (from `/analytics/response-times`)
- Stacked bar: Resource utilization (from `/analytics/resource-utilization`)
- KPI tiles from `/analytics/summary`

### Responder Registry (`/responders`)
- Grid of all responders from `GET /responders`
- Filter by type (ambulance, police, fire)
- Search by name or call sign
- Status badges, GPS location display

---

## 🔧 Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_AUTH_URL=http://localhost:4001
VITE_INCIDENT_URL=http://localhost:4002
VITE_DISPATCH_URL=http://localhost:4003
VITE_ANALYTICS_URL=http://localhost:4004
VITE_RESPONDER_URL=http://localhost:4005
VITE_WS_DISPATCH_URL=ws://localhost:4003
VITE_GOOGLE_MAPS_API_KEY=   # Optional: leave blank to use OpenStreetMap
```

> The frontend uses Vite's dev proxy so API calls to `/auth/*`, `/incidents/*`, etc. automatically forward to the correct service port during development.

---

## 🐳 Docker Deployment (Full Stack)

To run the frontend in Docker alongside the backend:

```bash
# Build and start everything including frontend
docker compose --profile frontend up -d

# Or build the frontend image manually
cd frontend
docker build -t nerdcp-frontend .
docker run -p 3000:80 nerdcp-frontend
```

---

## 🛑 Stopping Services

```bash
# Stop all services (keep data volumes)
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build
```

---

## 🧪 API Quick Tests

```bash
# Register a user
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","role":"admin"}'

# Login
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Create incident (use token from login)
curl -X POST http://localhost:4002/incidents \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"fire","severity":"high","location":{"lat":5.6037,"lng":-0.1870}}'

# Get analytics summary
curl http://localhost:4004/analytics/summary \
  -H "Authorization: Bearer <TOKEN>"

# Get nearest responders
curl "http://localhost:4005/responders/nearest?lat=5.6037&lng=-0.1870&type=fire" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔌 RabbitMQ Management Console

Once the backend is running, access the RabbitMQ management UI:

- **URL:** http://localhost:15672
- **Username:** `guest`
- **Password:** `guest`

You can monitor message queues for `incident.created` and `incident.dispatched` events in real time.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework + build tool |
| React Router v6 | Client-side routing |
| Recharts | Analytics charts |
| React-Leaflet | Interactive map (OpenStreetMap) |
| Axios | HTTP API client |
| Lucide React | Icons |
| date-fns | Date formatting |

### Backend (Phase 2)
| Technology | Purpose |
|---|---|
| Node.js / Express | Microservice framework |
| PostgreSQL | Auth & analytics persistence |
| MongoDB | Dispatch/GPS storage |
| RabbitMQ | Event messaging between services |
| Docker Compose | Container orchestration |
| JWT | Authentication tokens |
| WebSocket | Real-time vehicle tracking |

---

## 👥 Role-Based Access

| Feature | Admin | Police | Fire | Hospital |
|---|---|---|---|---|
| Report Incident (all types) | ✅ | ✅ | ✅ | ✅ |
| Dispatch & Resolve | ✅ | ✅ | ✅ | ✅ |
| Live Tracking | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ |
| Responder Registry | ✅ | ✅ | ✅ | ❌ |
| Fire-type Incidents | ✅ | ❌ | ✅ | ❌ |
| Medical Incidents | ✅ | ❌ | ❌ | ✅ |

---

## 🎓 Academic Information

- **Course:** CPEN 421 — Mobile Architecture
- **University:** University of Ghana
- **Phase 1:** System design & architecture
- **Phase 2:** Backend microservices (complete)
- **Phase 3:** React frontend (this PR)
- **Phase 4:** Documentation & demo
