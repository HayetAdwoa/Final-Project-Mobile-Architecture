# 🚀 Deployment Instructions — NERDCP

This guide covers deployment from local development to a cloud VPS (e.g., DigitalOcean, AWS EC2, or Render).

---

## Option A: Local Development (Recommended for Demo)

### Requirements
- Docker Desktop 4.x+
- Node.js 18+
- 4GB+ RAM (for all containers)

```bash
# 1. Start backend
git clone https://github.com/HayetAdwoa/Final-Project-Mobile-Architecture.git
cd Final-Project-Mobile-Architecture
docker compose up -d

# 2. Start frontend
cd frontend
cp .env.example .env
npm install
npm run dev
# → http://localhost:3000
```

---

## Option B: Full Docker (Frontend + Backend)

Add this service to your `docker-compose.yml`:

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_AUTH_URL=http://auth-service:4001
      - VITE_INCIDENT_URL=http://incident-service:4002
      - VITE_DISPATCH_URL=http://dispatch-service:4003
      - VITE_ANALYTICS_URL=http://analytics-service:4004
      - VITE_RESPONDER_URL=http://responder-service:4005
    depends_on:
      - auth-service
      - incident-service
      - dispatch-service
      - analytics-service
      - responder-service
    networks:
      - nerdcp-network
```

Then run:
```bash
docker compose up -d --build
```

---

## Option C: Deploy to a VPS (Ubuntu 22.04)

### 1. Provision a server
- Minimum: 2 vCPU, 4GB RAM, 20GB SSD
- Open ports: 22 (SSH), 80, 443, 3000, 4001–4005

### 2. Install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin -y
```

### 3. Clone and run
```bash
git clone https://github.com/HayetAdwoa/Final-Project-Mobile-Architecture.git
cd Final-Project-Mobile-Architecture

# Configure environment
cp frontend/.env.example frontend/.env
# Edit .env: change localhost to your server's public IP

docker compose up -d --build
```

### 4. (Optional) Set up Nginx reverse proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }
    location /auth/ {
        proxy_pass http://localhost:4001/;
    }
    location /incidents/ {
        proxy_pass http://localhost:4002/;
    }
    location /dispatch/ {
        proxy_pass http://localhost:4003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    location /analytics/ {
        proxy_pass http://localhost:4004/;
    }
    location /responders/ {
        proxy_pass http://localhost:4005/;
    }
}
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Containers not starting | `docker compose logs <service-name>` |
| Port already in use | `lsof -i :<port>` then `kill <PID>` |
| Database connection error | Wait 30s for DB to initialise, then `docker compose restart <service>` |
| Frontend shows blank page | Check `frontend/.env` has correct service URLs |
| WebSocket not connecting | Ensure port 4003 is not blocked by firewall |
| `npm install` fails | Delete `node_modules/` and `package-lock.json`, retry |

---

## Health Check URLs

Once running, verify each service:

```bash
curl http://localhost:4001/health   # Auth
curl http://localhost:4002/health   # Incidents
curl http://localhost:4003/health   # Dispatch
curl http://localhost:4004/health   # Analytics
curl http://localhost:4005/health   # Responders
```
