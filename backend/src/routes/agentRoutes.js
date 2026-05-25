import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import {
  getPendingQueue,
  claimConversation,
  resolveConversation,
  transferConversation,
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

// ── Chat Transfer: List currently online agents ───────────────────────────
// Deduplicates by email to handle agents with multiple open tabs
router.get("/agent/online", protect, async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const onlineMap = io.onlineAgents ?? new Map();

    // Collect unique agents, excluding the requesting agent
    const seen = new Set();
    const agents = [];
    for (const agent of onlineMap.values()) {
      if (agent.agentEmail === req.user.email) continue; // skip self
      if (seen.has(agent.agentEmail)) continue;          // skip duplicates
      seen.add(agent.agentEmail);
      agents.push({ agentEmail: agent.agentEmail, agentName: agent.agentName });
    }

    res.json({ success: true, data: agents });
  } catch (err) {
    next(err);
  }
});

// ── Chat Transfer: Reassign an active conversation to another agent ────────
const transferSchema = z.object({
  body: z.object({
    targetAgentEmail: z.string().email({ message: "Valid agent email required" }),
    note: z.string().max(500).nullable().optional()
  }),
  params: z.object({ id: z.string() })
});

router.post(
  "/agent/conversations/:id/transfer",
  protect,
  validate(transferSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { targetAgentEmail, note } = req.body;
      const fromEmail = req.user.email;

      if (fromEmail === targetAgentEmail) {
        return res.status(400).json({
          success: false,
          message: "You cannot transfer a conversation to yourself."
        });
      }

      const ok = await transferConversation(id, targetAgentEmail);
      if (!ok) {
        return res.status(409).json({
          success: false,
          message: "Transfer failed. Conversation may not be active."
        });
      }

      const auditDetail = `From: ${fromEmail} → To: ${targetAgentEmail}${
        note ? `. Note: ${note}` : ""
      }`;
      await logAuditAction(id, "conversation_transferred", auditDetail);

      const io = req.app.get("io");
      if (io && io.onlineAgents) {
        // Notify the target agent on their specific socket
        for (const [socketId, agent] of io.onlineAgents.entries()) {
          if (agent.agentEmail === targetAgentEmail) {
            io.to(socketId).emit("chat:transferred-to-you", {
              conversationId: id,
              fromAgent: fromEmail,
              note: note ?? null
            });
            break; // one notification per transfer is enough
          }
        }
        io.emit("queue:update"); // refresh all agent queues
      }

      res.json({ success: true, message: "Conversation transferred successfully." });
    } catch (err) {
      next(err);
    }
  }
);

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
