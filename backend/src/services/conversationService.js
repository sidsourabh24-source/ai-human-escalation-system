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
