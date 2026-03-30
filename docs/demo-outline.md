# 🎬 NERDCP — 5-Minute Demo Script

**Course:** CPEN 421 · University of Ghana  
**Project:** National Emergency Response & Dispatch Coordination Platform

---

## Pre-Demo Checklist

Before recording, ensure:
- [ ] `docker compose up -d` — all 5 services are healthy
- [ ] `cd frontend && npm run dev` — frontend running at localhost:3000
- [ ] Browser open at `http://localhost:3000`
- [ ] RabbitMQ console open at `http://localhost:15672`
- [ ] Two browser windows ready (for multi-role demo)
- [ ] Postman open with the API collection loaded

---

## Demo Flow (5 Minutes)

---

### **[0:00 – 0:30] Introduction (30s)**

**Narrate:**  
> "This is NERDCP — the National Emergency Response and Dispatch Coordination Platform, built for CPEN 421 at the University of Ghana. It's a full-stack microservices application that unifies emergency coordination across Hospital, Police, and Fire Service operations."

**Show:** The architecture diagram from the README, briefly.

**Key points to state:**
- 5 independent microservices communicating via REST and RabbitMQ
- Real-time WebSocket tracking
- Role-based access for 3 emergency service types
- Dockerised and cloud-ready

---

### **[0:30 – 1:00] Login & Role System (30s)**

**Action:** Navigate to `http://localhost:3000/login`

**Show:**
1. The dark command-center login UI
2. The 4 quick-login demo buttons (Admin, Police, Fire, Hospital)
3. Click **"Admin"** to auto-fill, then click **"Access System"**

**Narrate:**  
> "The system uses JWT authentication. Each role — Admin, Police, Fire, and Hospital — sees a customised dashboard with only the features relevant to their operations."

**Show:** The dashboard loads with stat tiles and recent incidents.

---

### **[1:00 – 2:00] Reporting an Incident (60s)**

**Action:** Click **"Incidents"** in the sidebar, or **"Report Incident"** button on the dashboard.

**Show:**
1. The split layout — form on the right, Leaflet map on the left
2. **Click a location on the map** (near Accra, Ghana — around Legon or the Ring Road area)
3. The coordinates auto-populate
4. Select type: **"Fire Emergency"**
5. Set severity to **"Critical"**
6. Type a description: `"Warehouse fire at Industrial Area, multiple floors involved"`
7. Watch the **nearest responders** panel populate on the left map with blue markers
8. Click **"Dispatch Alert"**

**Narrate:**  
> "When an incident is reported, the system immediately calls the Responder Service to find the nearest available units. The Incident Service then publishes an `incident.created` event to RabbitMQ, which the Analytics Service consumes to update statistics."

**Show:** The success screen with the incident ID.

---

### **[2:00 – 2:45] Dispatch Status Dashboard (45s)**

**Action:** Click **"Dispatch Status"** in the sidebar.

**Show:**
1. The incident list sorted by severity, with the just-created incident at the top
2. The **CRITICAL** red severity tag
3. The status filter tabs (All / Active / Pending / Dispatched / Resolved)
4. Click **"Dispatch"** on the new incident
5. Watch the status change to **"Dispatched"** (badge turns blue)

**Narrate:**  
> "The Dispatch Status dashboard is the operator's command centre. Critical incidents are always at the top. Dispatching triggers another RabbitMQ event — `incident.dispatched` — which updates analytics in real time."

---

### **[2:45 – 3:30] Live Vehicle Tracking (45s)**

**Action:** Click **"Track"** next to the dispatched incident, or navigate to **"Live Tracking"**.

**Show:**
1. The full-screen dark tracking map
2. Paste the incident ID into the input field (or it auto-populates from the Track button)
3. Click **"Connect"** — the WebSocket status indicator shows **LIVE** in green
4. **Open Postman** and send the "Update Vehicle Location" request several times with slightly different `lat`/`lng` values to simulate movement (e.g., 5.6037 → 5.6045 → 5.6053)
5. Show the vehicle marker appearing and moving on the map
6. Show the animated polyline trail
7. Show the event log updating in the right sidebar

**Narrate:**  
> "The Dispatch Service stores GPS coordinates in MongoDB and broadcasts them over WebSocket. The frontend auto-reconnects on disconnect and renders animated vehicle markers with movement trails."

---

### **[3:30 – 4:15] Analytics Dashboard (45s)**

**Action:** Click **"Analytics"** in the sidebar.

**Show:**
1. The KPI tiles (Total Incidents, Avg Response Time, Resolved Rate, Active Now)
2. Bar chart: Incidents by Type
3. Pie chart: Distribution
4. Area chart: Response Times trend
5. Stacked bar: Resource Utilization

**Narrate:**  
> "The Analytics Service subscribes to RabbitMQ events and builds statistics in PostgreSQL. The dashboard pulls from four separate endpoints: `/analytics/summary`, `/analytics/incidents-by-type`, `/analytics/response-times`, and `/analytics/resource-utilization`."

---

### **[4:15 – 4:45] Role-Based Views (30s)**

**Action:** Open a new browser tab, go to `http://localhost:3000/login`, and log in as **Hospital Admin**.

**Show:**
1. The sidebar is different — no **"Responders"** menu item (Hospital doesn't dispatch field units)
2. On the Incident Report page, incident type options are filtered — only **Medical** and **Accident** types are available
3. Switch back to Admin view — all options visible

**Narrate:**  
> "Role-based access is enforced both in the UI and at the route level. Hospital admins see a tailored interface — they can report and track medical incidents but don't manage field responders."

---

### **[4:45 – 5:00] Closing (15s)**

**Show:** The RabbitMQ management console at `http://localhost:15672`

**Show:** The message queues with `incident.created` and `incident.dispatched` messages.

**Narrate:**  
> "Every component of NERDCP is containerised and runs with a single `docker compose up` command. The system demonstrates a production-grade microservices architecture — event-driven, independently deployable, and ready for cloud hosting. Thank you."

---

## 💡 Tips for Recording

- **Screen resolution:** 1920×1080 for crisp UI
- **Zoom browser to 90%** for the map and tracking pages
- Use **OBS Studio** (free) for screen recording
- Record at 30fps, export as MP4
- Keep narration at a measured pace — don't rush the map interactions
- The dark UI records beautifully; ensure your screen brightness is full

---

## 🔁 Optional Extra (if time permits)

Show the `docker compose ps` and `docker compose logs -f incident-service` terminal output to demonstrate the microservices architecture in action.
