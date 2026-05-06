import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAgent, setToken } from "../../services/authApi";

export default function AgentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginAgent(email, password);
      setToken(data.token);
      navigate("/agent");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card" style={{ maxWidth: '400px', margin: '40px auto' }}>
      <h2>Agent Login</h2>
      <p className="muted">Please log in to access the dashboard.</p>

      <div style={{ background: '#edf2ff', border: '1px solid #cce0ff', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', margin: '12px 0' }}>
        <strong>Demo Credentials:</strong><br />
        Email: <code>agent@example.com</code><br />
        Password: <code>password123</code>
      </div>
      
      {error && <p style={{ color: "red", fontSize: "14px", margin: '8px 0' }}>{error}</p>}
      
      <form onSubmit={handleLogin} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
        <input 
          type="email"
          id="agent-email"
          name="agent-email"
          autoComplete="off"
          placeholder="Email address" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
        <input 
          type="password"
          id="agent-password"
          name="agent-password"
          autoComplete="new-password"
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
}
