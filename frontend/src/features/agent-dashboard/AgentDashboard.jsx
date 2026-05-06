import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLiveQueue, claimConversation } from "../../services/agentApi";
import { fetchTranscript } from "../../services/chatApi";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:4000");

export default function AgentDashboard() {
  const [queue, setQueue] = useState([]);
  const [activeChat, setActiveChat] = useState(() => localStorage.getItem("agent_active_chat") || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const refreshQueue = async () => {
    try {
      const data = await fetchLiveQueue();
      setQueue(data);
    } catch (err) {
      if (err.message === "Unauthorized") {
        navigate("/agent/login");
      }
      console.error(err);
    }
  };

  // On mount, restore active chat session if one exists in localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem("agent_active_chat");
    if (savedChat) {
      fetchTranscript(savedChat)
        .then(data => {
          setMessages(data.messages || []);
          setActiveChat(savedChat);
        })
        .catch(err => {
          console.error("Failed to restore active chat:", err);
          localStorage.removeItem("agent_active_chat");
        });
    }
  }, []);

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeChat) {
      socket.emit("chat:join", { conversationId: activeChat });
      
      const handleUserMessage = (msg) => {
        setMessages((prev) => [...prev, { sender: "user", body: msg.message }]);
      };
      
      socket.on("chat:user-message", handleUserMessage);
      
      return () => {
        socket.off("chat:user-message", handleUserMessage);
      };
    }
  }, [activeChat]);

  const handleClaim = async (conversationId) => {
    try {
      await claimConversation(conversationId);
      const transcript = await fetchTranscript(conversationId);
      setMessages(transcript.messages || []);
      setActiveChat(conversationId);
      localStorage.setItem("agent_active_chat", conversationId);
      refreshQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !activeChat) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { sender: "agent", body: text }]);
    socket.emit("chat:agent-message", { conversationId: activeChat, message: text });
    setInput("");
  };

  if (activeChat) {
    return (
      <section className="card">
        <div className="card-header">
          <h2>Active Chat: {activeChat}</h2>
          <button onClick={() => {
            setActiveChat(null);
            setMessages([]);
            localStorage.removeItem("agent_active_chat");
          }}>Back to Queue</button>
        </div>
        
        <div className="chatWindow">
          {messages.map((message, index) => (
            <div key={`${message.sender}-${index}`} className={`bubble ${message.sender}`}>
              <strong>{message.sender}:</strong> {message.body}
            </div>
          ))}
        </div>

        <div className="row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Type your reply to customer..."
          />
          <button onClick={handleSend}>Send Reply</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <h2>Agent Dashboard</h2>
          <span className="badge agent_active">Live Queue: {queue.length}</span>
        </div>
        <button onClick={() => {
          localStorage.removeItem("agent_token");
          navigate("/agent/login");
        }} style={{background: 'transparent', color: '#dc3545', border: '1px solid #dc3545'}}>Logout</button>
      </div>

      {queue.length === 0 ? (
        <p className="muted" style={{marginTop: '1rem'}}>No pending escalations in queue.</p>
      ) : (
        queue.map((item) => (
          <article className="queueItem" key={item.conversationId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{item.conversationId}</h3>
              {item.status === 'agent_active' && <span className="badge agent_active" style={{ fontSize: '0.8rem' }}>In Progress</span>}
            </div>
            <p><strong>Reason:</strong> {item.reason}</p>
            <p><strong>Last message:</strong> {item.lastMessage}</p>
            <button onClick={() => handleClaim(item.conversationId)} style={{marginTop: '10px'}}>
              {item.status === 'agent_active' ? "Resume Conversation" : "Claim Conversation"}
            </button>
          </article>
        ))
      )}
    </section>
  );
}
