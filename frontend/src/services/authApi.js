const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function loginAgent(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }
  
  const payload = await response.json();
  return payload.data;
}

export function getToken() {
  return localStorage.getItem("agent_token");
}

export function setToken(token) {
  localStorage.setItem("agent_token", token);
}

export function clearToken() {
  localStorage.removeItem("agent_token");
}
