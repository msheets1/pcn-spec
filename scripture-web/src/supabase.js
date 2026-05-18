import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Set this to your Google email to unlock the admin invite panel
// Change before deploying, or use the VITE_ADMIN_EMAIL env var
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''
