import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Moon, Sun, MonitorSmartphone, Headphones } from "lucide-react";
import ChatWidget from "./features/chat-widget/ChatWidget";
import AgentDashboard from "./features/agent-dashboard/AgentDashboard";
import AgentLogin from "./features/agent-dashboard/AgentLogin";

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <BrowserRouter>
      <main className="layout">
        <header className="header">
          <div>
            <h1>Nexus AI</h1>
            <p className="muted" style={{ marginTop: '4px' }}>Intelligent Escalation System</p>
            <nav className="nav-links" style={{ marginTop: '16px' }}>
              <Link to="/" className="nav-link" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <MonitorSmartphone size={18} /> Customer Desktop
              </Link>
              <Link to="/agent" className="nav-link" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Headphones size={18} /> Agent Desktop
              </Link>
            </nav>
          </div>
          
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
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
