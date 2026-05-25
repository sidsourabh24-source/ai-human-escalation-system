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
  // Shared registry of online agents: Map<socketId, { agentId, agentEmail, agentName }>
  if (!io.onlineAgents) {
    io.onlineAgents = new Map();
  }

  io.on("connection", (socket) => {
    socket.on("chat:join", ({ conversationId }) => {
      socket.join(conversationId);
      socket.emit("chat:joined", { conversationId });
    });

    // ── Agent Presence ──────────────────────────────────────────────────────
    // Emitted by AgentDashboard on mount; registers the agent as "online"
    socket.on("agent:online", ({ agentId, agentEmail, agentName }) => {
      if (!agentEmail) return;
      io.onlineAgents.set(socket.id, {
        agentId:   agentId   ?? null,
        agentEmail,
        agentName: agentName ?? agentEmail
      });
    });

    // Remove the agent from the online registry when they disconnect
    socket.on("disconnect", () => {
      io.onlineAgents.delete(socket.id);
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
      } else if (currentStatus === "resolved") {
        reply = "This conversation has been resolved. Please start a new chat if you need further assistance.";
      } else {
        escalation = await classifyEscalation(message);
        
        if (escalation.shouldEscalate) {
          reply = "Handoff started. A human agent will join shortly.";
          await updateConversationStatus(conversationId, "handoff_pending");
          await logEscalation(conversationId, escalation.signals);
          await sendEscalationEmail({ conversationId, userMessage: message });
          io.emit("queue:update");
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

    socket.on("chat:agent-message", async (payload) => {
      const { conversationId, message } = payload || {};
      if (!conversationId || !message) return;

      await saveMessage(conversationId, "agent", message);

      io.to(conversationId).emit("chat:agent-message", {
        conversationId,
        message,
        createdAt: new Date().toISOString()
      });
    });

    // Feature 3: Agent is typing… indicator
    // Agent emits this; we broadcast to the conversation room (customer sees it)
    socket.on("chat:agent-typing", ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      // Broadcast to the room but NOT back to the sender (agent's own tab)
      socket.to(conversationId).emit("chat:agent-typing", { isTyping: !!isTyping });
    });
  });
}
