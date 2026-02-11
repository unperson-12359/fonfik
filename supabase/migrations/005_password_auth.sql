-- Add password_hash column for email/password authentication
ALTER TABLE public.users ADD COLUMN password_hash TEXT;
