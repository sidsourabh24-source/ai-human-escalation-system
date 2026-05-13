import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { getPendingQueue, claimConversation, logAuditAction, getAnalytics, getConversationTranscript } from "../services/conversationService.js";
import { generateConversationSummary } from "../services/claudeService.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/agent/queue", protect, async (req, res, next) => {
  try {
    const queue = await getPendingQueue();
    res.json({ success: true, data: queue });
  } catch (err) {
    next(err);
  }
});

router.get("/agent/analytics", protect, async (req, res, next) => {
  try {
    const data = await getAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

const claimSchema = z.object({
  body: z.object({
    conversationId: z.string({ required_error: "Conversation ID is required" })
  })
});

router.post("/agent/claim", protect, validate(claimSchema), async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ success: false, message: "Conversation ID is required" });
    }
    await claimConversation(conversationId);
    await logAuditAction(conversationId, "agent_claimed", `Agent: ${req.user.email || req.user.id}`);
    
    const io = req.app.get("io");
    if (io) {
      io.emit("queue:update");
    }

    res.json({ success: true, message: "Conversation claimed" });
  } catch (err) {
    next(err);
  }
});

router.get("/agent/conversations/:id/summary", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Conversation ID is required" });
    }

    const transcript = await getConversationTranscript(id);
    if (!transcript || !transcript.messages) {
      return res.status(404).json({ success: false, message: "Transcript not found" });
    }

    const summary = await generateConversationSummary(transcript.messages);
    
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

export default router;
