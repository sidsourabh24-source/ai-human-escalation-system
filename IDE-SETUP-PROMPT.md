# Project Setup & Architecture Prompt for IDE

## Project Overview
**AI-to-Human Escalation and Lead Handoff System**

A full-stack MVP that deploys an AI chatbot as the first responder, then intelligently escalates conversations to human agents when frustration, confusion, buying intent, or explicit requests are detected.

---

## Tech Stack
- **Frontend:** React 18 + Vite (port 5173)
- **Backend:** Node.js + Express.js + Socket.io (port 4000)
- **Database:** MySQL 8.0 (Docker, optional for MVP)
- **AI API:** Claude (via Anthropic)
- **Communication:** Email (Nodemailer), WebSockets (Socket.io)
- **CRM Mock:** HubSpot adapter (mocked for MVP)

---

## Project Structure

```
d:\minor-2/
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx                           # Main app shell
│   │   ├── main.jsx                          # Vite entry
│   │   ├── styles.css
│   │   ├── components/                       # Reusable UI
│   │   ├── features/
│   │   │   ├── chat-widget/
│   │   │   │   └── ChatWidget.jsx            # Customer chat UI
│   │   │   └── agent-dashboard/
│   │   │       └── AgentDashboard.jsx        # Agent queue UI (skeleton)
│   │   └── services/
│   │       └── chatApi.js                    # API client (port 4000)
│   ├── .env.example
│   └── vite.config.js
│
├── backend/
│   ├── package.json
│   ├── docker-compose.yml                    # MySQL 8.0 setup
│   ├── src/
│   │   ├── server.js                         # HTTP + WebSocket bootstrap
│   │   ├── app.js                            # Express app
│   │   ├── config/
│   │   │   └── env.js                        # Environment config
│   │   ├── routes/
│   │   │   ├── healthRoutes.js               # GET /api/health
│   │   │   └── chatRoutes.js                 # POST /api/chat/message
│   │   ├── sockets/
│   │   │   └── chatSocket.js                 # WebSocket event handlers
│   │   ├── services/
│   │   │   ├── claudeService.js              # Claude reply + escalation logic
│   │   │   ├── leadService.js                # Lead snapshot builder
│   │   │   └── emailService.js               # Nodemailer placeholder
│   │   ├── integrations/
│   │   │   └── hubspotClient.js              # Mocked CRM sync
│   │   ├── middleware/
│   │   │   └── errorHandler.js               # Global error catcher
│   │   └── db/
│   │       └── schema.sql                    # MySQL table definitions
│   ├── .env.example
│   └── src/
│
├── docs/
│   ├── github-issue-backlog.md
│   ├── github-kanban-checklist.md
│   ├── roadmap.md
│   └── kanban-setup.md
│
├── package.json                              # Root monorepo config
└── README.md
```

---

## Quick Start (IDE Setup)

### 1. Install Dependencies
```bash
# Root folder
npm install
```

### 2. Configure Environment Files
Create two `.env` files from the examples:

**backend/.env** (from backend/.env.example):
```
PORT=4000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=1d
CLAUDE_API_KEY=your-claude-key
CLAUDE_MODEL=claude-3-5-sonnet-latest
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
AGENT_ALERT_EMAIL=agent-team@example.com
SALES_ALERT_EMAIL=sales-team@example.com
```

**frontend/.env** (from frontend/.env.example):
```
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

### 3. Start Backend (Terminal 1)
```bash
npm run dev -w backend
# Listens on http://localhost:4000
# WebSocket server running on io connection
```

### 4. Start Frontend (Terminal 2)
```bash
npm run dev -w frontend
# Listens on http://localhost:5173
# Opens http://localhost:5173 in browser
```

### 5. (Optional) Start MySQL Database
From backend folder:
```bash
docker compose up -d
# MySQL runs on localhost:3306
# Database: ai_app | User: ai_user | Password: ai_pass
```

---

## API Endpoints

### Health Check
```
GET http://localhost:4000/api/health
```
Returns service status and timestamp.

### Chat Message (REST)
```
POST http://localhost:4000/api/chat/message
Content-Type: application/json

{
  "conversationId": "conv-123abc",
  "message": "I want to buy a subscription"
}

Response:
{
  "success": true,
  "data": {
    "conversationId": "conv-123abc",
    "assistantReply": "I am connecting you with a human agent now.",
    "escalation": {
      "shouldEscalate": true,
      "signals": {
        "anger": false,
        "confusion": false,
        "buyingIntent": true,
        "manualRequest": false
      }
    },
    "lead": {...},
    "crmResult": {...}
  }
}
```

### Chat Events (WebSocket)
```javascript
// Client joins conversation
socket.emit("chat:join", { conversationId: "conv-123" });
socket.on("chat:joined", (data) => { ... });

// User sends message
socket.emit("chat:user-message", {
  conversationId: "conv-123",
  message: "Help me with pricing"
});

