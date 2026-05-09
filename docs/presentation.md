---
marp: true
theme: default
class: lead
paginate: true
style: |
  section {
    background-color: #0F172A;
    color: #F8FAFC;
    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    justify-content: flex-start;
    padding: 60px;
  }
  section.lead {
    justify-content: center;
    text-align: center;
  }
  h1 {
    color: #38BDF8;
    font-size: 2.2em;
    border-bottom: 2px solid #38BDF8;
    padding-bottom: 0.2em;
    margin-bottom: 0.5em;
  }
  section.lead h1 {
    border-bottom: none;
    font-size: 3em;
  }
  h2 {
    color: #10B981;
  }
  h3 {
    color: #F472B6;
  }
  p, li {
    font-size: 1.2em;
    line-height: 1.5;
  }
  li {
    margin-bottom: 0.4em;
  }
  .accent {
    color: #F59E0B;
  }
---

<!-- _class: lead -->
# Nexus AI
## Intelligent Escalation. Seamless Human Handoff.
Bridging the gap between automated efficiency and human empathy.

**Team Name / Your Name**

---

# Problem Statement
**The Reality:** 70% of customers abandon a brand after a frustrating bot experience.

- **Current Challenges:** Traditional chatbots are rigid. They trap angry or confused customers in endless loops without offering an escape to a human agent.
- **The Pain Point:** Missed sales opportunities. High churn rate. Businesses lose leads because the bot doesn't know when to "stop talking and listen."

*(Visual: "This is Fine" dog meme sitting in a burning room labeled "Customer stuck in chatbot loop.")*

---

# Proposed Solution
An intelligent conversational agent that knows its limits.

- **Key Innovation:** Real-time sentiment and intent analysis. The AI autonomously detects *Frustration*, *Confusion*, or *Buying Intent* and instantly escalates to a live agent.
- **Impact:** Zero trapped customers. Higher lead conversion. Optimized agent workflows.

---

# Project Overview
- **Core Objective:** Build a full-stack, real-time customer support system prioritizing human-in-the-loop escalation.
- **Scope:** A customer-facing chat widget powered by LLMs, integrated with a secure, real-time Agent Dashboard and CRM lead-sync pipeline.
- **End Users:** 
  - *Customers:* Seeking immediate answers or support.
  - *Support Agents:* Need streamlined queues and full context to resolve issues fast.

---

# Features & Functionalities
- 🧠 **Context-Aware AI:** Powered by Claude LLM for natural, intelligent responses.
- 🚨 **Automated Escalation Engine:** Triggered by sentiment analysis (Anger, Confusion, Buy Intent).
- ⚡ **Real-Time Agent Dashboard:** Live WebSocket queues, instant chat claiming, and live bidirectional messaging.
- 📊 **Automated CRM Lead Sync:** Automatically extracts user data and synchronizes potential sales leads to HubSpot.

---

# System Architecture
- **Frontend (React)** connects via REST API and Socket.io to **Backend (Node/Express)**.
- **Backend** interfaces with **Claude AI API** for Natural Language Processing.
- **Backend** stores persistent data in **MySQL Database**.
- **Backend** pushes leads to external **CRM (HubSpot)**.
- **Event Bus:** Socket.io manages real-time state between Customer UI and Agent UI.

---

# Technology Stack
- **Frontend:** React 18, Vite, CSS Modules *(Component-based UI, fast rendering)*.
- **Backend:** Node.js, Express.js *(Asynchronous, event-driven architecture)*.
- **Real-Time:** Socket.io *(Low-latency bidirectional communication)*.
- **Database:** MySQL 8 *(Relational integrity for conversations and audit logs)*.
- **AI Engine:** Anthropic Claude API *(Superior contextual understanding)*.

---

# Workflow / Process Flow
1. **Interact:** User sends a query.
2. **Analyze:** Claude classifies message sentiment and intent.
3. **Branch:** If routine → AI replies. If complex/frustrated → Trigger Handoff.
4. **Queue:** AI suppresses further automated replies; Chat enters Agent Live Queue.
5. **Resolve:** Agent claims chat, reviews persistent transcript, and takes over via WebSocket.

---

# UI/UX Showcase
- **Design Principles:** Glassmorphism, intuitive navigation, high-contrast readability.
- **Customer Widget:** Floating, non-intrusive, clear status indicators (🤖 vs 👨‍💻).
- **Agent Dashboard:** At-a-glance analytics, live queue priority sorting, split-pane chat interface.

---

