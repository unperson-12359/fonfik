-- ============================================
-- RATE LIMITS: Persistent rate limiting for serverless
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- Auto-cleanup old entries every hour (optional, keeps table small)
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);
