import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { generateAssistantReply, classifyEscalation } from "../services/claudeService.js";
import { buildLeadSnapshot } from "../services/leadService.js";
import { syncLeadToHubspotMock } from "../integrations/hubspotClient.js";
import { sendEscalationEmail } from "../services/emailService.js";
import { 
  ensureConversation, 
  saveMessage, 
  getConversationStatus, 
  updateConversationStatus, 
  logEscalation,
  logAuditAction,
  saveLead
} from "../services/conversationService.js";

const router = Router();

const messageSchema = z.object({
  body: z.object({
    conversationId: z.string().optional(),
    message: z.string().optional()
  })
});

router.post("/chat/message", validate(messageSchema), async (req, res, next) => {
  try {
    const { conversationId = "demo-conv", message = "" } = req.body || {};

    await ensureConversation(conversationId);
    await saveMessage(conversationId, "user", message);

    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("chat:user-message", {
        conversationId,
        message,
        createdAt: new Date().toISOString()
      });
    }

    const currentStatus = await getConversationStatus(conversationId);
    
    let assistantReply = "";
    let escalation = { shouldEscalate: false, signals: {} };

    // AI Suppression Logic
    if (currentStatus === "agent_active") {
      assistantReply = null;
    } else if (currentStatus === "handoff_pending") {
      assistantReply = "Your message has been sent to the agent. They will reply shortly.";
    } else {
      escalation = await classifyEscalation(message);
      
      if (escalation.shouldEscalate) {
        assistantReply = "I am connecting you with a human agent now.";
        await updateConversationStatus(conversationId, "handoff_pending");
        await logEscalation(conversationId, escalation.signals);
        await logAuditAction(conversationId, "escalation_triggered", `User message: ${message}`);
        await sendEscalationEmail({ conversationId, userMessage: message });
        if (io) {
          io.emit("queue:update");
        }
      } else {
        assistantReply = await generateAssistantReply(message);
      }
    }

    if (assistantReply !== null) {
      await saveMessage(conversationId, "assistant", assistantReply);
    }

    const lead = await buildLeadSnapshot(message, escalation.signals);
    let crmResult = null;

    if (lead.potentialLead) {
      let retries = 3;
      while (retries > 0) {
        try {
          crmResult = await syncLeadToHubspotMock(lead);
          break; // Success
        } catch (error) {
          retries--;
          console.warn(`CRM sync failed, retries left: ${retries}. Error: ${error.message}`);
          if (retries === 0) {
            console.error("CRM sync failed after 3 attempts.");
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      let finalStatus = crmResult ? "mocked" : "failed";
      await saveLead(conversationId, lead.summary, finalStatus);
    }

    res.json({
      success: true,
      data: {
        conversationId,
        assistantReply,
        escalation,
        lead,
        crmResult
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
