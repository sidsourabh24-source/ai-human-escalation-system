import { useMemo, useState, useEffect, useRef } from "react";
import { sendChatMessage, fetchTranscript } from "../../services/chatApi";
import { Bot, User, Headphones, SendHorizontal, Loader2, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:4000");

function newConversationId() {
  return `conv-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatWidget() {
  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem("chat_conv_id") || newConversationId();
  });
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "assistant", body: "Hi, I am Nexus AI. How can I help you today?" }
  ]);
  const [status, setStatus] = useState("ai_active");
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chat_conv_id", conversationId);
    
    // Attempt session recovery
    fetchTranscript(conversationId)
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        if (data.status) {
          setStatus(data.status);
        }
      })
      .catch(err => console.error("Session recovery failed:", err));

    socket.emit("chat:join", { conversationId });

    const handleAgentMessage = (msg) => {
      setMessages(prev => [...prev, { sender: "agent", body: msg.message }]);
      setStatus("agent_active");
    };

    socket.on("chat:agent-message", handleAgentMessage);

    return () => {
      socket.off("chat:agent-message", handleAgentMessage);
    };
  }, [conversationId]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function onSend() {
    if (!canSend) return;

    const text = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { sender: "user", body: text }]);

    try {
      const result = await sendChatMessage({ conversationId, message: text });
      
      if (result.assistantReply) {
        setMessages((prev) => [...prev, { sender: "assistant", body: result.assistantReply }]);
      }

      if (status !== "agent_active" && (result.escalation?.shouldEscalate || status === "handoff_pending")) {
        setStatus("handoff_pending");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", body: "Something went wrong. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <h2>Customer Support</h2>
        </div>
        <span className={`badge ${status}`}>
          {status === "ai_active" && <><Sparkles size={14} /> AI Active</>}
          {status === "handoff_pending" && <><Clock size={14} /> Handoff Pending</>}
          {status === "agent_active" && <><CheckCircle2 size={14} /> Agent Connected</>}
        </span>
      </div>
      <p className="muted mb-4">Session ID: {conversationId}</p>

      <div className="chatWindow" ref={scrollRef}>
        {messages.map((message, index) => (
          <div key={`${message.sender}-${index}`} className={`bubble-container ${message.sender}`}>
            <div className="bubble-header">
              {message.sender === "assistant" && <Bot size={14} />}
              {message.sender === "agent" && <Headphones size={14} />}
              {message.sender === "user" && <User size={14} />}
              <span>{message.sender === "assistant" ? "Nexus AI" : message.sender === "agent" ? "Support Agent" : "You"}</span>
            </div>
            <div className="bubble">
              {message.body}
            </div>
          </div>
        ))}
        {loading && (
          <div className="bubble-container assistant">
            <div className="bubble-header">
              <Bot size={14} /> <span>Nexus AI</span>
            </div>
            <div className="bubble flex items-center gap-2">
              <Loader2 size={16} className="lucide-spin animate-spin" /> Typing...
            </div>
          </div>
        )}
      </div>

      <div className="row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSend();
          }}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={onSend} disabled={!canSend}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <><SendHorizontal size={18} /> Send</>}
        </button>
      </div>
    </section>
  );
}
