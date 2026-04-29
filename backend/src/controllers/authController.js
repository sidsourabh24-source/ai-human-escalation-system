import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Mock user until DB is connected
const MOCK_AGENT = {
  id: 1,
  email: "agent@example.com",
  password: "password123", // In a real app, this would be a hashed password, and we'd use bcrypt.compare
  role: "agent"
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (email === MOCK_AGENT.email && password === MOCK_AGENT.password) {
      const token = jwt.sign(
        { id: MOCK_AGENT.id, role: MOCK_AGENT.role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn }
      );

      return res.json({
        success: true,
        data: {
          token,
          user: { id: MOCK_AGENT.id, email: MOCK_AGENT.email, role: MOCK_AGENT.role }
        }
      });
    }

    return res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    next(error);
  }
};
