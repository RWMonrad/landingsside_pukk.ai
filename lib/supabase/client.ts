import { createBrowserClient } from '@supabase/ssr'

// Hent Supabase URL og Anon Key fra miljøvariabler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Sjekk om variablene er satt, og kast en feil hvis ikke
if (!supabaseUrl) {
  throw new Error("Miljøvariabel NEXT_PUBLIC_SUPABASE_URL mangler.")
}
if (!supabaseAnonKey) {
  throw new Error("Miljøvariabel NEXT_PUBLIC_SUPABASE_ANON_KEY mangler.")
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}
