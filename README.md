# 🤖 AI-to-Human Escalation & Lead Handoff System

> A full-stack, real-time system where an AI chatbot handles customer queries first, then seamlessly escalates to a live human agent when frustration, confusion, buying intent, or explicit escalation signals are detected.

---

## 🚀 Live Features

### Customer Side
- 💬 **AI Chat Widget** — Real-time conversations powered by **Claude AI (Anthropic)**
- 🧠 **Escalation Detection** — Automatically detects anger, confusion, buying intent, and manual requests
- ⏳ **Handoff States** — Dynamic badges (🤖 AI Active → ⏳ Handoff Pending → 👨‍💻 Agent Connected)
- 🔄 **Session Recovery** — Chat history persists across browser refreshes via `localStorage`
- ⚡ **Real-time Agent Replies** — Agent messages arrive instantly via WebSocket (Socket.io)

### Agent Side
- 🔐 **Secure Login** — JWT-authenticated agent login screen
- 📋 **Live Escalation Queue** — Auto-polls every 5s for new `handoff_pending` conversations
- 👁️ **Full Transcript View** — See the complete customer chat history when claiming
- 💬 **Bi-directional Chat** — Reply to customers in real-time via Socket.io
- 📌 **Session Persistence** — Active chat survives page refresh via `localStorage`
- 🚪 **Logout** — Securely clears JWT token and session

### Backend
- 🗄️ **MySQL Persistence** — All conversations, messages, and escalation signals stored in DB
- 📧 **Email Alerts** — Nodemailer sends escalation alerts to agent team (Ethereal for testing)
- 🛡️ **JWT Auth Middleware** — Protects all agent-facing API routes
- 📡 **Socket.io** — Real-time bidirectional event system for customer ↔ agent messaging
- 🤝 **Mocked HubSpot CRM** — Lead data captured and synced via mock adapter

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Socket.io Client |
| Backend | Node.js, Express.js, Socket.io |
| Database | MySQL 8 |
| AI | Anthropic Claude API (`claude-3-5-sonnet`) |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| Email | Nodemailer (Ethereal for dev, SMTP for prod) |
| Dev Tools | Vite, nodemon (`--watch`) |

---

## 📁 Project Structure

```
minor-2/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, env config
│   │   ├── controllers/    # Auth controller
│   │   ├── middleware/     # JWT protect middleware, error handler
│   │   ├── routes/         # chat, auth, agent, conversation routes
│   │   ├── services/       # Claude AI, email, conversation, lead logic
│   │   ├── sockets/        # Socket.io event handlers
│   │   ├── integrations/   # HubSpot CRM mock adapter
│   │   └── db/             # MySQL schema
│   └── scripts/            # Seed agent script
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── chat-widget/        # Customer chat UI
│       │   └── agent-dashboard/    # Agent login + dashboard
│       └── services/               # API clients (chat, agent, auth)
└── docs/                           # Roadmap, Kanban, backlog
```

---

## ⚙️ Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8 running locally
- Anthropic Claude API key

### 1. Clone & Install
```bash
git clone https://github.com/sidsourabh24-source/ai-human-escalation-system.git
cd ai-human-escalation-system
npm install
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Fill in: DB_USER, DB_PASS, DB_NAME, JWT_SECRET, CLAUDE_API_KEY
```

### 3. Set Up Database
```bash
# Run the schema in MySQL
mysql -u root -p ai_app < backend/src/db/schema.sql

# Seed the agent account
node backend/scripts/seedAgent.js
```

### 4. Run the App
```bash
# Terminal 1 - Backend
npm run dev -w backend

# Terminal 2 - Frontend
npm run dev -w frontend
```

### 5. Open in Browser
| URL | Description |
|---|---|
| `http://localhost:5173/` | Customer Chat Widget |
| `http://localhost:5173/agent` | Agent Login & Dashboard |

**Demo Agent Credentials:** `agent@example.com` / `password123`

---

## 📅 Module Progress

| Module | Description | Status |
|---|---|---|
| Week 1 | Repo setup, Kanban, scaffold, governance | ✅ Complete |
| Week 2 | Express APIs, MySQL schema, JWT auth, Claude AI | ✅ Complete |
| Week 3 | Chat widget, escalation engine, AI suppression, session recovery | ✅ Complete |
| Week 4 | Agent dashboard, live queue, claim flow, real-time messaging, email alerts | ✅ Complete |
| Week 5 | Lead pipeline refinement, analytics, final polish & demo | ✅ Complete |

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ❌ | Agent login, returns JWT |
| `POST` | `/api/chat/message` | ❌ | Send customer message, get AI reply |
| `GET` | `/api/conversations/:id/transcript` | ❌ | Fetch chat history |
| `GET` | `/api/agent/queue` | ✅ JWT | Get pending escalation queue |
| `POST` | `/api/agent/claim` | ✅ JWT | Claim a conversation |
| `GET` | `/api/health` | ❌ | Health check |

---

## 🔄 Escalation Flow

```
Customer sends message
        │
        ▼
  Claude classifies message
        │
        ├── No escalation → AI replies normally
        │
        └── Escalation detected →
              • Status: handoff_pending
              • Email alert sent to agent team
              • AI replies suppressed
              • Agent queue updated
                    │
                    ▼
              Agent logs in → Claims conversation
              • Status: agent_active
              • Transcript loaded
              • Real-time socket messaging begins
```

---

## 📄 License
MIT — Built as a college project.
