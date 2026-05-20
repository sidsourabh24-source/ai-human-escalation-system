import { useState } from "react";
import { User, Mail, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

/**
 * WelcomeModal — Feature 5: Customer Name Collection
 * Shown once on first visit. Collects name (required) and email (optional).
 * Saves to localStorage. Dismissed only after name is provided.
 */
export default function WelcomeModal({ onComplete }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name to continue.");
      return;
    }
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    localStorage.setItem("customer_name", trimmedName);
    if (trimmedEmail) localStorage.setItem("customer_email", trimmedEmail);
    onComplete({ name: trimmedName, email: trimmedEmail || null });
  };

  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        {/* Header */}
        <div className="welcome-modal-header">
          <div className="welcome-modal-icon">
            <Sparkles size={28} />
          </div>
          <h2 id="welcome-title">Welcome to Support</h2>
          <p>Before we start, please tell us a bit about yourself so our team can assist you better.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="welcome-modal-form" autoComplete="off">
          <div className="welcome-field">
            <label htmlFor="customer-name" className="welcome-label">
              <User size={15} /> Your Name <span className="welcome-required">*</span>
            </label>
            <input
              id="customer-name"
              type="text"
              placeholder="e.g. Sarah Johnson"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              maxLength={150}
              autoFocus
              style={{ width: "100%" }}
            />
          </div>

          <div className="welcome-field">
            <label htmlFor="customer-email" className="welcome-label">
              <Mail size={15} /> Email <span className="welcome-optional">(optional)</span>
            </label>
            <input
              id="customer-email"
              type="email"
              placeholder="e.g. sarah@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={190}
              style={{ width: "100%" }}
            />
          </div>

          {error && (
            <p className="welcome-error" role="alert">{error}</p>
          )}

          <button type="submit" id="welcome-submit-btn" style={{ width: "100%", marginTop: "8px" }}>
            <MessageSquare size={18} />
            Start Chat
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
