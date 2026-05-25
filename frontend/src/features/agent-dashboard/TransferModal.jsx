import { useState, useEffect, useCallback } from "react";
import { fetchOnlineAgents, transferChat } from "../../services/agentApi";
import {
  ArrowRightLeft, User, Loader2, AlertCircle, CheckCircle2, X
} from "lucide-react";

/**
 * TransferModal
 * Props:
 *   conversationId  – the active conversation to transfer
 *   onClose         – called when the modal is dismissed without action
 *   onTransferred   – called after a successful transfer
 */
export default function TransferModal({ conversationId, onClose, onTransferred }) {
  const [agents,        setAgents]        = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [note,          setNote]          = useState("");
  const [isFetching,    setIsFetching]    = useState(true);
  const [isTransferring,setIsTransferring]= useState(false);
  const [error,         setError]         = useState("");

  // Load the list of online agents when the modal opens
  const loadAgents = useCallback(async () => {
    try {
      setIsFetching(true);
      setError("");
      const data = await fetchOnlineAgents();
      setAgents(data);
    } catch {
      setError("Could not load online agents. Please try again.");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleTransfer = async () => {
    if (!selectedEmail || isTransferring) return;
    setIsTransferring(true);
    setError("");
    try {
      await transferChat(conversationId, selectedEmail, note.trim() || null);
      onTransferred(selectedEmail); // hand control back to parent
    } catch (err) {
      setError(err.message || "Transfer failed. Please try again.");
      setIsTransferring(false);
    }
  };

  return (
    <div className="transfer-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title">
      {/* Backdrop click closes */}
      <div className="transfer-modal-backdrop" onClick={onClose} />

      <div className="transfer-modal">
        {/* Header */}
        <div className="transfer-modal-header">
          <div className="transfer-modal-title-group">
            <span className="transfer-modal-icon">
              <ArrowRightLeft size={20} />
            </span>
            <h2 id="transfer-modal-title">Transfer Conversation</h2>
          </div>
          <button className="transfer-close-btn" onClick={onClose} aria-label="Close transfer modal">
            <X size={18} />
          </button>
        </div>

        <p className="transfer-modal-sub">
          Select an online agent to hand off this conversation.
        </p>

        {/* Error Banner */}
        {error && (
          <div className="transfer-error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Agent List */}
        <div className="transfer-agents-section">
          <p className="transfer-section-label">Online Agents</p>

          {isFetching ? (
            <div className="transfer-loading">
              <Loader2 size={20} className="animate-spin" />
              <span>Loading agents…</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="transfer-empty-state">
              <User size={36} />
              <p>No other agents are currently online.</p>
              <span>Ask a colleague to log in, then try again.</span>
              <button className="btn-outline transfer-refresh-btn" onClick={loadAgents}>
                Refresh
              </button>
            </div>
          ) : (
            <ul className="transfer-agents-list" role="listbox">
              {agents.map((agent) => (
                <li
                  key={agent.agentEmail}
                  role="option"
                  aria-selected={selectedEmail === agent.agentEmail}
                  className={`transfer-agent-card ${selectedEmail === agent.agentEmail ? "selected" : ""}`}
                  onClick={() => setSelectedEmail(agent.agentEmail)}
                  id={`transfer-agent-${agent.agentEmail.replace(/[@.]/g, "-")}`}
                >
                  <span className="transfer-agent-avatar">
                    {(agent.agentName || agent.agentEmail)[0].toUpperCase()}
                  </span>
                  <div className="transfer-agent-info">
                    <span className="transfer-agent-name">{agent.agentName || agent.agentEmail}</span>
                    <span className="transfer-agent-email">{agent.agentEmail}</span>
                  </div>
                  {selectedEmail === agent.agentEmail && (
                    <CheckCircle2 size={18} className="transfer-agent-check" />
                  )}
                  <span className="transfer-online-dot" aria-hidden="true" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Handoff Note */}
        {agents.length > 0 && !isFetching && (
          <div className="transfer-note-section">
            <label className="transfer-section-label" htmlFor="transfer-note-input">
              Handoff Note <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
            </label>
            <textarea
              id="transfer-note-input"
              className="transfer-note-textarea"
              placeholder="e.g. Customer is a premium member. Issue is about billing."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <span className="transfer-note-counter">{note.length}/500</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="transfer-modal-actions">
          <button
            className="btn-outline"
            onClick={onClose}
            disabled={isTransferring}
            id="transfer-cancel-btn"
          >
            Cancel
          </button>
          <button
            className="btn-transfer-confirm"
            onClick={handleTransfer}
            disabled={!selectedEmail || isTransferring || isFetching}
            id="transfer-confirm-btn"
          >
            {isTransferring ? (
              <><Loader2 size={16} className="animate-spin" /> Transferring…</>
            ) : (
              <><ArrowRightLeft size={16} /> Transfer Chat</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
