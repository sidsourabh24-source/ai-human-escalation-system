import { Router } from "express";
import { generateAssistantReply, classifyEscalation } from "../services/claudeService.js";
import { buildLeadSnapshot } from "../services/leadService.js";
import { syncLeadToHubspotMock } from "../integrations/hubspotClient.js";
import { sendEscalationEmail } from "../services/emailService.js";
import { 
  ensureConversation, 
  saveMessage, 
  getConversationStatus, 
  updateConversationStatus, 
  logEscalation 
} from "../services/conversationService.js";

const router = Router();

router.post("/chat/message", async (req, res, next) => {
  try {
    const { conversationId = "demo-conv", message = "" } = req.body || {};

    await ensureConversation(conversationId);
    await saveMessage(conversationId, "user", message);

    const currentStatus = await getConversationStatus(conversationId);
    
    let assistantReply = "";
    let escalation = { shouldEscalate: false, signals: {} };

    // AI Suppression Logic
    if (currentStatus === "handoff_pending" || currentStatus === "agent_active") {
      assistantReply = "Your message has been sent to the agent. They will reply shortly.";
    } else {
      escalation = await classifyEscalation(message);
      
      if (escalation.shouldEscalate) {
        assistantReply = "I am connecting you with a human agent now.";
        await updateConversationStatus(conversationId, "handoff_pending");
        await logEscalation(conversationId, escalation.signals);
        await sendEscalationEmail({ conversationId, userMessage: message });
      } else {
        assistantReply = await generateAssistantReply(message);
      }
    }

    await saveMessage(conversationId, "assistant", assistantReply);

    const lead = buildLeadSnapshot(message, escalation.signals);
    let crmResult = null;

    if (lead.potentialLead) {
      crmResult = await syncLeadToHubspotMock(lead);
    }

    if (lead.potentialLead && crmResult === null) {
      // Just a placeholder in case we need CRM logic outside suppression
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