// Listen for responses
socket.on("chat:user-message", (payload) => { /* echo */ });
socket.on("chat:assistant-message", (payload) => {
  // { conversationId, message, escalation, createdAt }
});
```

---

## Key Features (MVP Status)

### ✅ Implemented
- **AI Reply Generation** — Regex-based mock reply (Claude integration ready)
- **Escalation Detection** — Detects anger, confusion, buying intent, manual requests
- **Lead Classification** — Snapshots user intent and signals
- **Mock CRM Sync** — HubSpot adapter returns mocked sync status
- **Email Alerts** — Placeholder for Nodemailer integration
- **Chat Widget** — React component with message history
- **Agent Dashboard** — Skeleton UI for queue display
- **Health Endpoint** — Service liveness check

### 🔄 In Progress / Next Phase
- Real Claude API integration with streaming
- JWT auth and protected routes
- MySQL persistence for messages, conversations, leads
- Live agent handoff and queue ownership
- Email notifications via real Nodemailer
- Analytics dashboard

---

## Escalation Logic

Messages are analyzed for escalation signals:

```
ANGER:         angry|frustrated|worst|useless|terrible|hate
CONFUSION:     confused|don't understand|not clear|what do you mean
BUYING_INTENT: buy|pricing|plan|subscription|demo|enterprise
MANUAL_REQUEST: human|agent|representative|talk to someone

→ If ANY signal matches → shouldEscalate = true
→ Assistant replies: "Connecting you with a human agent now."
```

---

## Environment Variables Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 4000 | Backend server port |
| `FRONTEND_URL` | http://localhost:5173 | Frontend origin for CORS |
| `NODE_ENV` | development | Runtime mode |
| `JWT_SECRET` | change-me | JWT signing key |
| `CLAUDE_API_KEY` | (empty) | Anthropic API key |
| `CLAUDE_MODEL` | claude-3-5-sonnet-latest | Model to use |
| `SMTP_HOST` | (empty) | Mail server host |
| `SMTP_USER` | (empty) | Mail account username |
| `AGENT_ALERT_EMAIL` | (empty) | Alert recipient for escalations |
| `VITE_API_BASE_URL` | http://localhost:4000 | Frontend API endpoint |

---

## Development Workflow

1. **Edit frontend:** Changes auto-reload via Vite HMR (hot module replacement)
2. **Edit backend:** Restart required (using `npm run dev` with `--watch` flag)
3. **Test chat flow:** Open http://localhost:5173, type messages
4. **Monitor backend:** Check console output for logs and errors
5. **Inspect WebSocket:** Use browser DevTools → Network → WS tab

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend can't reach backend | Verify `FRONTEND_URL` in backend `.env` and `VITE_API_BASE_URL` in frontend `.env` |
| Port 4000 already in use | Change `PORT` in backend/.env or kill existing process |
| Port 5173 already in use | Vite will auto-increment to 5174, 5175, etc. |
| Module not found errors | Run `npm install` from root; restart dev servers |
| Claude API errors | Check `CLAUDE_API_KEY` is set correctly in backend/.env |

---

## Database Schema (MySQL)

Current tables in `backend/src/db/schema.sql`:
- `agents` — Agent accounts and roles
- `conversations` — Chat session tracking (ai_active → handoff_pending → agent_active → closed)
- `messages` — Individual chat messages
- `escalations` — Escalation event logs with signals
- `leads` — Lead snapshots and CRM sync status

**Note:** Backend currently does NOT connect to MySQL; all data is in-memory. Database integration comes in Module 4.

---

## File Entry Points

| File | Purpose |
|------|---------|
| `backend/src/server.js` | HTTP and WebSocket server bootstrap |
| `backend/src/app.js` | Express app with CORS and routes |
| `backend/src/config/env.js` | Environment variable loader |
| `backend/src/routes/chatRoutes.js` | REST endpoint `/api/chat/message` |
| `backend/src/sockets/chatSocket.js` | WebSocket event listeners |
| `backend/src/services/claudeService.js` | Escalation detection + reply logic |
| `frontend/src/App.jsx` | React component tree root |
| `frontend/src/features/chat-widget/ChatWidget.jsx` | Customer-facing chat UI |
| `frontend/src/features/agent-dashboard/AgentDashboard.jsx` | Agent queue UI |
| `frontend/src/services/chatApi.js` | Fetch client to backend |

---

## Next Steps for Development

1. **Test the current state** — Run both servers, send messages, verify escalation triggers
2. **Replace mock Claude** — Integrate real Anthropic API call in `claudeService.js`
3. **Add MySQL connection** — Create pool in backend config, persist messages
4. **Build real email** — Replace Nodemailer placeholder with Gmail/SendGrid setup
5. **Agent handoff** — Implement socket-based agent assignment in Dashboard
6. **Auth** — Add JWT endpoints and middleware

---

## Commands Reference

```bash
# Install all dependencies (root)
npm install

# Start backend (watch mode)
npm run dev -w backend

# Start frontend (Vite dev server)
npm run dev -w frontend

# Start MySQL container (from backend folder)
docker compose up -d

# Stop MySQL container
docker compose down

# Build frontend for production
npm run build -w frontend
```

---

## Module Roadmap

- **Week 1:** Setup, repo governance, Kanban, scaffold ✅
- **Week 2:** Backend APIs, DB schema, auth, Claude integration (current)
- **Week 3:** Customer widget, escalation engine, handoff flow
- **Week 4:** Agent dashboard, notifications, audit trail
- **Week 5:** Lead qualification, HubSpot sync, final demo

