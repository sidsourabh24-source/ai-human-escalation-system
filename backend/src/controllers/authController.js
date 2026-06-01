import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import pool from "../config/db.js";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const { rows } = await pool.query("SELECT * FROM agents WHERE email = $1", [email]);
    const agent = rows[0];

    if (!agent) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, agent.password_hash);

    if (isMatch) {
      const token = jwt.sign(
        { id: agent.id, email: agent.email, name: agent.name, role: agent.role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn }
      );

      return res.json({
        success: true,
        data: {
          token,
          user: { id: agent.id, email: agent.email, name: agent.name, role: agent.role }
        }
      });
    }

    return res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    next(error);
  }
};
