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
