import { Router } from "express";
import { getPendingQueue, claimConversation, logAuditAction } from "../services/conversationService.js";
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

router.post("/agent/claim", protect, async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ success: false, message: "Conversation ID is required" });
    }
    await claimConversation(conversationId);
    await logAuditAction(conversationId, "agent_claimed", `Agent: ${req.user.email || req.user.id}`);
    
    res.json({ success: true, message: "Conversation claimed" });
  } catch (err) {
    next(err);
  }
});

export default router;
