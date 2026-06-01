import pool from "../config/db.js";

export const ensureConversation = async (conversationId) => {
  try {
    await pool.query(
      `INSERT INTO conversations (id, status) VALUES ($1, 'ai_active') ON CONFLICT (id) DO NOTHING`,
      [conversationId]
    );
  } catch (error) {
    console.error("Error ensuring conversation:", error);
  }
};

export const saveMessage = async (conversationId, sender, body) => {
  try {
    await pool.query(
      `INSERT INTO messages (conversation_id, sender, body) VALUES ($1, $2, $3)`,
      [conversationId, sender, body]
    );
  } catch (error) {
    console.error("Error saving message:", error);
  }
};

export const updateConversationStatus = async (conversationId, status) => {
  try {
    await pool.query(
      `UPDATE conversations SET status = $1 WHERE id = $2`,
      [status, conversationId]
    );
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

export const getConversationStatus = async (conversationId) => {
  try {
    const { rows } = await pool.query(
      `SELECT status FROM conversations WHERE id = $1`,
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
       SET customer_name = COALESCE(customer_name, $1),
           customer_email = COALESCE(customer_email, $2)
       WHERE id = $3`,
      [name || null, email || null, conversationId]
    );
  } catch (error) {
    console.error("Error setting customer info:", error);
  }
};

export const logEscalation = async (conversationId, signals) => {
  try {
    await pool.query(
      `INSERT INTO escalations (conversation_id, anger, confusion, buying_intent, manual_request) VALUES ($1, $2, $3, $4, $5)`,
      [
        conversationId,
        Boolean(signals.anger),
        Boolean(signals.confusion),
        Boolean(signals.buyingIntent),
        Boolean(signals.manualRequest)
      ]
    );
  } catch (error) {
    console.error("Error logging escalation:", error);
  }
};

export const getConversationTranscript = async (conversationId) => {
  try {
    const { rows: messages } = await pool.query(
      `SELECT sender, body, created_at AS "createdAt" FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );
    const { rows } = await pool.query(
      `SELECT status, customer_name AS "customerName", customer_email AS "customerEmail", claimed_by_email AS "claimedByEmail" FROM conversations WHERE id = $1`,
      [conversationId]
    );
    const conv = rows[0] || {};
    return {
      status: conv.status,
      customerName: conv.customerName,
      customerEmail: conv.customerEmail,
      claimedByEmail: conv.claimedByEmail,
      messages
    };
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return { status: "unknown", messages: [] };
  }
};

export const getPendingQueue = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id AS "conversationId", c.started_at AS "startedAt", c.status,
              c.customer_name AS "customerName", c.customer_email AS "customerEmail",
              c.claimed_by AS "claimedBy", c.claimed_by_email AS "claimedByEmail",
              (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS "lastMessage",
              (SELECT CASE 
                        WHEN e.anger = true THEN 'Anger'
                        WHEN e.buying_intent = true THEN 'Buying Intent'
                        WHEN e.manual_request = true THEN 'Manual Request'
                        ELSE 'Confusion'
                      END
               FROM escalations e WHERE e.conversation_id = c.id ORDER BY e.id DESC LIMIT 1) AS reason
       FROM conversations c
       WHERE c.status IN ('handoff_pending', 'agent_active')
       ORDER BY c.updated_at ASC`
    );
    return rows.map(r => ({
      conversationId: r.conversationId,
      startedAt: r.startedAt,
      status: r.status,
      customerName: r.customerName || null,
      customerEmail: r.customerEmail || null,
      claimedBy: r.claimedBy || null,
      claimedByEmail: r.claimedByEmail || null,
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
    const result = await pool.query(
      `UPDATE conversations 
       SET status = 'agent_active', claimed_by = $1, claimed_by_email = $2
       WHERE id = $3 AND (claimed_by IS NULL OR claimed_by = $4)`,
      [agentId, agentEmail, conversationId, agentId]
    );
    return result.rowCount > 0;
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
       SET status = 'resolved', resolved_at = NOW(), resolve_validated_by = $1
       WHERE id = $2 AND status IN ('agent_active', 'handoff_pending')`,
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
    const agentRows = await pool.query(
      `SELECT id FROM agents WHERE email = $1 LIMIT 1`,
      [newAgentEmail]
    );
    const newAgentId = agentRows.rows[0]?.id ?? null;

    const result = await pool.query(
      `UPDATE conversations
       SET claimed_by = $1, claimed_by_email = $2
       WHERE id = $3 AND status = 'agent_active'`,
      [newAgentId, newAgentEmail, conversationId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error transferring conversation:", error);
    return false;
  }
};

// Feature 1: Auto-resolve conversations after 7 days of inactivity
export const autoResolveStaleConversations = async () => {
  try {
    const result = await pool.query(
      `UPDATE conversations
       SET status = 'resolved', resolved_at = NOW(), resolve_validated_by = 'system'
       WHERE status IN ('handoff_pending', 'agent_active')
         AND updated_at < NOW() - INTERVAL '7 days'`
    );
    if (result.rowCount > 0) {
      console.log(`[auto-resolve] ${result.rowCount} stale conversation(s) resolved.`);
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

    const { rows } = await pool.query(
      `SELECT
         c.id                    AS "conversationId",
         c.customer_name         AS "customerName",
         c.customer_email        AS "customerEmail",
         c.claimed_by_email      AS "claimedByEmail",
         c.resolved_at           AS "resolvedAt",
         c.resolve_validated_by  AS "resolvedBy",
         c.started_at            AS "startedAt",
         (SELECT CASE 
                   WHEN e.anger = true THEN 'Anger'
                   WHEN e.buying_intent = true THEN 'Buying Intent'
                   WHEN e.manual_request = true THEN 'Manual Request'
                   ELSE 'Confusion'
                 END
          FROM escalations e WHERE e.conversation_id = c.id ORDER BY e.id DESC LIMIT 1)  AS reason,
         (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id)                AS message_count,
         (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
       FROM conversations c
       WHERE c.status = 'resolved'
         AND (
           c.customer_name  LIKE $1 OR
           c.customer_email LIKE $1 OR
           c.id             LIKE $1
         )
       ORDER BY c.resolved_at DESC
       LIMIT $2 OFFSET $3`,
      [likeSearch, limit, offset]
    );

    // Total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM conversations
       WHERE status = 'resolved'
         AND (customer_name LIKE $1 OR customer_email LIKE $1 OR id LIKE $1)`,
      [likeSearch]
    );
    const total = parseInt(countResult.rows[0]?.total || 0);

    return {
      conversations: rows.map(r => ({
        conversationId:      r.conversationId,
        customerName:        r.customerName  || "Anonymous",
        customerEmail:       r.customerEmail || null,
        claimedByEmail:      r.claimedByEmail || null,
        resolvedAt:          r.resolvedAt,
        resolvedBy:          r.resolvedBy,
        startedAt:           r.startedAt,
        reason:              r.reason || "Automatic Escalation",
        messageCount:        parseInt(r.message_count || 0),
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
      `INSERT INTO audit_logs (conversation_id, action, details) VALUES ($1, $2, $3)`,
      [conversationId, action, details]
    );
  } catch (error) {
    console.error("Error logging audit action:", error);
  }
};

// Feature 6: Fetch audit logs for a conversation
export const getAuditLogs = async (conversationId) => {
  try {
    const { rows } = await pool.query(
      `SELECT action, details, created_at FROM audit_logs 
       WHERE conversation_id = $1 ORDER BY created_at ASC`,
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
    const totalConversationsResult = await pool.query(`SELECT COUNT(*) as "totalConversations" FROM conversations`);
    const totalEscalationsResult = await pool.query(`SELECT COUNT(*) as "totalEscalations" FROM escalations`);
    const pendingQueueResult = await pool.query(`SELECT COUNT(*) as "pendingQueue" FROM conversations WHERE status = 'handoff_pending'`);
    const totalLeadsResult = await pool.query(`SELECT COUNT(*) as "totalLeads" FROM leads`);
    const resolvedTodayResult = await pool.query(`SELECT COUNT(*) as "resolvedToday" FROM conversations WHERE status = 'resolved' AND resolved_at::date = CURRENT_DATE`);
    
    return {
      totalConversations: parseInt(totalConversationsResult.rows[0]?.totalConversations || 0),
      totalEscalations: parseInt(totalEscalationsResult.rows[0]?.totalEscalations || 0),
      pendingQueue: parseInt(pendingQueueResult.rows[0]?.pendingQueue || 0),
      totalLeads: parseInt(totalLeadsResult.rows[0]?.totalLeads || 0),
      resolvedToday: parseInt(resolvedTodayResult.rows[0]?.resolvedToday || 0)
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { totalConversations: 0, totalEscalations: 0, pendingQueue: 0, totalLeads: 0, resolvedToday: 0 };
  }
};

export const saveLead = async (conversationId, summary, crmStatus) => {
  try {
    await pool.query(
      `INSERT INTO leads (conversation_id, summary, crm_sync_status) VALUES ($1, $2, $3)`,
      [conversationId, summary, crmStatus]
    );
  } catch (error) {
    console.error("Error saving lead:", error);
  }
};
