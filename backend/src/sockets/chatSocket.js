import { classifyEscalation, generateAssistantReply } from "../services/claudeService.js";
import { ensureConversation, saveMessage } from "../services/conversationService.js";

export function registerChatSocket(io) {
  io.on("connection", (socket) => {
    socket.on("chat:join", ({ conversationId }) => {
      socket.join(conversationId);
      socket.emit("chat:joined", { conversationId });
    });

    socket.on("chat:user-message", async (payload) => {
      const { conversationId, message } = payload || {};
      if (!conversationId || !message) return;

      await ensureConversation(conversationId);
      await saveMessage(conversationId, "user", message);

      io.to(conversationId).emit("chat:user-message", {
        conversationId,
        message,
        createdAt: new Date().toISOString()
      });

      const escalation = await classifyEscalation(message);
      const reply = escalation.shouldEscalate
        ? "Handoff started. A human agent will join shortly."
        : await generateAssistantReply(message);

      await saveMessage(conversationId, "assistant", reply);

      io.to(conversationId).emit("chat:assistant-message", {
        conversationId,
        message: reply,
        escalation,
        createdAt: new Date().toISOString()
      });
    });
  });
}
