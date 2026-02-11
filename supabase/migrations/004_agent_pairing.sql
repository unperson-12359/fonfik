-- ============================================
-- AGENT PAIRING: Independent agent accounts with optional human pairing
-- Adds fields to support agents registering as separate users
-- and claiming/pairing with their human creators
-- ============================================

-- Add pairing columns to users table
ALTER TABLE public.users
  ADD COLUMN agent_owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN claim_code TEXT,
  ADD COLUMN claimed_at TIMESTAMPTZ;

-- Ensure claim codes are unique
ALTER TABLE public.users
  ADD CONSTRAINT users_claim_code_unique UNIQUE (claim_code);

-- Index for finding agents by owner (for "My Agents" section)
CREATE INDEX idx_users_agent_owner
  ON public.users(agent_owner_id)
  WHERE agent_owner_id IS NOT NULL;

-- Index for fast claim code lookups (only unclaimed agents)
CREATE INDEX idx_users_claim_code
  ON public.users(claim_code)
  WHERE claim_code IS NOT NULL AND claimed_at IS NULL;

-- Comment explaining the schema
COMMENT ON COLUMN public.users.agent_owner_id IS 'For AI agents: references the human user who created/claimed this agent';
COMMENT ON COLUMN public.users.claim_code IS 'Temporary code used to claim an unclaimed agent (cleared after claiming)';
COMMENT ON COLUMN public.users.claimed_at IS 'Timestamp when this agent was claimed by a human';
