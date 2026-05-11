import { getToken } from "./authApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchLiveQueue() {
  const response = await fetch(`${API_BASE}/api/agent/queue`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch queue");
  }
  const payload = await response.json();
  return payload.data;
}

export async function claimConversation(conversationId) {
  const response = await fetch(`${API_BASE}/api/agent/claim`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ conversationId })
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to claim conversation");
  }
  return response.json();
}

export async function fetchAnalytics() {
  const response = await fetch(`${API_BASE}/api/agent/analytics`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch analytics");
  }
  const payload = await response.json();
  return payload.data;
}

export async function fetchConversationSummary(conversationId) {
  const response = await fetch(`${API_BASE}/api/agent/conversations/${conversationId}/summary`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch conversation summary");
  }
  const payload = await response.json();
  return payload.data;
}
