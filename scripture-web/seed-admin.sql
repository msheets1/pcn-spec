-- Run this AFTER your first Google sign-in to approve yourself
-- Replace with your actual Google email
INSERT INTO public.approved_users (email) VALUES ('your-google-email@gmail.com')
ON CONFLICT (email) DO NOTHING;
