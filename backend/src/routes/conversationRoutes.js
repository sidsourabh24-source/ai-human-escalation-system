import { Router } from "express";
import { getConversationTranscript } from "../services/conversationService.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/conversations/:id/transcript", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Conversation ID is required" });
    }

    const transcript = await getConversationTranscript(id);

    return res.json({
      success: true,
      data: transcript
    });
  } catch (err) {
    next(err);
  }
});

export default router;
