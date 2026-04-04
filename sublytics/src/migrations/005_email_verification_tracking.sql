-- ============================================================
-- Sublytics - Email Verification & Invite Tracking
-- Migration 005
-- ============================================================

-- Add email_verified column to track if user has completed setup
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Add invited_at column to track when invitation was sent
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Add invited_by column to track who sent the invitation
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.user_profiles(id);

-- Add last_invite_sent_at for resend tracking
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS last_invite_sent_at TIMESTAMPTZ;

-- Update existing users to be verified (they already have accounts)
UPDATE public.user_profiles 
SET email_verified = true 
WHERE email_verified = false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified 
ON public.user_profiles(email_verified);

CREATE INDEX IF NOT EXISTS idx_user_profiles_invited_at 
ON public.user_profiles(invited_at DESC);

-- Add comment
COMMENT ON COLUMN public.user_profiles.email_verified IS 'True if user has completed password setup and verified their email';
COMMENT ON COLUMN public.user_profiles.invited_at IS 'Timestamp when the user was first invited';
COMMENT ON COLUMN public.user_profiles.invited_by IS 'User ID of the admin who sent the invitation';
COMMENT ON COLUMN public.user_profiles.last_invite_sent_at IS 'Timestamp of the last invitation email sent';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Email verification tracking added successfully!';
  RAISE NOTICE 'New columns:';
  RAISE NOTICE '- email_verified: Track password setup completion';
  RAISE NOTICE '- invited_at: Track first invitation timestamp';
  RAISE NOTICE '- invited_by: Track who sent the invitation';
  RAISE NOTICE '- last_invite_sent_at: Track last invite resend';
END $$;
