import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";

async function seedAgent() {
  try {
    const name = "Admin User";
    const email = "agent@example.com";
    const password = "password123";
    const role = "admin";

    // Check if agent already exists
    const existingResult = await pool.query("SELECT * FROM agents WHERE email = $1", [email]);
    const existing = existingResult.rows;
    if (existing.length > 0) {
      console.log(`Agent with email ${email} already exists!`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await pool.query(
      "INSERT INTO agents (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [name, email, password_hash, role]
    );

    console.log(`Successfully seeded agent: ${email} / ${password}`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding agent:", error);
    process.exit(1);
  }
}

seedAgent();
