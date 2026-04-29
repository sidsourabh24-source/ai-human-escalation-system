import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

router.get("/health", async (req, res) => {
  let dbStatus = "disconnected";
  try {
    const connection = await pool.getConnection();
    dbStatus = "connected";
    connection.release();
  } catch (error) {
    dbStatus = "error: " + error.message;
  }

  res.json({
    success: true,
    service: "ai-human-escalation-backend",
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

export default router;
