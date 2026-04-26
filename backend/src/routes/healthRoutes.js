import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "ai-human-escalation-backend",
    timestamp: new Date().toISOString()
  });
});

export default router;
