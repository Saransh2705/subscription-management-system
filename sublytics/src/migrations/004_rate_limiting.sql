-- ============================================================
-- Sublytics - Rate Limiting System
-- Migration 004
-- ============================================================

-- Create enum for attempt types
CREATE TYPE attempt_type AS ENUM ('login', 'password_reset', 'magic_link');

-- Create enum for block reasons
CREATE TYPE block_reason AS ENUM ('too_many_attempts', 'suspicious_activity', 'manual_block');

-- Rate limit attempts tracking table
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  email TEXT,
  user_id UUID,
  attempt_type attempt_type NOT NULL DEFAULT 'login',
  success BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IP blocks table
CREATE TABLE IF NOT EXISTS public.ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason block_reason NOT NULL,
  blocked_until TIMESTAMPTZ,
  blocked_by UUID REFERENCES public.user_profiles(id),
  notes TEXT,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_rate_limit_ip ON public.rate_limit_attempts(ip_address, created_at DESC);
CREATE INDEX idx_rate_limit_email ON public.rate_limit_attempts(email, created_at DESC);
CREATE INDEX idx_rate_limit_created ON public.rate_limit_attempts(created_at DESC);
CREATE INDEX idx_ip_blocks_address ON public.ip_blocks(ip_address);
CREATE INDEX idx_ip_blocks_active ON public.ip_blocks(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Rate limit attempts: Only SYSTEM_ADMIN can view
CREATE POLICY "Only SYSTEM_ADMIN can view rate limit attempts"
  ON public.rate_limit_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'SYSTEM_ADMIN' AND is_active = true
    )
  );

-- Service role can insert attempts (for tracking)
CREATE POLICY "Service role can insert rate limit attempts"
  ON public.rate_limit_attempts
  FOR INSERT
  WITH CHECK (true);

-- IP blocks: Only SYSTEM_ADMIN can view
CREATE POLICY "Only SYSTEM_ADMIN can view IP blocks"
  ON public.ip_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'SYSTEM_ADMIN' AND is_active = true
    )
  );

-- SYSTEM_ADMIN can insert IP blocks
CREATE POLICY "SYSTEM_ADMIN can insert IP blocks"
  ON public.ip_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'SYSTEM_ADMIN' AND is_active = true
    )
  );

-- SYSTEM_ADMIN can update IP blocks
CREATE POLICY "SYSTEM_ADMIN can update IP blocks"
  ON public.ip_blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'SYSTEM_ADMIN' AND is_active = true
    )
  );

-- SYSTEM_ADMIN can delete IP blocks
CREATE POLICY "SYSTEM_ADMIN can delete IP blocks"
  ON public.ip_blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'SYSTEM_ADMIN' AND is_active = true
    )
  );

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(check_ip INET)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.ip_blocks
    WHERE ip_address = check_ip
    AND (
      is_permanent = true 
      OR (blocked_until IS NOT NULL AND blocked_until > now())
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get failed attempts count in last N minutes
CREATE OR REPLACE FUNCTION public.get_failed_attempts_count(
  check_ip INET,
  check_email TEXT,
  minutes_ago INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.rate_limit_attempts
  WHERE 
    (ip_address = check_ip OR email = check_email)
    AND success = false
    AND created_at > (now() - (minutes_ago || ' minutes')::INTERVAL);
  
  RETURN attempt_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-block IP after threshold
CREATE OR REPLACE FUNCTION public.auto_block_ip_if_threshold_exceeded()
RETURNS TRIGGER AS $$
DECLARE
  failed_count INTEGER;
  max_attempts INTEGER := 5; -- Max failed attempts in 15 minutes
  block_duration INTEGER := 60; -- Block for 60 minutes
BEGIN
  -- Only check on failed attempts
  IF NEW.success = false THEN
    -- Count recent failed attempts from this IP
    SELECT COUNT(*) INTO failed_count
    FROM public.rate_limit_attempts
    WHERE ip_address = NEW.ip_address
    AND success = false
    AND created_at > (now() - INTERVAL '15 minutes');
    
    -- If threshold exceeded, auto-block the IP
    IF failed_count >= max_attempts THEN
      INSERT INTO public.ip_blocks (ip_address, reason, blocked_until, is_permanent)
      VALUES (
        NEW.ip_address,
        'too_many_attempts',
        now() + (block_duration || ' minutes')::INTERVAL,
        false
      )
      ON CONFLICT (ip_address) DO UPDATE
      SET 
        blocked_until = now() + (block_duration || ' minutes')::INTERVAL,
        reason = 'too_many_attempts',
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-blocking
CREATE TRIGGER trigger_auto_block_ip
  AFTER INSERT ON public.rate_limit_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_block_ip_if_threshold_exceeded();

-- Function to cleanup old attempts (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limit_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts
  WHERE created_at < (now() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.rate_limit_attempts IS 'Tracks all authentication attempts for rate limiting and security monitoring';
COMMENT ON TABLE public.ip_blocks IS 'Manages IP address blocks for security';
COMMENT ON FUNCTION public.is_ip_blocked IS 'Check if an IP address is currently blocked';
COMMENT ON FUNCTION public.get_failed_attempts_count IS 'Get count of failed attempts from IP or email in last N minutes';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Rate limiting system created successfully!';
  RAISE NOTICE 'Configuration:';
  RAISE NOTICE '- Max failed attempts: 5 in 15 minutes';
  RAISE NOTICE '- Auto-block duration: 60 minutes';
  RAISE NOTICE '- Attempt history retention: 30 days';
  RAISE NOTICE '- Only SYSTEM_ADMIN can view/manage rate limit data';
END $$;
