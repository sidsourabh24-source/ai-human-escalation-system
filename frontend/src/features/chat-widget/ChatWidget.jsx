import { useMemo, useState, useEffect } from "react";
import { sendChatMessage, fetchTranscript } from "../../services/chatApi";

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
    { sender: "assistant", body: "Hi, I am your AI assistant. How can I help?" }
  ]);
  const [status, setStatus] = useState("ai_active");

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
      setMessages((prev) => [...prev, { sender: "assistant", body: result.assistantReply }]);

      if (result.escalation?.shouldEscalate || status === "handoff_pending" || status === "agent_active") {
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
        <h2>Customer Chat Widget</h2>
        <span className={`badge ${status}`}>
          {status === "ai_active" && "🤖 AI Active"}
          {status === "handoff_pending" && "⏳ Handoff Pending"}
          {status === "agent_active" && "👨‍💻 Agent Connected"}
        </span>
      </div>
      <p className="muted">Conversation: {conversationId}</p>

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
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message"
        />
        <button onClick={onSend} disabled={!canSend}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </section>
  );
}
