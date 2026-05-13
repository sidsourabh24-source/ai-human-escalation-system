import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLiveQueue, claimConversation, fetchAnalytics, fetchConversationSummary } from "../../services/agentApi";
import { fetchTranscript } from "../../services/chatApi";
import { Bot, User, Headphones, SendHorizontal, LogOut, ArrowLeft, Inbox, MessageSquare, BarChart3, AlertCircle, Users } from "lucide-react";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:4000");

export default function AgentDashboard() {
  const [queue, setQueue] = useState([]);
  const [activeChat, setActiveChat] = useState(() => localStorage.getItem("agent_active_chat") || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const loadSummary = async (cid) => {
    try {
      setIsSummaryLoading(true);
      const data = await fetchConversationSummary(cid);
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const refreshQueue = async () => {
    try {
      const data = await fetchLiveQueue();
      setQueue(data);
      const stats = await fetchAnalytics();
      setAnalytics(stats);
    } catch (err) {
      if (err.message === "Unauthorized") {
        navigate("/agent/login");
      }
      console.error(err);
    }
  };

  // On mount, restore active chat session if one exists in localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem("agent_active_chat");
    if (savedChat) {
      fetchTranscript(savedChat)
        .then(data => {
          setMessages(data.messages || []);
          setActiveChat(savedChat);
          loadSummary(savedChat);
        })
        .catch(err => {
          console.error("Failed to restore active chat:", err);
          localStorage.removeItem("agent_active_chat");
        });
    }
  }, []);

  useEffect(() => {
    refreshQueue();
    
    const handleQueueUpdate = () => {
      refreshQueue();
    };
    
    socket.on("queue:update", handleQueueUpdate);
    
    return () => {
      socket.off("queue:update", handleQueueUpdate);
    };
  }, []);

  useEffect(() => {
    if (activeChat) {
      socket.emit("chat:join", { conversationId: activeChat });
      
      const handleUserMessage = (msg) => {
        setMessages((prev) => [...prev, { sender: "user", body: msg.message }]);
      };
      
      socket.on("chat:user-message", handleUserMessage);
      
      return () => {
        socket.off("chat:user-message", handleUserMessage);
      };
    }
  }, [activeChat]);

  // Dynamic summary refresh every 4 messages
  useEffect(() => {
    if (activeChat && messages.length > 0 && messages.length % 4 === 0) {
      loadSummary(activeChat);
    }
  }, [messages.length, activeChat]);

  const handleClaim = async (conversationId) => {
    try {
      await claimConversation(conversationId);
      const transcript = await fetchTranscript(conversationId);
      setMessages(transcript.messages || []);
      setActiveChat(conversationId);
      localStorage.setItem("agent_active_chat", conversationId);
      loadSummary(conversationId);
      refreshQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !activeChat) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { sender: "agent", body: text }]);
    socket.emit("chat:agent-message", { conversationId: activeChat, message: text });
    setInput("");
  };

  if (activeChat) {
    return (
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <section className="card" style={{ flex: 1, minWidth: 0 }}>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <button className="btn-outline px-3 py-2" onClick={() => {
                setActiveChat(null);
                setMessages([]);
                setSummary(null);
                localStorage.removeItem("agent_active_chat");
              }}>
                <ArrowLeft size={18} /> Back
              </button>
              <h2 className="m-0">Active Chat: <span className="font-normal text-base">{activeChat}</span></h2>
            </div>
          </div>
          
          <div className="chatWindow" ref={scrollRef}>
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`bubble-container ${message.sender}`}>
                <div className="bubble-header">
                  {message.sender === "assistant" && <Bot size={14} />}
                  {message.sender === "agent" && <Headphones size={14} />}
                  {message.sender === "user" && <User size={14} />}
                  <span>{message.sender === "assistant" ? "Nexus AI" : message.sender === "agent" ? "You (Agent)" : "Customer"}</span>
                </div>
                <div className="bubble">
                  {message.body}
                </div>
              </div>
            ))}
          </div>

          <div className="row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Type your reply to customer..."
            />
            <button onClick={handleSend} disabled={!input.trim()}>
              <SendHorizontal size={18} /> Send
            </button>
          </div>
        </section>

        {/* Summary Side Panel */}
        <section className="card" style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '20px' }}>
          <div className="card-header pb-3 border-b border-borderLight dark:border-borderDark flex justify-between items-center">
            <h3 className="m-0 text-base flex items-center gap-2">
              <Bot size={18} /> Chat Summary
            </h3>
            <button className="btn-outline px-2 py-1 text-xs" onClick={() => loadSummary(activeChat)} disabled={isSummaryLoading}>
              {isSummaryLoading ? 'Updating...' : 'Refresh'}
            </button>
          </div>
          <div className="p-4 text-sm flex flex-col gap-4">
            {summary ? (
              <>
                <div>
                  <strong style={{ color: 'var(--text-color)' }}>Issue:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{summary.issue}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-color)' }}>Status:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--accent-warning)', fontWeight: '500' }}>{summary.status}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-color)' }}>Priority:</strong>
                  <p style={{ margin: '4px 0 0 0', color: summary.priority === 'High' || summary.priority === 'Critical' ? 'var(--accent-warning)' : 'var(--text-muted)' }}>{summary.priority}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-color)' }}>Suggested Action:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{summary.suggestedAction}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-color)' }}>Actions Taken:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{summary.actionsTaken}</p>
                </div>
                {summary.points && summary.points.length > 0 && (
                  <div>
                    <strong style={{ color: 'var(--text-color)' }}>Key Points:</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', color: 'var(--text-muted)' }}>
                      {summary.points.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="muted">Loading summary...</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {analytics && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-primary">
              <MessageSquare size={24} />
            </div>
            <div>
              <p className="muted m-0 text-sm">Total Chats</p>
              <h3 className="m-0 text-2xl">{analytics.totalConversations}</h3>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-warning">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="muted m-0 text-sm">Escalations</p>
              <h3 className="m-0 text-2xl">{analytics.totalEscalations}</h3>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-success">
              <Users size={24} />
            </div>
            <div>
              <p className="muted m-0 text-sm">Leads Synced</p>
              <h3 className="m-0 text-2xl">{analytics.totalLeads}</h3>
            </div>
          </div>
        </div>
      )}

      <section className="card">
      <div className="card-header">
        <div className="flex items-center gap-4">
          <h2>Agent Dashboard</h2>
          <span className="badge agent_active">
            <Inbox size={14} /> Live Queue: {queue.length}
          </span>
        </div>
        <button className="btn-danger px-4 py-2" onClick={() => {
          localStorage.removeItem("agent_token");
          navigate("/agent/login");
        }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-10 text-mutedLight dark:text-mutedDark">
          <MessageSquare size={48} className="opacity-20 mb-4 mx-auto" />
          <p>No pending escalations in queue.</p>
          <p className="text-sm mt-2">You're all caught up!</p>
        </div>
      ) : (
        queue.map((item) => (
          <article className="queueItem" key={item.conversationId}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="m-0 text-base font-semibold">{item.conversationId}</h3>
              {item.status === 'agent_active' && <span className="badge agent_active px-2 py-1 text-[11px]">In Progress</span>}
            </div>
            <p className="muted mb-2"><strong>Reason:</strong> <span className="text-warning">{item.reason}</span></p>
            <p className="muted line-clamp-2"><strong>Last:</strong> {item.lastMessage}</p>
            <button onClick={() => handleClaim(item.conversationId)} className="mt-4">
              <Headphones size={16} /> {item.status === 'agent_active' ? "Resume Chat" : "Claim Conversation"}
            </button>
          </article>
        ))
      )}
      </section>
    </div>
  );
}
