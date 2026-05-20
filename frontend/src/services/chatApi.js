const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// Feature 5: senderName + senderEmail passed on every message for customer identity
export async function sendChatMessage({ conversationId, message, senderName, senderEmail }) {
  const response = await fetch(`${API_BASE}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message, senderName, senderEmail })
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  const payload = await response.json();
  return payload.data;
}

export async function fetchTranscript(conversationId) {
  const response = await fetch(`${API_BASE}/api/conversations/${conversationId}/transcript`);
  if (!response.ok) {
    throw new Error("Failed to fetch transcript");
  }
  const payload = await response.json();
  return payload.data;
}
