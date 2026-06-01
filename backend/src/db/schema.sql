-- ============================================================
-- AI-Human Escalation System — PostgreSQL Schema
-- Suitable for Supabase / PostgreSQL 12+
-- ============================================================

CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(64) PRIMARY KEY,
  status VARCHAR(30) DEFAULT 'ai_active' CHECK (status IN ('ai_active', 'handoff_pending', 'agent_active', 'resolved', 'closed')),
  customer_name VARCHAR(150) NULL,
  customer_email VARCHAR(190) NULL,
  claimed_by INT NULL,
  claimed_by_email VARCHAR(190) NULL,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  resolve_validated_by VARCHAR(20) CHECK (resolve_validated_by IN ('user', 'system')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claimed_by) REFERENCES agents(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant', 'agent')),
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS escalations (
  id BIGSERIAL PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  anger BOOLEAN DEFAULT FALSE,
  confusion BOOLEAN DEFAULT FALSE,
  buying_intent BOOLEAN DEFAULT FALSE,
  manual_request BOOLEAN DEFAULT FALSE,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  summary TEXT,
  crm_sync_status VARCHAR(20) DEFAULT 'pending' CHECK (crm_sync_status IN ('pending', 'mocked', 'synced', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Trigger to automatically update updated_at for conversations on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
