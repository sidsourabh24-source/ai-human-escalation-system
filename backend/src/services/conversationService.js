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

// Feature 5: Store customer identity (name + email) on first message
export const setCustomerInfo = async (conversationId, name, email) => {
  try {
    if (!name && !email) return;
    await pool.query(
      `UPDATE conversations 
       SET customer_name = COALESCE(customer_name, ?),
           customer_email = COALESCE(customer_email, ?)
       WHERE id = ?`,
      [name || null, email || null, conversationId]
    );
  } catch (error) {
    console.error("Error setting customer info:", error);
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
    const [rows] = await pool.query(
      `SELECT status, customer_name, customer_email, claimed_by_email FROM conversations WHERE id = ?`,
      [conversationId]
    );
    const conv = rows[0] || {};
    return {
      status: conv.status,
      customerName: conv.customer_name,
      customerEmail: conv.customer_email,
      claimedByEmail: conv.claimed_by_email,
      messages
    };
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return { status: "unknown", messages: [] };
  }
};

export const getPendingQueue = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id AS conversationId, c.started_at, c.status,
              c.customer_name, c.customer_email,
              c.claimed_by, c.claimed_by_email,
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
      customerName: r.customer_name || null,
      customerEmail: r.customer_email || null,
      claimedBy: r.claimed_by || null,
      claimedByEmail: r.claimed_by_email || null,
      lastMessage: r.lastMessage || "No messages",
      reason: r.reason || "Automatic Escalation"
    }));
  } catch (error) {
    console.error("Error fetching pending queue:", error);
    return [];
  }
};

// Feature 4: Claim with agent ownership — prevents double-claim
export const claimConversation = async (conversationId, agentId, agentEmail) => {
  try {
    // Only claim if not already claimed by a different agent
    const [result] = await pool.query(
      `UPDATE conversations 
       SET status = 'agent_active', claimed_by = ?, claimed_by_email = ?
       WHERE id = ? AND (claimed_by IS NULL OR claimed_by = ?)`,
      [agentId, agentEmail, conversationId, agentId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error claiming conversation:", error);
    return false;
  }
};

// Feature 1: Resolve conversation — validates by 'user' or 'system'
export const resolveConversation = async (conversationId, validatedBy = "user") => {
  try {
    await pool.query(
      `UPDATE conversations 
       SET status = 'resolved', resolved_at = NOW(), resolve_validated_by = ?
       WHERE id = ? AND status IN ('agent_active', 'handoff_pending')`,
      [validatedBy, conversationId]
    );
  } catch (error) {
    console.error("Error resolving conversation:", error);
  }
};

// Chat Transfer: Reassign an active conversation to a different agent
export const transferConversation = async (conversationId, newAgentEmail) => {
  try {
    // Look up the receiving agent's numeric ID for the FK constraint
    const [agentRows] = await pool.query(
      `SELECT id FROM agents WHERE email = ? LIMIT 1`,
      [newAgentEmail]
    );
    const newAgentId = agentRows[0]?.id ?? null;

    const [result] = await pool.query(
      `UPDATE conversations
       SET claimed_by = ?, claimed_by_email = ?
       WHERE id = ? AND status = 'agent_active'`,
      [newAgentId, newAgentEmail, conversationId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error transferring conversation:", error);
    return false;
  }
};

// Feature 1: Auto-resolve conversations after 7 days of inactivity
export const autoResolveStaleConversations = async () => {
  try {
    const [result] = await pool.query(
      `UPDATE conversations
       SET status = 'resolved', resolved_at = NOW(), resolve_validated_by = 'system'
       WHERE status IN ('handoff_pending', 'agent_active')
         AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    if (result.affectedRows > 0) {
      console.log(`[auto-resolve] ${result.affectedRows} stale conversation(s) resolved.`);
    }
  } catch (error) {
    console.error("Error auto-resolving conversations:", error);
  }
};

// History: Fetch all resolved conversations with full metadata
export const getResolvedHistory = async ({ page = 1, limit = 20, search = "" } = {}) => {
  try {
    const offset = (page - 1) * limit;
    const likeSearch = `%${search}%`;

    const [rows] = await pool.query(
      `SELECT
         c.id                    AS conversationId,
         c.customer_name,
         c.customer_email,
         c.claimed_by_email,
         c.resolved_at,
         c.resolve_validated_by,
         c.started_at,
         (SELECT IF(e.anger=1,'Anger',IF(e.buying_intent=1,'Buying Intent',IF(e.manual_request=1,'Manual Request','Confusion')))
          FROM escalations e WHERE e.conversation_id = c.id ORDER BY e.id DESC LIMIT 1)  AS reason,
         (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id)                AS message_count,
         (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
       FROM conversations c
       WHERE c.status = 'resolved'
         AND (
           c.customer_name  LIKE ? OR
           c.customer_email LIKE ? OR
           c.id             LIKE ?
         )
       ORDER BY c.resolved_at DESC
       LIMIT ? OFFSET ?`,
      [likeSearch, likeSearch, likeSearch, limit, offset]
    );

    // Total count for pagination
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM conversations
       WHERE status = 'resolved'
         AND (customer_name LIKE ? OR customer_email LIKE ? OR id LIKE ?)`,
      [likeSearch, likeSearch, likeSearch]
    );

    return {
      conversations: rows.map(r => ({
        conversationId:      r.conversationId,
        customerName:        r.customer_name  || "Anonymous",
        customerEmail:       r.customer_email || null,
        claimedByEmail:      r.claimed_by_email || null,
        resolvedAt:          r.resolved_at,
        resolvedBy:          r.resolve_validated_by,
        startedAt:           r.started_at,
        reason:              r.reason || "Automatic Escalation",
        messageCount:        r.message_count,
        lastMessage:         r.last_message || "No messages"
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error("Error fetching resolved history:", error);
    return { conversations: [], total: 0, page: 1, totalPages: 0 };
  }
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

// Feature 6: Fetch audit logs for a conversation
export const getAuditLogs = async (conversationId) => {
  try {
    const [rows] = await pool.query(
      `SELECT action, details, created_at FROM audit_logs 
       WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
};

export const getAnalytics = async () => {
  try {
    const [[{ totalConversations }]] = await pool.query(`SELECT COUNT(*) as totalConversations FROM conversations`);
    const [[{ totalEscalations }]] = await pool.query(`SELECT COUNT(*) as totalEscalations FROM escalations`);
    const [[{ pendingQueue }]] = await pool.query(`SELECT COUNT(*) as pendingQueue FROM conversations WHERE status = 'handoff_pending'`);
    const [[{ totalLeads }]] = await pool.query(`SELECT COUNT(*) as totalLeads FROM leads`);
    const [[{ resolvedToday }]] = await pool.query(`SELECT COUNT(*) as resolvedToday FROM conversations WHERE status = 'resolved' AND DATE(resolved_at) = CURDATE()`);
    return { totalConversations, totalEscalations, pendingQueue, totalLeads, resolvedToday };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { totalConversations: 0, totalEscalations: 0, pendingQueue: 0, totalLeads: 0, resolvedToday: 0 };
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
