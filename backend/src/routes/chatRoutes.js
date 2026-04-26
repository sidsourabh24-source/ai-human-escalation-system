import { Router } from "express";
import { generateAssistantReply, classifyEscalation } from "../services/claudeService.js";
import { buildLeadSnapshot } from "../services/leadService.js";
import { syncLeadToHubspotMock } from "../integrations/hubspotClient.js";
import { sendEscalationEmail } from "../services/emailService.js";

const router = Router();

router.post("/chat/message", async (req, res, next) => {
  try {
    const { conversationId = "demo-conv", message = "" } = req.body || {};

    const escalation = await classifyEscalation(message);
    const assistantReply = escalation.shouldEscalate
      ? "I am connecting you with a human agent now."
      : await generateAssistantReply(message);

    const lead = buildLeadSnapshot(message, escalation.signals);
    let crmResult = null;

    if (lead.potentialLead) {
      crmResult = await syncLeadToHubspotMock(lead);
    }

    if (escalation.shouldEscalate) {
      await sendEscalationEmail({ conversationId, userMessage: message });
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
