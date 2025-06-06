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

// Ny funksjon for å hente autentisert bruker med rolle
export async function getAuthenticatedUserWithRole() {
  const supabase = createSupabaseServerClient(); // Bruker eksisterende funksjon
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, role: null, error: authError || new Error('User not authenticated') };
  }

  // Hent rolle fra 'profiles'-tabellen
  // Antar at 'profiles'-tabellen har en 'id' (UUID) som matcher auth.users.id
  // og en 'role' (TEXT) kolonne.
  const { data: profile, error: profileError } = await supabase
    .from('profiles') // Sørg for at tabellnavnet 'profiles' er korrekt
    .select('role')   // Sørg for at kolonnenavnet 'role' er korrekt
    .eq('id', user.id)
    .single();

  if (profileError) {
    if (profileError.code === 'PGRST116') { // Profile not found
      console.warn(`RBAC: Profile not found for user ${user.id}. User has no specific role assigned.`);
      // For admin-endepunkter betyr dette vanligvis ingen tilgang.
      return { user, role: null, error: new Error('Profile not found, role cannot be determined.') };
    }
    console.error('RBAC: Error fetching user profile for role:', profileError);
    return { user, role: null, error: profileError };
  }

  return { user, role: profile?.role || null, error: null };
}
