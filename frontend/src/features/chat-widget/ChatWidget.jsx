import { useMemo, useState } from "react";
import { sendChatMessage } from "../../services/chatApi";

function newConversationId() {
  return `conv-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatWidget() {
  const [conversationId] = useState(newConversationId());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "assistant", body: "Hi, I am your AI assistant. How can I help?" }
  ]);
  const [status, setStatus] = useState("AI active");

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

      if (result.escalation?.shouldEscalate) {
        setStatus("Handoff pending");
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
      <h2>Customer Chat Widget</h2>
      <p className="muted">Conversation: {conversationId}</p>
      <p className="status">Status: {status}</p>

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
