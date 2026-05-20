import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchLiveQueue,
  claimConversation,
  fetchAnalytics,
  fetchConversationSummary,
  resolveConversation,
  fetchAuditLogs,
  fetchHistory
} from "../../services/agentApi";
import { fetchTranscript } from "../../services/chatApi";
import {
  Bot, User, Headphones, SendHorizontal, LogOut, ArrowLeft,
  Inbox, MessageSquare, BarChart3, AlertCircle, Users,
  CheckCheck, Lock, ChevronDown, ChevronUp, ClipboardList,
  CheckCircle2, Clock, Sparkles, History, Search
} from "lucide-react";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:4000");

// Helper: format timestamp relative to now
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Helper: get current agent email from JWT stored in localStorage
function getCurrentAgentEmail() {
  try {
    const token = localStorage.getItem("agent_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email || null;
  } catch {
    return null;
  }
}

export default function AgentDashboard() {
  const [queue, setQueue] = useState([]);
  const [activeChat, setActiveChat] = useState(() => localStorage.getItem("agent_active_chat") || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [claimError, setClaimError] = useState("");      // Feature 4: double-claim error
  const [activeCustomerName, setActiveCustomerName] = useState(null);

  // History state
  const [activeTab, setActiveTab] = useState("queue");
  const [historyData, setHistoryData] = useState({ conversations: [], totalPages: 1, page: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const currentAgentEmail = getCurrentAgentEmail();

  // ─── Summary ───────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async (cid) => {
    try {
      setIsSummaryLoading(true);
      const data = await fetchConversationSummary(cid);
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  // Feature 6: Audit log loader
  const loadAuditLogs = useCallback(async (cid) => {
    try {
      setIsAuditLoading(true);
      const logs = await fetchAuditLogs(cid);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

  // ─── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── Queue refresh ─────────────────────────────────────────────────────────
  const refreshQueue = useCallback(async () => {
    try {
      const data = await fetchLiveQueue();
      setQueue(data);
      const stats = await fetchAnalytics();
      setAnalytics(stats);
    } catch (err) {
      if (err.message === "Unauthorized") navigate("/agent/login");
      console.error(err);
    }
  }, [navigate]);

  // ─── History refresh ───────────────────────────────────────────────────────
  const loadHistory = useCallback(async (page = 1, search = "") => {
    try {
      setIsHistoryLoading(true);
      const data = await fetchHistory({ page, search });
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory(historyData.page, searchQuery);
    }
  }, [activeTab, loadHistory, historyData.page]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setHistoryData(prev => ({ ...prev, page: 1 }));
      loadHistory(1, value);
    }, 500);
  };

  // ─── Restore active chat on mount ─────────────────────────────────────────
  useEffect(() => {
    const savedChat = localStorage.getItem("agent_active_chat");
    if (savedChat) {
      fetchTranscript(savedChat)
        .then(data => {
          setMessages(data.messages || []);
          setActiveChat(savedChat);
          setActiveCustomerName(data.customerName || null);
          if (data.status === "resolved") setIsResolved(true);
          loadSummary(savedChat);
          loadAuditLogs(savedChat);
        })
        .catch(err => {
          console.error("Failed to restore active chat:", err);
          localStorage.removeItem("agent_active_chat");
        });
    }
  }, [loadSummary, loadAuditLogs]);

  // ─── Initial queue load + queue:update socket ──────────────────────────────
  useEffect(() => {
    refreshQueue();
    socket.on("queue:update", refreshQueue);
    return () => socket.off("queue:update", refreshQueue);
  }, [refreshQueue]);

  // ─── Active chat socket events ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeChat) return;

    socket.emit("chat:join", { conversationId: activeChat });

    const handleUserMessage = (msg) => {
      setMessages(prev => [...prev, { sender: "user", body: msg.message }]);
    };

    // Feature 1: Agent's dashboard also handles the resolve event (e.g. if another tab resolves)
    const handleResolved = () => {
      setIsResolved(true);
    };

    socket.on("chat:user-message", handleUserMessage);
    socket.on("chat:resolved", handleResolved);

    return () => {
      socket.off("chat:user-message", handleUserMessage);
      socket.off("chat:resolved", handleResolved);
    };
  }, [activeChat]);

  // ─── Dynamic summary refresh every 4 messages ─────────────────────────────
  useEffect(() => {
    if (activeChat && messages.length > 0 && messages.length % 4 === 0) {
      loadSummary(activeChat);
    }
  }, [messages.length, activeChat, loadSummary]);

  // ─── Claim conversation (Feature 4: ownership locking) ────────────────────
  const handleClaim = async (conversationId, customerName) => {
    setClaimError("");
    try {
      await claimConversation(conversationId);
      const transcript = await fetchTranscript(conversationId);
      setMessages(transcript.messages || []);
      setActiveChat(conversationId);
      setActiveCustomerName(customerName || transcript.customerName || null);
      setIsResolved(transcript.status === "resolved");
      localStorage.setItem("agent_active_chat", conversationId);
      loadSummary(conversationId);
      loadAuditLogs(conversationId);
      refreshQueue();
    } catch (err) {
      setClaimError(err.message);
      console.error(err);
    }
  };

  // ─── Send agent reply ──────────────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim() || !activeChat || isResolved) return;
    const text = input.trim();
    setMessages(prev => [...prev, { sender: "agent", body: text }]);
    socket.emit("chat:agent-message", { conversationId: activeChat, message: text });
    socket.emit("chat:agent-typing", { conversationId: activeChat, isTyping: false });
    setInput("");
  };

  // Feature 3: Typing indicator — debounced emit to customer
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!activeChat || isResolved) return;

    socket.emit("chat:agent-typing", { conversationId: activeChat, isTyping: true });
    clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      socket.emit("chat:agent-typing", { conversationId: activeChat, isTyping: false });
    }, 1500);
  };

  // Feature 1: Resolve conversation
  const handleResolve = async () => {
    if (!activeChat || isResolved) return;
    try {
      await resolveConversation(activeChat);
      setIsResolved(true);
      await loadAuditLogs(activeChat);
      refreshQueue();
    } catch (err) {
      console.error("Failed to resolve:", err);
    }
  };

  // ─── Back to queue ─────────────────────────────────────────────────────────
  const handleBack = () => {
    clearTimeout(typingDebounceRef.current);
    socket.emit("chat:agent-typing", { conversationId: activeChat, isTyping: false });
    setActiveChat(null);
    setMessages([]);
    setSummary(null);
    setAuditLogs([]);
    setShowAuditLog(false);
    setIsResolved(false);
    setActiveCustomerName(null);
    localStorage.removeItem("agent_active_chat");
  };

  // ─── View Transcript from History ──────────────────────────────────────────
  const handleViewTranscript = async (conversationId, customerName) => {
    try {
      const transcript = await fetchTranscript(conversationId);
      setMessages(transcript.messages || []);
      setActiveChat(conversationId);
      setActiveCustomerName(customerName || transcript.customerName || null);
      setIsResolved(true);
      loadSummary(conversationId);
      loadAuditLogs(conversationId);
    } catch (err) {
      console.error("Failed to load transcript:", err);
    }
  };

  // ─── ACTIVE CHAT VIEW ──────────────────────────────────────────────────────
  if (activeChat) {
    return (
      <div className="agent-chat-layout">
        {/* Main Chat Panel */}
        <section className="card agent-chat-main">
          <div className="card-header agent-chat-header">
            <div className="flex items-center gap-3 flex-wrap">
              <button className="btn-outline px-3 py-2" onClick={handleBack} id="back-to-queue-btn">
                <ArrowLeft size={18} /> Back
              </button>
              <div>
                <h2 className="m-0 agent-chat-title">
                  {activeCustomerName ? (
                    <><User size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />{activeCustomerName}</>
                  ) : "Active Chat"}
                </h2>
                <p className="muted" style={{ fontSize: "12px", margin: 0, fontFamily: "monospace" }}>{activeChat}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isResolved ? (
                <span className="badge agent_resolved">
                  <CheckCheck size={14} /> Resolved
                </span>
              ) : (
                <button
                  id="resolve-conversation-btn"
                  className="btn-resolve"
                  onClick={handleResolve}
                  title="Mark conversation as resolved"
                >
                  <CheckCircle2 size={16} /> Resolve
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="chatWindow" ref={scrollRef}>
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`bubble-container ${message.sender}`}>
                <div className="bubble-header">
                  {message.sender === "assistant" && <Bot size={14} />}
                  {message.sender === "agent" && <Headphones size={14} />}
                  {message.sender === "user" && <User size={14} />}
                  <span>
                    {message.sender === "assistant" ? "Nexus AI"
                      : message.sender === "agent" ? "You (Agent)"
                      : activeCustomerName || "Customer"}
                  </span>
                </div>
                <div className="bubble">{message.body}</div>
              </div>
            ))}
          </div>

          {/* Input Row */}
          {isResolved ? (
            <div className="resolved-notice">
              <CheckCheck size={18} />
              <span>Conversation resolved. You can return to the queue.</span>
            </div>
          ) : (
            <div className="row">
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Type your reply to customer…"
                id="agent-reply-input"
              />
              <button id="agent-send-btn" onClick={handleSend} disabled={!input.trim()}>
                <SendHorizontal size={18} /> Send
              </button>
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        <aside className="agent-sidebar">
          {/* AI Summary Panel */}
          <section className="card agent-sidebar-card">
            <div className="card-header pb-3 flex justify-between items-center">
              <h3 className="m-0 text-base flex items-center gap-2">
                <Bot size={18} /> Chat Summary
              </h3>
              <button
                className="btn-outline px-2 py-1 text-xs"
                onClick={() => loadSummary(activeChat)}
                disabled={isSummaryLoading}
                id="refresh-summary-btn"
              >
                {isSummaryLoading ? "Updating…" : "Refresh"}
              </button>
            </div>
            <div className="summary-body">
              {summary ? (
                <>
                  <div className="summary-field">
                    <strong>Issue:</strong>
                    <p>{summary.issue}</p>
                  </div>
                  <div className="summary-field">
                    <strong>Status:</strong>
                    <p style={{ color: "var(--accent-warning)", fontWeight: 500 }}>{summary.status}</p>
                  </div>
                  <div className="summary-field">
                    <strong>Priority:</strong>
                    <p style={{ color: summary.priority === "High" || summary.priority === "Critical" ? "var(--accent-warning)" : "var(--text-muted)" }}>
                      {summary.priority}
                    </p>
                  </div>
                  <div className="summary-field">
                    <strong>Suggested Action:</strong>
                    <p>{summary.suggestedAction}</p>
                  </div>
                  <div className="summary-field">
                    <strong>Actions Taken:</strong>
                    <p>{summary.actionsTaken}</p>
                  </div>
                  {summary.points?.length > 0 && (
                    <div className="summary-field">
                      <strong>Key Points:</strong>
                      <ul className="summary-list">
                        {summary.points.map((pt, i) => <li key={i}>{pt}</li>)}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="muted">Loading summary…</p>
              )}
            </div>
          </section>

          {/* Feature 6: Audit Log Panel */}
          <section className="card agent-sidebar-card">
            <button
              className="audit-toggle"
              onClick={() => {
                setShowAuditLog(prev => !prev);
                if (!showAuditLog && auditLogs.length === 0) loadAuditLogs(activeChat);
              }}
              id="toggle-audit-log-btn"
            >
              <span className="flex items-center gap-2">
                <ClipboardList size={18} /> Audit Log
              </span>
              {showAuditLog ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAuditLog && (
              <div className="audit-body">
                {isAuditLoading ? (
                  <p className="muted text-sm">Loading logs…</p>
                ) : auditLogs.length === 0 ? (
                  <p className="muted text-sm">No audit entries yet.</p>
                ) : (
                  <ul className="audit-list">
                    {auditLogs.map((log, i) => (
                      <li key={i} className="audit-item">
                        <div className="audit-action">{log.action.replace(/_/g, " ")}</div>
                        {log.details && <div className="audit-details">{log.details}</div>}
                        <div className="audit-time">{timeAgo(log.created_at)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    );
  }

  // ─── QUEUE VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Analytics */}
      {analytics && (
        <div className="analytics-grid">
          <div className="card analytics-card">
            <div className="analytics-icon analytics-icon--blue">
              <MessageSquare size={22} />
            </div>
            <div>
              <p className="muted m-0 text-sm">Total Chats</p>
              <h3 className="m-0 text-2xl">{analytics.totalConversations}</h3>
            </div>
          </div>
          <div className="card analytics-card">
            <div className="analytics-icon analytics-icon--warning">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="muted m-0 text-sm">Escalations</p>
              <h3 className="m-0 text-2xl">{analytics.totalEscalations}</h3>
            </div>
          </div>
          <div className="card analytics-card">
            <div className="analytics-icon analytics-icon--success">
              <Users size={22} />
            </div>
            <div>
              <p className="muted m-0 text-sm">Leads Synced</p>
              <h3 className="m-0 text-2xl">{analytics.totalLeads}</h3>
            </div>
          </div>
          <div className="card analytics-card">
            <div className="analytics-icon analytics-icon--resolved">
              <CheckCheck size={22} />
            </div>
            <div>
              <p className="muted m-0 text-sm">Resolved Today</p>
              <h3 className="m-0 text-2xl">{analytics.resolvedToday ?? 0}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Claim Error Toast */}
      {claimError && (
        <div className="claim-error-banner" role="alert">
          <Lock size={16} /> {claimError}
          <button className="btn-link" onClick={() => setClaimError("")} style={{ marginLeft: "auto" }}>✕</button>
        </div>
      )}

      {/* Tabs UI */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <Inbox size={18} /> Live Queue
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} /> Resolved History
        </button>
      </div>

      {activeTab === 'queue' ? (
        <section className="card">
          <div className="card-header queue-header">
            <div className="flex items-center gap-3 flex-wrap">
              <h2>Agent Dashboard</h2>
              <span className="badge agent_active">
                <Inbox size={14} /> Live Queue: {queue.length}
              </span>
            </div>
            <button
              id="agent-logout-btn"
              className="btn-danger px-4 py-2"
              onClick={() => {
                localStorage.removeItem("agent_token");
                navigate("/agent/login");
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

        {queue.length === 0 ? (
          <div className="empty-queue">
            <MessageSquare size={48} className="opacity-20 mb-4 mx-auto" />
            <p>No pending escalations in queue.</p>
            <p className="text-sm mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="queue-list">
            {queue.map((item) => {
              const isClaimedByOther = item.claimedByEmail && item.claimedByEmail !== currentAgentEmail;
              const isClaimedByMe = item.claimedByEmail && item.claimedByEmail === currentAgentEmail;

              return (
                <article className="queueItem" key={item.conversationId}>
                  {/* Queue Item Header */}
                  <div className="queue-item-header">
                    <div>
                      {/* Feature 5: Show customer name prominently */}
                      <h3 className="queue-customer-name">
                        <User size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                        {item.customerName || "Anonymous User"}
                      </h3>
                      {item.customerEmail && (
                        <p className="muted" style={{ fontSize: "12px", margin: "2px 0 0 18px" }}>{item.customerEmail}</p>
                      )}
                      <p className="muted" style={{ fontSize: "11px", margin: "2px 0 0 18px", fontFamily: "monospace" }}>
                        {item.conversationId}
                      </p>
                    </div>
                    <div className="queue-badges">
                      {/* Feature 4: Ownership lock badge */}
                      {isClaimedByOther && (
                        <span className="badge badge-locked" title={`Claimed by ${item.claimedByEmail}`}>
                          <Lock size={12} /> Claimed
                        </span>
                      )}
                      {isClaimedByMe && (
                        <span className="badge agent_active" style={{ fontSize: "11px" }}>
                          <CheckCircle2 size={12} /> Mine
                        </span>
                      )}
                      {item.status === "agent_active" && !isClaimedByOther && !isClaimedByMe && (
                        <span className="badge agent_active" style={{ fontSize: "11px" }}>In Progress</span>
                      )}
                    </div>
                  </div>

                  <p className="muted mb-2 mt-2">
                    <strong>Reason: </strong>
                    <span className="text-warning">{item.reason}</span>
                  </p>
                  <p className="muted line-clamp-2">
                    <strong>Last: </strong>{item.lastMessage}
                  </p>

                  {/* Feature 4: Block claim if already owned by another agent */}
                  {isClaimedByOther ? (
                    <div className="queue-locked-notice">
                      <Lock size={14} />
                      <span>This conversation is being handled by <strong>{item.claimedByEmail}</strong></span>
                    </div>
                  ) : (
                    <button
                      id={`claim-btn-${item.conversationId}`}
                      onClick={() => handleClaim(item.conversationId, item.customerName)}
                      className="mt-4"
                      style={{ width: "100%" }}
                    >
                      <Headphones size={16} />
                      {isClaimedByMe ? "Resume Chat" : "Claim Conversation"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      ) : (
      <section className="card history-section">
        <div className="card-header flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2>Resolved Escalations</h2>
            <span className="badge bg-green-100 text-green-700">
              {historyData.total} Total
            </span>
          </div>
          <div className="search-bar relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID, Name, Email..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
            />
          </div>
        </div>

        {isHistoryLoading ? (
           <div className="p-8 text-center text-gray-500">Loading history...</div>
        ) : historyData.conversations.length === 0 ? (
           <div className="empty-queue p-12">
             <History size={48} className="opacity-20 mx-auto mb-4" />
             <p>No resolved conversations found.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600 text-sm">
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Resolved</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {historyData.conversations.map(conv => (
                  <tr key={conv.conversationId} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{conv.customerName}</div>
                      <div className="text-xs text-gray-500 font-mono">{conv.conversationId.split('-')[1] || conv.conversationId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                         {conv.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {conv.claimedByEmail || <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {timeAgo(conv.resolvedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                       <button 
                         onClick={() => handleViewTranscript(conv.conversationId, conv.customerName)}
                         className="btn-outline px-3 py-1 text-xs whitespace-nowrap"
                       >
                         View Transcript
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {historyData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                 <div className="text-sm text-gray-500">
                   Page {historyData.page} of {historyData.totalPages}
                 </div>
                 <div className="flex gap-2">
                   <button 
                     disabled={historyData.page === 1}
                     onClick={() => setHistoryData(prev => ({...prev, page: prev.page - 1}))}
                     className="px-3 py-1 border rounded disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors"
                   >
                     Previous
                   </button>
                   <button 
                     disabled={historyData.page === historyData.totalPages}
                     onClick={() => setHistoryData(prev => ({...prev, page: prev.page + 1}))}
                     className="px-3 py-1 border rounded disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors"
                   >
                     Next
                   </button>
                 </div>
              </div>
            )}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
