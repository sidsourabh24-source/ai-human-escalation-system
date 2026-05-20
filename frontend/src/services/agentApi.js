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
    if (response.status === 409) {
      const data = await response.json();
      throw new Error(data.message || "Conversation already claimed by another agent");
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

// Feature 1: Resolve conversation
export async function resolveConversation(conversationId) {
  const response = await fetch(`${API_BASE}/api/agent/conversations/${conversationId}/resolve`, {
    method: "POST",
    headers: getHeaders()
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to resolve conversation");
  }
  return response.json();
}

// Feature 6: Fetch audit logs
export async function fetchAuditLogs(conversationId) {
  const response = await fetch(`${API_BASE}/api/agent/conversations/${conversationId}/audit`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch audit logs");
  }
  const payload = await response.json();
  return payload.data;
}

// History: Fetch resolved escalation history with optional search and pagination
export async function fetchHistory({ page = 1, search = "" } = {}) {
  const params = new URLSearchParams({ page, limit: 20, search });
  const response = await fetch(`${API_BASE}/api/agent/history?${params}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch history");
  }
  const payload = await response.json();
  return payload.data;
}

