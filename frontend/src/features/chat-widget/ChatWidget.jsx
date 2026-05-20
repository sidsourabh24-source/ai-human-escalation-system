import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { sendChatMessage, fetchTranscript } from "../../services/chatApi";
import { Bot, User, Headphones, SendHorizontal, Loader2, Sparkles, Clock, CheckCircle2, CheckCheck } from "lucide-react";
import io from "socket.io-client";
import WelcomeModal from "./WelcomeModal";

const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:4000");

function newConversationId() {
  return `conv-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatWidget() {
  const [conversationId] = useState(() => {
    return localStorage.getItem("chat_conv_id") || newConversationId();
  });

  // Feature 5: Customer identity from localStorage (set by WelcomeModal)
  const [customerName, setCustomerName] = useState(() => localStorage.getItem("customer_name") || "");
  const [customerEmail] = useState(() => localStorage.getItem("customer_email") || "");

  // Show WelcomeModal only if customer hasn't set a name yet
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("customer_name"));

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "assistant", body: "Hi, I am Nexus AI. How can I help you today?" }
  ]);
  const [status, setStatus] = useState("ai_active");
  const [agentTyping, setAgentTyping] = useState(false);    // Feature 3
  const [isResolved, setIsResolved] = useState(false);       // Feature 1
  const scrollRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Auto-scroll to bottom whenever messages or typing indicator changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentTyping]);

  useEffect(() => {
    localStorage.setItem("chat_conv_id", conversationId);

    // Session recovery
    fetchTranscript(conversationId)
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        if (data.status) {
          setStatus(data.status);
          if (data.status === "resolved") setIsResolved(true);
        }
      })
      .catch(err => console.error("Session recovery failed:", err));

    socket.emit("chat:join", { conversationId });

    // Feature 3: Agent typing indicator
    const handleAgentTyping = ({ isTyping }) => {
      setAgentTyping(isTyping);
      // Safety: clear typing indicator after 3s if no stop event arrives
      if (isTyping) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setAgentTyping(false), 3000);
      }
    };

    const handleAgentMessage = (msg) => {
      setAgentTyping(false); // Stop typing indicator when actual message arrives
      clearTimeout(typingTimerRef.current);
      setMessages(prev => [...prev, { sender: "agent", body: msg.message }]);
      setStatus("agent_active");
    };

    // Feature 1: Chat resolved by agent
    const handleResolved = () => {
      setIsResolved(true);
      setStatus("resolved");
      setMessages(prev => [...prev, {
        sender: "assistant",
        body: "✅ This conversation has been resolved. Thank you for contacting us! Start a new chat if you need further help."
      }]);
    };

    socket.on("chat:agent-typing", handleAgentTyping);
    socket.on("chat:agent-message", handleAgentMessage);
    socket.on("chat:resolved", handleResolved);

    return () => {
      socket.off("chat:agent-typing", handleAgentTyping);
      socket.off("chat:agent-message", handleAgentMessage);
      socket.off("chat:resolved", handleResolved);
      clearTimeout(typingTimerRef.current);
    };
  }, [conversationId]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading && !isResolved,
    [input, loading, isResolved]
  );

  // Feature 5: Handle welcome modal completion
  const handleWelcomeComplete = useCallback(({ name }) => {
    setCustomerName(name);
    setShowWelcome(false);
  }, []);

  async function onSend() {
    if (!canSend) return;

    const text = input.trim();
    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, { sender: "user", body: text }]);

    try {
      const result = await sendChatMessage({
        conversationId,
        message: text,
        senderName: customerName || null,
        senderEmail: customerEmail || null
      });

      if (result.assistantReply) {
        setMessages(prev => [...prev, { sender: "assistant", body: result.assistantReply }]);
      }

      if (status !== "agent_active" && (result.escalation?.shouldEscalate || status === "handoff_pending")) {
        setStatus("handoff_pending");
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { sender: "assistant", body: "Something went wrong. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Status badge content
  const statusBadge = {
    ai_active: <><Sparkles size={14} /> AI Active</>,
    handoff_pending: <><Clock size={14} /> Connecting to Agent…</>,
    agent_active: <><CheckCircle2 size={14} /> Agent Connected</>,
    resolved: <><CheckCheck size={14} /> Resolved</>
  }[status] || <><Sparkles size={14} /> AI Active</>;

  return (
    <>
      {/* Feature 5: Welcome Modal overlay */}
      {showWelcome && <WelcomeModal onComplete={handleWelcomeComplete} />}

      <section className="card">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center gap-2">
            <h2>Customer Support</h2>
            {customerName && (
              <span className="customer-name-chip">
                <User size={12} /> {customerName}
              </span>
            )}
          </div>
          <span className={`badge ${status}`}>
            {statusBadge}
          </span>
        </div>

        {/* Chat Window */}
        <div className="chatWindow" ref={scrollRef}>
          {messages.map((message, index) => (
            <div key={`${message.sender}-${index}`} className={`bubble-container ${message.sender}`}>
              <div className="bubble-header">
                {message.sender === "assistant" && <Bot size={14} />}
                {message.sender === "agent" && <Headphones size={14} />}
                {message.sender === "user" && <User size={14} />}
                <span>
                  {message.sender === "assistant" ? "Nexus AI"
                    : message.sender === "agent" ? "Support Agent"
                    : customerName || "You"}
                </span>
              </div>
              <div className="bubble">
                {message.body}
              </div>
            </div>
          ))}

          {/* AI Loading bubble */}
          {loading && (
            <div className="bubble-container assistant">
              <div className="bubble-header">
                <Bot size={14} /> <span>Nexus AI</span>
              </div>
              <div className="bubble flex items-center gap-2">
                <Loader2 size={16} className="lucide-spin animate-spin" /> Typing…
              </div>
            </div>
          )}

          {/* Feature 3: Agent Typing Indicator */}
          {agentTyping && !loading && (
            <div className="bubble-container agent">
              <div className="bubble-header">
                <Headphones size={14} /> <span>Support Agent</span>
              </div>
              <div className="bubble typing-indicator-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        {/* Input Row */}
        {isResolved ? (
          <div className="resolved-notice">
            <CheckCheck size={18} />
            <span>Conversation resolved. <button className="btn-link" onClick={() => {
              localStorage.removeItem("chat_conv_id");
              localStorage.removeItem("customer_name");
              localStorage.removeItem("customer_email");
              window.location.reload();
            }}>Start new chat</button></span>
          </div>
        ) : (
          <div className="row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSend();
              }}
              placeholder={status === "handoff_pending" ? "Waiting for agent…" : "Type your message…"}
              disabled={loading || isResolved}
            />
            <button id="chat-send-btn" onClick={onSend} disabled={!canSend}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><SendHorizontal size={18} /> Send</>}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
