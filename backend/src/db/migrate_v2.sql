-- ============================================================
-- Migration v2: Add columns for 6 new professional features
-- Compatible with MySQL 5.7+ and MySQL 8.x
-- Run ONCE against your existing ai_app database
-- ============================================================

-- Step 1: Expand status ENUM to include 'resolved'
ALTER TABLE conversations
  MODIFY COLUMN status ENUM('ai_active','handoff_pending','agent_active','resolved','closed') DEFAULT 'ai_active';

-- Step 2: Feature 1 — Resolution tracking
ALTER TABLE conversations
  ADD COLUMN resolved_at TIMESTAMP NULL,
  ADD COLUMN resolve_validated_by ENUM('user','system') NULL;

-- Step 3: Feature 4 — Agent ownership locking
ALTER TABLE conversations
  ADD COLUMN claimed_by INT NULL,
  ADD COLUMN claimed_by_email VARCHAR(190) NULL;

-- Step 4: Add FK constraint for claimed_by
ALTER TABLE conversations
  ADD CONSTRAINT fk_conv_claimed_by FOREIGN KEY (claimed_by) REFERENCES agents(id) ON DELETE SET NULL;

-- Step 5: Feature 5 — Customer identity
ALTER TABLE conversations
  ADD COLUMN customer_name VARCHAR(150) NULL,
  ADD COLUMN customer_email VARCHAR(190) NULL;
