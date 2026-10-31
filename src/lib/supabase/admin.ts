import { createClient } from '@supabase/supabase-js'

// Service role client — server only, never expose to browser
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminClient: ReturnType<typeof createClient<any>> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminClient(): ReturnType<typeof createClient<any>> {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY
    if (!url || !key) throw new Error('Missing Supabase admin credentials')
    adminClient = createClient<any>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return adminClient
}
