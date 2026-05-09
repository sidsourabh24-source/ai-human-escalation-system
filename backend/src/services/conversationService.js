import pool from "../config/db.js";

export const ensureConversation = async (conversationId) => {
  try {
    await pool.query(
      `INSERT IGNORE INTO conversations (id, status) VALUES (?, 'ai_active')`,
      [conversationId]
    );
  } catch (error) {
    console.error("Error ensuring conversation:", error);
  }
};

export const saveMessage = async (conversationId, sender, body) => {
  try {
    await pool.query(
      `INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)`,
      [conversationId, sender, body]
    );
  } catch (error) {
    console.error("Error saving message:", error);
  }
};

export const updateConversationStatus = async (conversationId, status) => {
  try {
    await pool.query(
      `UPDATE conversations SET status = ? WHERE id = ?`,
      [status, conversationId]
    );
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

export const getConversationStatus = async (conversationId) => {
  try {
    const [rows] = await pool.query(
      `SELECT status FROM conversations WHERE id = ?`,
      [conversationId]
    );
    return rows[0]?.status || null;
  } catch (error) {
    console.error("Error fetching status:", error);
    return null;
  }
};

export const logEscalation = async (conversationId, signals) => {
  try {
    await pool.query(
      `INSERT INTO escalations (conversation_id, anger, confusion, buying_intent, manual_request) VALUES (?, ?, ?, ?, ?)`,
      [
        conversationId,
        signals.anger ? 1 : 0,
        signals.confusion ? 1 : 0,
        signals.buyingIntent ? 1 : 0,
        signals.manualRequest ? 1 : 0
      ]
    );
  } catch (error) {
    console.error("Error logging escalation:", error);
  }
};

export const getConversationTranscript = async (conversationId) => {
  try {
    const [messages] = await pool.query(
      `SELECT sender, body, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId]
    );
    const status = await getConversationStatus(conversationId);
    return { status, messages };
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return { status: "unknown", messages: [] };
  }
};

export const getPendingQueue = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id AS conversationId, c.started_at, c.status,
              (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS lastMessage,
              (SELECT IF(anger=1, 'Anger', IF(buying_intent=1, 'Buying Intent', IF(manual_request=1, 'Manual Request', 'Confusion'))) 
               FROM escalations WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS reason
       FROM conversations c
       WHERE c.status IN ('handoff_pending', 'agent_active')
       ORDER BY c.updated_at ASC`
    );
    return rows.map(r => ({
      conversationId: r.conversationId,
      startedAt: r.started_at,
      status: r.status,
      lastMessage: r.lastMessage || "No messages",
      reason: r.reason || "Automatic Escalation"
    }));
  } catch (error) {
    console.error("Error fetching pending queue:", error);
    return [];
  }
};

export const claimConversation = async (conversationId) => {
  await updateConversationStatus(conversationId, "agent_active");
};

export const logAuditAction = async (conversationId, action, details = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (conversation_id, action, details) VALUES (?, ?, ?)`,
      [conversationId, action, details]
    );
  } catch (error) {
    console.error("Error logging audit action:", error);
  }
};

export const getAnalytics = async () => {
  try {
    const [[{ totalConversations }]] = await pool.query(`SELECT COUNT(*) as totalConversations FROM conversations`);
    const [[{ totalEscalations }]] = await pool.query(`SELECT COUNT(*) as totalEscalations FROM escalations`);
    const [[{ pendingQueue }]] = await pool.query(`SELECT COUNT(*) as pendingQueue FROM conversations WHERE status = 'handoff_pending'`);
    const [[{ totalLeads }]] = await pool.query(`SELECT COUNT(*) as totalLeads FROM leads`);
    return { totalConversations, totalEscalations, pendingQueue, totalLeads };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { totalConversations: 0, totalEscalations: 0, pendingQueue: 0, totalLeads: 0 };
  }
};

export const saveLead = async (conversationId, summary, crmStatus) => {
  try {
    await pool.query(
      `INSERT INTO leads (conversation_id, summary, crm_sync_status) VALUES (?, ?, ?)`,
      [conversationId, summary, crmStatus]
    );
  } catch (error) {
    console.error("Error saving lead:", error);
  }
};
