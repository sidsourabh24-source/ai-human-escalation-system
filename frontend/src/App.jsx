import ChatWidget from "./features/chat-widget/ChatWidget";
import AgentDashboard from "./features/agent-dashboard/AgentDashboard";

export default function App() {
  return (
    <main className="layout">
      <header>
        <h1>AI-to-Human Escalation and Lead Handoff</h1>
        <p>Professional MVP scaffold for college project implementation</p>
      </header>

      <div className="grid">
        <ChatWidget />
        <AgentDashboard />
      </div>
    </main>
  );
}