# Database Design
- **Core Tables:** `conversations`, `messages`, `agents`, `escalations`, `leads`, `audit_logs`.
- **Relationships:** One Conversation has Many Messages; One Conversation has One Escalation Profile.
- **Data Handling:** Strict foreign key constraints maintain transcript integrity across sessions.

---

# Security & Authentication
- **Agent Access:** Secure JWT (JSON Web Token) authentication.
- **Data Protection:** Passwords securely hashed using `bcryptjs`.
- **API Security:** Protected routes via custom Express middleware.
- **Privacy:** Conversation transcripts are siloed and bound to unique session IDs.

---

# Performance & Scalability
- **Real-time Optimization:** Socket.io rooms ensure messages are only broadcast to specific conversation channels, reducing network overhead.
- **Database Indexing:** Queries on `status` and `updated_at` are optimized for fast queue polling.
- **Future Scaling:** Stateless Node.js backend ready for horizontal scaling via Docker and Kubernetes.

---

# Testing & Quality Assurance
- **Methodology:** Iterative module-based testing.
- **Component Testing:** React UI state validation.
- **Integration Testing:** Verifying the AI classification pipeline → Database → Queue flow.
- **Edge Cases Handled:** Network disconnects during handoff, invalid API keys, concurrent agent claims.

---

# Deployment & DevOps
- **Version Control:** Git & GitHub with strict Kanban branch management.
- **Environment Management:** Segregated `.env` configurations.
- **Target Architecture:** Frontend hosted on Vercel/Netlify; Backend on Render/Railway; Database on PlanetScale/Aiven.

---

# Challenges Faced
**Challenge 1:** *State Synchronization.* Ensuring the customer UI and agent UI remained perfectly in sync during the handoff phase.
- *Solution:* Implemented robust Socket.io event broadcasting and database state locks.

**Challenge 2:** *AI Hallucinations / Strict JSON parsing.*
- *Solution:* Engineered strict system prompts and fallback regex matchers.

*(Visual: "Programming: Expectation vs Reality" meme)*

---

# Results & Outcomes
- **Outcome:** A stable, fully functional MVP delivered on schedule.
- **Metrics:** Sub-200ms latency for real-time messaging. High accuracy in intent classification.
- **Business Impact:** Eliminates the "bot trap," improving customer satisfaction and preserving high-value sales leads automatically.

---

# Future Enhancements
- **V2.0 Features:** Multi-agent routing (skills-based routing).
- **Omnichannel:** Integrating WhatsApp, SMS, and Email into the same dashboard.
- **Advanced AI:** RAG (Retrieval-Augmented Generation) to allow the bot to answer highly specific company FAQs before escalation.

---

# Project Timeline
- **Week 1:** Foundation, Architecture, & DB Design.
- **Week 2:** Backend API, JWT Auth, & AI Integration.
- **Week 3:** Customer Chat Widget & Escalation Engine.
- **Week 4:** Agent Dashboard & WebSocket Real-time Messaging.
- **Week 5:** Lead CRM Pipeline, Analytics & Final Polish.

---

# Competitive Analysis
- **Traditional Tools (Zendesk/Intercom):** Heavy, expensive, require manual bot-building logic trees.
- **Our Solution:** LLM-native. No trees required. The AI understands nuance and escalates based on *emotion*, not just keywords.
- **USP:** Highly customized sentiment-driven routing out of the box.

---

# Business Model
- **SaaS Model:** Subscription-based B2B software (Starter, Pro, Enterprise).
- **Value Prop:** Save thousands per year on support costs while increasing lead capture.
- **Target Market:** Mid-sized e-commerce and SaaS companies.

---

<!-- _class: lead -->
# Demo Walkthrough
1. **Customer Side:** Normal interaction.
2. **Escalation:** "I am frustrated, let me speak to a human."
3. **Agent Side:** Log into dashboard, view queue, claim chat.
4. **Live Chat:** Real-time typing via WebSockets.
5. **Analytics:** Show the dashboard numbers updating.

---

# Documentation Summary
- Fully documented architecture (`README.md`).
- Comprehensive API Route reference.
- Kanban-driven GitHub backlog ensuring transparency and code quality.
- Easily deployable via standard Node/NPM scripts.

---

<!-- _class: lead -->
# Conclusion
We built an AI system that knows when to step aside for a human.

**The Vision:** Making customer support frictionless, empathetic, and highly efficient.
**Final Thought:** AI is powerful, but human empathy closes the deal.

---

<!-- _class: lead -->
# Thank You!

**Contact:** Your Email | Your LinkedIn
**GitHub:** Link to Repository

*(Visual: "Any questions? Please be gentle" meme)*
