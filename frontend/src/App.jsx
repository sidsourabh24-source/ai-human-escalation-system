import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ChatWidget from "./features/chat-widget/ChatWidget";
import AgentDashboard from "./features/agent-dashboard/AgentDashboard";
import AgentLogin from "./features/agent-dashboard/AgentLogin";

export default function App() {
  return (
    <BrowserRouter>
      <main className="layout">
        <header>
          <h1>AI-to-Human Escalation System</h1>
          <nav style={{display: 'flex', gap: '16px', marginTop: '12px'}}>
            <Link to="/">Customer Desktop</Link>
            <Link to="/agent">Agent Desktop</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<div style={{maxWidth: '500px', margin: '0 auto'}}><ChatWidget /></div>} />
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/agent/login" element={<AgentLogin />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
