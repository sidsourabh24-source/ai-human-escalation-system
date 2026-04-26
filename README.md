# AI-to-Human Escalation and Lead Handoff System

A professional full-stack college project where an AI chatbot handles user queries first, then escalates to a human agent when frustration, confusion, buying intent, or explicit human-request signals are detected.

## Tech Stack
- React.js
- Node.js + Express
- Socket.io
- MySQL
- Claude API
- Nodemailer

## Module Plan (Week-wise)
- Week 1 (Module 1): Setup, repo governance, Kanban, roadmap, scaffold
- Week 2 (Module 2): Backend APIs, DB schema, auth, Claude integration
- Week 3 (Module 3): Customer widget, escalation engine, handoff flow
- Week 4 (Module 4): Agent dashboard, notifications, audit trail
- Week 5 (Module 5): Lead qualification, mocked HubSpot sync, hardening, final demo

## Project Structure
- frontend: React app for customer widget and agent dashboard
- backend: Express + Socket.io services and escalation logic
- docs: Roadmap and Kanban board setup guide
- .github: Issue templates for professional task tracking

## GitHub Project Management
- Kanban setup checklist: docs/github-kanban-checklist.md
- Week-wise roadmap checklist: docs/roadmap-checklist.md
- Backlog issue list: docs/github-issue-backlog.md
- Milestone roadmap summary: docs/roadmap.md
- Board/label guide: docs/kanban-setup.md

## Quick Start
1. Install dependencies:
   - npm install
2. Configure environment files:
   - copy backend/.env.example to backend/.env
   - copy frontend/.env.example to frontend/.env
3. Start backend:
   - npm run dev -w backend
4. Start frontend (new terminal):
   - npm run dev -w frontend

## MVP Scope (Current)
- AI-assisted chat endpoint
- Escalation signal detection
- Mocked CRM sync adapter
- Agent dashboard UI skeleton
- Email service hook placeholder

## Next Delivery Targets
- Real Claude API call integration
- JWT auth endpoints and protected routes
- Persistent message storage in MySQL
- Live agent handoff and queue ownership
- Basic analytics panel
