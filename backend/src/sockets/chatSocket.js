import { classifyEscalation, generateAssistantReply } from "../services/claudeService.js";
import { 
  ensureConversation, 
  saveMessage, 
  getConversationStatus, 
  updateConversationStatus, 
  logEscalation 
} from "../services/conversationService.js";
import { sendEscalationEmail } from "../services/emailService.js";

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

      const currentStatus = await getConversationStatus(conversationId);
      
      let reply = "";
      let escalation = { shouldEscalate: false, signals: {} };

      // AI Suppression Logic
      if (currentStatus === "handoff_pending" || currentStatus === "agent_active") {
        reply = "Your message has been sent to the agent. They will reply shortly.";
      } else {
        escalation = await classifyEscalation(message);
        
        if (escalation.shouldEscalate) {
          reply = "Handoff started. A human agent will join shortly.";
          await updateConversationStatus(conversationId, "handoff_pending");
          await logEscalation(conversationId, escalation.signals);
          await sendEscalationEmail({ conversationId, userMessage: message });
        } else {
          reply = await generateAssistantReply(message);
        }
      }

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
