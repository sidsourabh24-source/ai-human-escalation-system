import express from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { login } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 failed attempts per IP
  message: { success: false, message: "Too many login attempts, please try again later." }
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters")
  })
});

router.post("/auth/login", loginLimiter, validate(loginSchema), login);

export default router;
