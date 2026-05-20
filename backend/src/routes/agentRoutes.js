import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import {
  getPendingQueue,
  claimConversation,
  resolveConversation,
  logAuditAction,
  getAnalytics,
  getConversationTranscript,
  getAuditLogs,
  getResolvedHistory
} from "../services/conversationService.js";
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

// Feature 4: Ownership locking — only one agent can claim a conversation
router.post("/agent/claim", protect, validate(claimSchema), async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ success: false, message: "Conversation ID is required" });
    }

    const agentId = req.user.id;
    const agentEmail = req.user.email;

    const claimed = await claimConversation(conversationId, agentId, agentEmail);

    if (!claimed) {
      return res.status(409).json({
        success: false,
        message: "This conversation has already been claimed by another agent."
      });
    }

    await logAuditAction(conversationId, "agent_claimed", `Agent: ${agentEmail || agentId}`);

    const io = req.app.get("io");
    if (io) {
      io.emit("queue:update");
    }

    res.json({ success: true, message: "Conversation claimed" });
  } catch (err) {
    next(err);
  }
});

// Feature 1: Resolve conversation — validated by agent (user side)
const resolveSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Conversation ID is required" })
  })
});

router.post("/agent/conversations/:id/resolve", protect, validate(resolveSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const agentEmail = req.user.email || req.user.id;

    await resolveConversation(id, "user");
    await logAuditAction(id, "conversation_resolved", `Resolved by agent: ${agentEmail}`);

    const io = req.app.get("io");
    if (io) {
      // Notify customer that the conversation has been resolved
      io.to(id).emit("chat:resolved", {
        conversationId: id,
        resolvedAt: new Date().toISOString(),
        resolvedBy: agentEmail
      });
      // Refresh agent queue
      io.emit("queue:update");
    }

    res.json({ success: true, message: "Conversation resolved" });
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

// Feature 6: Fetch audit log for a conversation
router.get("/agent/conversations/:id/audit", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Conversation ID is required" });
    }
    const logs = await getAuditLogs(id);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// History: List all resolved escalations with search + pagination
router.get("/agent/history", protect, async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const search = (req.query.search || "").trim().slice(0, 100);
    const data   = await getResolvedHistory({ page, limit, search });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
