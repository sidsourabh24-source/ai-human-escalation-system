import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAgent, setToken } from "../../services/authApi";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

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
    <section className="card" style={{ maxWidth: '440px', margin: '40px auto', padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%', color: 'var(--accent-primary)', marginBottom: '16px' }}>
          <ShieldCheck size={32} />
        </div>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Agent Portal</h2>
        <p className="muted">Secure login to the escalation dashboard</p>
      </div>

      <div style={{ background: 'var(--bubble-agent)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px', fontSize: '13px', margin: '20px 0', color: 'var(--text)' }}>
        <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#059669' }}>
          <Lock size={14} /> Demo Credentials
        </strong>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
          <span className="muted">Email:</span> <code>agent@example.com</code>
          <span className="muted">Password:</span> <code>password123</code>
        </div>
      </div>
      
      {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: "#ef4444", padding: '12px', borderRadius: '8px', fontSize: "14px", margin: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {error}
      </div>}
      
      <form onSubmit={handleLogin} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Mail size={18} />
          </div>
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
            style={{ width: '100%', paddingLeft: '42px' }}
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Lock size={18} />
          </div>
          <input 
            type="password"
            id="agent-password"
            name="agent-password"
            autoComplete="new-password"
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', paddingLeft: '42px' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? "Authenticating..." : <><ArrowRight size={18} /> Access Dashboard</>}
        </button>
      </form>
    </section>
  );
}
