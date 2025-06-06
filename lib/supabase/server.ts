import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Hent Supabase URL og Anon Key fra miljøvariabler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Sjekk om variablene er satt
if (!supabaseUrl) {
  throw new Error("Miljøvariabel NEXT_PUBLIC_SUPABASE_URL mangler.")
}
if (!supabaseAnonKey) {
  throw new Error("Miljøvariabel NEXT_PUBLIC_SUPABASE_ANON_KEY mangler.")
}

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
